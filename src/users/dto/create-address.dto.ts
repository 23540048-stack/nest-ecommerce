import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreateAddressDto {
  @IsNotEmpty({ message: 'Recipient name cannot be empty' })
  @IsString()
  receiverName!: string;

  @IsNotEmpty({ message: 'Phone number cannot be empty' })
  @IsString()
  @Matches(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, {
    message: 'Invalid phone number!',
  })
  phone!: string;

  @IsNotEmpty({ message: 'Detailed address cannot be empty' })
  @IsString()
  fullAddress!: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
