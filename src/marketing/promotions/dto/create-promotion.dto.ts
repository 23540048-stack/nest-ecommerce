import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  DiscountType,
  PromotionMediaType,
  PromotionStatus,
} from '../schemas/promotion.schema';

export class CreatePromotionDto {
  @IsNotEmpty()
  @IsString()
  code!: string;

  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsEnum(DiscountType)
  discountType!: DiscountType;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  discountValue!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @IsEnum(PromotionMediaType)
  mediaType!: PromotionMediaType;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsEnum(PromotionStatus)
  status!: PromotionStatus;

  @IsNotEmpty()
  startDate!: string;

  @IsOptional()
  endDate?: string;
}
