import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty({ message: 'Token cannot be empty.' })
  @IsString()
  token!: string;

  @IsNotEmpty({ message: 'Please enter a new password.' })
  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters long.' })
  newPassword!: string;
}
