import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class MediaItemDto {
  @IsEnum(['image', 'video'])
  @IsOptional()
  type?: 'image' | 'video';

  @IsString()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  caption?: string;
}

export class CreateBannerDto {
  @IsString()
  title!: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  badge?: string;

  @IsString()
  @IsOptional()
  badgeText?: string;

  @IsString()
  @IsOptional()
  mediaUrl?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsEnum(['image', 'video'])
  @IsOptional()
  mediaType?: 'image' | 'video';

  @IsString()
  @IsOptional()
  linkUrl?: string;

  @IsEnum(['HOME_HERO', 'PROMO_BAR', 'CATEGORY_SIDEBAR', 'POPUP'])
  @IsOptional()
  location?: 'HOME_HERO' | 'PROMO_BAR' | 'CATEGORY_SIDEBAR' | 'POPUP';

  @IsString()
  @IsOptional()
  status?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaItemDto)
  items?: MediaItemDto[];
}
