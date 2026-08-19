import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { PaymentMethod } from '../schemas/order.schema';

export class CreateOrderDto {
  @IsNotEmpty()
  @IsString()
  shippingAddress!: string;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod = PaymentMethod.COD;
}
