import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

export type CategoryStatusType = 'ACTIVE' | 'INACTIVE';

export class CreateCategoryDto {
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  name!: string;

  @IsString({ message: 'Slug must be a string' })
  @IsNotEmpty({ message: 'Slug is required' })
  slug?: string;

  @IsString({ message: 'Icon must be a string' })
  @IsOptional()
  image?: string;

  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  description?: string;

  @IsEnum(['ACTIVE', 'INACTIVE'], {
    message: 'Status must be ACTIVE or INACTIVE',
  })
  @IsOptional()
  status?: CategoryStatusType;

  @IsOptional()
  @IsString()
  hoverColor?: string;
}
