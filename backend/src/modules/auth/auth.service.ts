import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as argon2 from 'argon2';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { saveToOutbox } from '../../shared/infrastructure/outbox/outbox';
import { PrismaService } from '../../shared/infrastructure/prisma/prisma.service';
import { DomainEvent } from '../../shared/domain/domain-event';
import { LoginDto, RegisterDto, TokenPair } from './dto/auth.dto';

class UserRegistered extends DomainEvent<{ userId: string; channel: string }> {
  readonly type = 'user.registered';
  readonly topic = 'pg.user.events';
}

const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');
const ARGON = { type: argon2.argon2id, memoryCost: 65_536, timeCost: 3, parallelism: 1 } as const;

@Injectable()
export class AuthService {
  private readonly accessTtl = Number(process.env.JWT_ACCESS_TTL ?? 900);
  private readonly refreshTtlMs = Number(process.env.REFRESH_TTL_DAYS ?? 30) * 86_400_000;
  /** Hash real usado quando o e-mail não existe, para igualar o tempo de resposta. */
  private readonly dummyHash = argon2.hash(randomUUID(), ARGON);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto, ctx: { ip?: string; ua?: string }): Promise<TokenPair> {
    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
      select: { id: true },
    });
    if (exists) throw new ConflictException('E-mail ou telefone já cadastrado');

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email.toLowerCase(),
          phone: dto.phone,
          passwordHash: await argon2.hash(dto.password, ARGON),
          loyalty: { create: {} },
        },
      });
      await saveToOutbox(tx, [new UserRegistered('user', created.id, { userId: created.id, channel: 'email' })]);
      return created;
    });
    return this.issueTokens(user, randomUUID(), ctx);
  }

  async login(dto: LoginDto, ctx: { ip?: string; ua?: string }): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    // Mensagem genérica e verificação de hash mesmo sem usuário (evita enumeração por tempo)
    const hash = user?.passwordHash ?? (await this.dummyHash);
    const ok = await argon2.verify(hash, dto.password).catch(() => false);
    if (!user || !ok || user.status !== 'ACTIVE') throw new UnauthorizedException('Credenciais inválidas');
    // TODO: se user.mfaSecret → retornar { mfaRequired, mfaToken } em vez dos tokens
    return this.issueTokens(user, randomUUID(), ctx);
  }

  /** Rotação de refresh token com detecção de reuso (OAuth 2.0 Security BCP). */
  async refresh(refreshToken: string, ctx: { ip?: string; ua?: string }): Promise<TokenPair> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: sha256(refreshToken) },
      include: { user: true },
    });
    if (!stored || stored.expiresAt < new Date()) throw new UnauthorizedException('Sessão expirada');

    if (stored.revokedAt) {
      // Token já usado: possível roubo → revoga a família inteira
      await this.prisma.refreshToken.updateMany({
        where: { familyId: stored.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Sessão revogada por segurança. Faça login novamente.');
    }

    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    return this.issueTokens(stored.user, stored.familyId, ctx);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: sha256(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokens(user: User, familyId: string, ctx: { ip?: string; ua?: string }): Promise<TokenPair> {
    const memberships = await this.prisma.restaurantMember.findMany({
      where: { userId: user.id },
      select: { restaurantId: true },
    });
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, roles: user.roles, rid: memberships.map((m) => m.restaurantId), jti: randomUUID() },
      { expiresIn: this.accessTtl, audience: 'pg-api', issuer: 'pg-auth' },
    );
    const refreshToken = randomBytes(48).toString('base64url');
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        familyId,
        tokenHash: sha256(refreshToken),
        ip: ctx.ip,
        userAgent: ctx.ua?.slice(0, 255),
        expiresAt: new Date(Date.now() + this.refreshTtlMs),
      },
    });
    return { accessToken, refreshToken, expiresIn: this.accessTtl };
  }
}
