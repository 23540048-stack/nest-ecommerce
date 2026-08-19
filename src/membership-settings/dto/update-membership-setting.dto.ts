import { IsNumber, IsBoolean, Min, IsOptional } from 'class-validator';

export class UpdateMembershipSettingDto {
  @IsNumber()
  @Min(1)
  @IsOptional()
  pointsRatio?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  pointRedeemValue?: number;

  @IsBoolean()
  @IsOptional()
  autoUpgrade?: boolean;
}
