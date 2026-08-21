import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DiscountType } from '../schemas/coupon.schema';

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty({
    message: 'Coupon code is required',
  })
  code!: string;

  @IsString()
  @IsNotEmpty({
    message: 'Coupon title is required',
  })
  title!: string;

  @IsEnum(DiscountType, {
    message: 'Discount type must be PERCENTAGE or FIXED_AMOUNT',
  })
  discountType!: DiscountType;

  @Type(() => Number)
  @IsNumber()
  @Min(0, {
    message: 'Discount value cannot be negative',
  })
  @Max(100, {
    message: 'Percentage discount cannot exceed 100%',
  })
  discountValue!: number;

  /**
   * Minimum order value in USD.
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0, {
    message: 'Minimum order value cannot be negative',
  })
  minOrderValue?: number;

  /**
   * Maximum number of uses.
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1, {
    message: 'Maximum uses must be at least 1',
  })
  maxUses?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0, {
    message: 'Maximum discount amount cannot be negative',
  })
  maxDiscountAmount?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsNotEmpty({
    message: 'Start date is required',
  })
  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
