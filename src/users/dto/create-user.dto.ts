import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Name cannot be empty' })
  name!: string;

  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty()
  email!: string;

  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @IsNotEmpty()
  password!: string;
}
