import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty({ message: 'Please enter your current password' })
  @IsString()
  oldPassword!: string;

  @IsNotEmpty({ message: 'Please enter your new password.' })
  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  newPassword!: string;
}
