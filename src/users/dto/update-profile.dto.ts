import { IsOptional, IsString, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, {
    message: 'Invalid phone number!',
  })
  phone?: string;
}
