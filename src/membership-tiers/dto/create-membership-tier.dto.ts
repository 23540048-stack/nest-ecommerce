import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateMembershipTierDto {
  @IsString()
  name!: string;

  @IsNumber()
  minSpent!: number;

  @IsNumber()
  discountRate!: number;

  @IsNumber()
  pointsMultiplier!: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  perks?: string[];

  @IsString()
  @IsOptional()
  badgeColor?: string;

  // ⚠️ KHÔNG ĐƯỢC THIẾU FIELD NÀY (Nếu thiếu NestJS sẽ xóa khỏi request)
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  vouchers?: string[];
}
