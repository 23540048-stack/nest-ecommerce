import {
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsMongoId,
} from 'class-validator';
import { BadgeLabel } from '../schemas/featured-product.schema';

export class CreateFeaturedProductDto {
  @IsMongoId({ message: 'Invalid Product ID' })
  @IsNotEmpty({ message: 'Product is required' })
  productId!: string;

  @IsEnum(BadgeLabel, { message: 'Invalid badge label' })
  @IsNotEmpty()
  badgeLabel!: BadgeLabel;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @IsOptional()
  @IsString()
  status?: string;
}
