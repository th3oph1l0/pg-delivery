import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { Request } from 'express';

export interface AuthUser {
  sub: string;
  roles: UserRole[];
  /** IDs de restaurantes dos quais o usuário é membro (claim `rid`). */
  rid?: string[];
  jti: string;
}

export const IS_PUBLIC = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC, true);

export const ROLES = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES, roles);

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthUser => {
  return ctx.switchToHttp().getRequest<Request & { user: AuthUser }>().user;
});

/** Guard global: valida o JWT (exceto rotas @Public) e aplica RBAC (@Roles). */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const targets = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets)) return true;

    const req = ctx.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const [scheme, token] = (req.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException('Token ausente');

    try {
      req.user = await this.jwt.verifyAsync<AuthUser>(token, { audience: 'pg-api', issuer: 'pg-auth' });
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
    // TODO: checar denylist de jti no Redis (logout/revogação)

    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES, targets);
    if (required?.length && !required.some((r) => req.user!.roles.includes(r))) {
      throw new ForbiddenException('Permissão insuficiente');
    }
    return true;
  }
}

/** Verificação de posse (anti-BOLA) para rotas /merchant/:rid/... */
export function assertMerchantAccess(user: AuthUser, restaurantId: string): void {
  if (user.roles.includes('ADMIN')) return;
  if (!user.rid?.includes(restaurantId)) throw new ForbiddenException('Sem acesso a este estabelecimento');
}
