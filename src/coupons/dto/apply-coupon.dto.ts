import { IsString, IsNumber, Min, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class ApplyCouponDto {
  @IsString()
  @IsNotEmpty({
    message: 'Coupon code is required.',
  })
  code!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  orderValue!: number;
}
