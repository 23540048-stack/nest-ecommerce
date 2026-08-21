import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';

export enum DiscountType {
  FIXED = 'FIXED',
  PERCENTAGE = 'PERCENTAGE',
}

export class CreateVoucherDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(DiscountType)
  @IsNotEmpty()
  discountType!: DiscountType;

  @IsNumber()
  @Min(0)
  discountValue?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  minOrderValue?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  maxDiscountAmount?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  usageLimit?: number;

  @IsDateString()
  @IsOptional()
  expirationDate?: string;

  @IsBoolean()
  @IsOptional()
  isChakraRedeemable?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  chakraCost?: number;
}
