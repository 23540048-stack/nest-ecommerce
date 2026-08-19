import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { PaymentMethod } from '../../orders/schemas/order.schema';

export class ProcessCheckoutDto {
  @IsNotEmpty({ message: 'Shipping address is required' })
  @IsString({ message: 'Shipping address must be a string' })
  shippingAddress!: string;

  @IsOptional()
  @IsString({ message: 'Coupon code must be a string' })
  couponCode?: string;

  @IsOptional()
  @IsEnum(PaymentMethod, { message: 'Invalid payment method' })
  paymentMethod?: PaymentMethod = PaymentMethod.COD;
}
