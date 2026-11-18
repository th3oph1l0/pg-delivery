import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Module,
  Param,
  ParseUUIDPipe,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { CommandBus, CqrsModule, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthUser, CurrentUser, Roles, assertMerchantAccess } from '../../shared/presentation/auth';
import { IdempotencyInterceptor } from '../../shared/presentation/idempotency.interceptor';
import { MerchantOrderActionCommand, MerchantOrderActionHandler } from './application/commands/merchant-actions';
import { PlaceOrderCommand, PlaceOrderHandler, PlaceOrderResult } from './application/commands/place-order';
import {
  GetOrderHandler,
  GetOrderQuery,
  ListMerchantOrdersHandler,
  ListMerchantOrdersQuery,
} from './application/queries/order.queries';
import { OrderRepository } from './domain/order.repository';
import { PrismaOrderRepository } from './infrastructure/prisma-order.repository';
import { AcceptOrderDto, PlaceOrderDto } from './presentation/dto/place-order.dto';

@ApiTags('orders')
@ApiBearerAuth()
@Controller({ path: 'orders', version: '1' })
export class OrdersController {
  constructor(
    private readonly commands: CommandBus,
    private readonly queries: QueryBus,
  ) {}

  @Post()
  @Roles('CUSTOMER')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseInterceptors(IdempotencyInterceptor)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  place(
    @CurrentUser() user: AuthUser,
    @Headers('idempotency-key') key: string,
    @Body() dto: PlaceOrderDto,
  ): Promise<PlaceOrderResult> {
    return this.commands.execute(new PlaceOrderCommand(user.sub, key, dto));
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.queries.execute(new GetOrderQuery(id, user.sub));
  }
}

@ApiTags('merchant')
@ApiBearerAuth()
@Roles('MERCHANT', 'ADMIN')
@Controller({ path: 'merchant/:rid/orders', version: '1' })
export class MerchantOrdersController {
  constructor(
    private readonly commands: CommandBus,
    private readonly queries: QueryBus,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Param('rid', ParseUUIDPipe) rid: string) {
    assertMerchantAccess(user, rid);
    return this.queries.execute(new ListMerchantOrdersQuery(rid));
  }

  @Post(':id/accept')
  @HttpCode(200)
  accept(
    @CurrentUser() user: AuthUser,
    @Param('rid', ParseUUIDPipe) rid: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AcceptOrderDto,
  ) {
    assertMerchantAccess(user, rid);
    return this.commands.execute(
      new MerchantOrderActionCommand(rid, id, user.sub, { kind: 'accept', prepMinutes: dto.prepMinutes }),
    );
  }

  @Post(':id/reject')
  @HttpCode(200)
  reject(
    @CurrentUser() user: AuthUser,
    @Param('rid', ParseUUIDPipe) rid: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
  ) {
    assertMerchantAccess(user, rid);
    return this.commands.execute(
      new MerchantOrderActionCommand(rid, id, user.sub, { kind: 'reject', reason: String(reason ?? 'unspecified').slice(0, 120) }),
    );
  }

  @Post(':id/ready')
  @HttpCode(200)
  ready(@CurrentUser() user: AuthUser, @Param('rid', ParseUUIDPipe) rid: string, @Param('id', ParseUUIDPipe) id: string) {
    assertMerchantAccess(user, rid);
    return this.commands.execute(new MerchantOrderActionCommand(rid, id, user.sub, { kind: 'ready' }));
  }
}

@Module({
  imports: [CqrsModule],
  controllers: [OrdersController, MerchantOrdersController],
  providers: [
    { provide: OrderRepository, useClass: PrismaOrderRepository },
    PlaceOrderHandler,
    MerchantOrderActionHandler,
    GetOrderHandler,
    ListMerchantOrdersHandler,
  ],
})
export class OrderModule {}
