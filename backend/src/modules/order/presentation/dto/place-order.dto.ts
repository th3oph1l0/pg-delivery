import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export const PAYMENT_METHODS = ['PIX', 'CREDIT', 'DEBIT', 'GOOGLE_PAY', 'APPLE_PAY', 'WALLET'] as const;

export class OrderItemDto {
  @ApiProperty() @IsUUID() productId: string;
  @ApiProperty({ minimum: 1, maximum: 99 }) @IsInt() @Min(1) @Max(99) quantity: number;
  @ApiProperty({ type: [String] }) @IsUUID('all', { each: true }) @ArrayMaxSize(30) options: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(140) notes?: string;
}

export class PaymentDto {
  @ApiProperty({ enum: PAYMENT_METHODS }) @IsIn(PAYMENT_METHODS) method: (typeof PAYMENT_METHODS)[number];
  @ApiPropertyOptional() @IsOptional() @IsUUID() paymentMethodId?: string;
  @ApiPropertyOptional({ description: 'Token do Google/Apple Pay' }) @IsOptional() @IsString() token?: string;
}

export class PlaceOrderDto {
  @ApiProperty() @IsUUID() restaurantId: string;
  @ApiProperty() @IsUUID() addressId: string;

  @ApiProperty({ type: [OrderItemDto] })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  items: OrderItemDto[];

  @ApiProperty({ type: PaymentDto }) @ValidateNested() @Type(() => PaymentDto) payment: PaymentDto;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30) couponCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(280) notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(10_000) tipCents?: number;
}

export class AcceptOrderDto {
  @ApiProperty({ minimum: 1, maximum: 180 }) @IsInt() @Min(1) @Max(180) prepMinutes: number;
}
