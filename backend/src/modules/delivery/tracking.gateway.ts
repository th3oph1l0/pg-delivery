import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { KafkaService } from '../../shared/infrastructure/kafka/kafka.service';
import { PrismaService } from '../../shared/infrastructure/prisma/prisma.service';
import { RedisService } from '../../shared/infrastructure/redis/redis.service';
import { AuthUser } from '../../shared/presentation/auth';

interface LocationPing {
  lat: number;
  lng: number;
  heading?: number;
  speedKmh?: number;
  ts: number;
  deliveryId?: string;
  orderId?: string;
  city: string;
}

/**
 * Gateway de tempo real.
 * - Cliente: `subscribe:order` → recebe order:status, courier:location, order:eta
 * - Entregador: `courier:location` a cada ~4 s
 * Em produção usa @socket.io/redis-adapter para escalar horizontalmente.
 */
@WebSocketGateway({ namespace: '/rt', cors: { origin: (process.env.CORS_ORIGINS ?? '').split(',') } })
export class TrackingGateway implements OnGatewayConnection, OnModuleInit {
  private readonly logger = new Logger(TrackingGateway.name);
  @WebSocketServer() server: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
    private readonly kafka: KafkaService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = (client.handshake.auth?.token as string) ?? '';
      client.data.user = await this.jwt.verifyAsync<AuthUser>(token, { audience: 'pg-api', issuer: 'pg-auth' });
    } catch {
      client.emit('error', { code: 'UNAUTHORIZED' });
      client.disconnect(true);
    }
  }

  @SubscribeMessage('subscribe:order')
  async subscribeOrder(@ConnectedSocket() client: Socket, @MessageBody() body: { orderId: string }) {
    const user = client.data.user as AuthUser;
    const order = await this.prisma.order.findFirst({
      where: { id: body.orderId, customerId: user.sub },
      select: { id: true, status: true },
    });
    if (!order) throw new WsException('Pedido não encontrado');
    await client.join(`order:${order.id}`);
    const last = await this.redis.get(`order:track:${order.id}`);
    return { status: order.status, last: last ? JSON.parse(last) : null };
  }

  /** Painel do restaurante: recebe order:new e order:status da própria loja. */
  @SubscribeMessage('subscribe:merchant')
  async subscribeMerchant(@ConnectedSocket() client: Socket, @MessageBody() body: { restaurantId: string }) {
    const user = client.data.user as AuthUser;
    if (!user.roles.includes('ADMIN') && !user.rid?.includes(body.restaurantId)) throw new WsException('Sem acesso');
    await client.join(`restaurant:${body.restaurantId}`);
    return { ok: true };
  }

  @SubscribeMessage('courier:location')
  async courierLocation(@ConnectedSocket() client: Socket, @MessageBody() p: LocationPing) {
    const user = client.data.user as AuthUser;
    if (!user.roles.includes('COURIER')) throw new WsException('Somente entregadores');
    if (Math.abs(p.lat) > 90 || Math.abs(p.lng) > 180) throw new WsException('Coordenada inválida');
    // Anti-spoofing básico: velocidade implausível (> 130 km/h) é descartada e sinalizada
    if ((p.speedKmh ?? 0) > 130) return { ok: false };

    const courierId = user.sub;
    await this.redis
      .multi()
      .geoadd(`geo:couriers:${p.city}`, p.lng, p.lat, courierId)
      .hset(`courier:last:${courierId}`, { lat: p.lat, lng: p.lng, heading: p.heading ?? 0, ts: p.ts })
      .expire(`courier:last:${courierId}`, 120)
      .exec();

    // Fan-out imediato ao cliente (caminho quente) + Kafka para ETA, analytics e persistência amostrada
    if (p.orderId) {
      this.server.to(`order:${p.orderId}`).emit('courier:location', { lat: p.lat, lng: p.lng, heading: p.heading, ts: p.ts });
    }
    await this.kafka.publish('pg.courier.location', [
      { key: courierId, value: JSON.stringify({ type: 'courier.location.updated', data: { courierId, ...p } }) },
    ]);
    return { ok: true };
  }

  /** Projeta eventos de pedido nas salas dos clientes conectados. */
  async onModuleInit(): Promise<void> {
    if (process.env.KAFKA_CONSUMERS_ENABLED === 'false') return;
    await this.kafka.subscribe('realtime-order-projection', ['pg.order.events', 'pg.delivery.events'], async (event) => {
      const data = event.data as { orderId?: string; restaurantId?: string; to?: string; etaAt?: string };
      if (!data.orderId) return;
      const payload = { orderId: data.orderId, type: event.type, status: data.to, etaAt: data.etaAt, at: event.time };
      await this.redis.set(`order:track:${data.orderId}`, JSON.stringify(payload), 'EX', 21_600);
      this.server.to(`order:${data.orderId}`).emit(event.type === 'delivery.eta_updated' ? 'order:eta' : 'order:status', payload);
      if (data.restaurantId) {
        // order.paid = pedido novo e pago → alerta sonoro no painel
        this.server.to(`restaurant:${data.restaurantId}`).emit(event.type === 'order.paid' ? 'order:new' : 'order:status', payload);
      }
    });
    this.logger.log('Projeção realtime de pedidos ativa');
  }
}

@Module({ providers: [TrackingGateway] })
export class DeliveryModule {}
