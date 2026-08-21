import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Name cannot be empty.' })
  name!: string;

  @IsEmail({}, { message: 'Invalid email address.' })
  @IsNotEmpty({ message: 'Email cannot be empty.' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Password should not be empty' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{6,}$/, {
    message:
      'Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, and one special character',
  })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'Please re-enter your password confirmation.' })
  confirmPassword!: string;
}
