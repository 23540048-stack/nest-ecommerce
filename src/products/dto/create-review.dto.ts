// dto/create-review.dto.ts
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReviewDto {
  @Type(() => Number)
  @IsNotEmpty({ message: 'Vui lòng chọn số sao đánh giá' })
  @IsNumber({}, { message: 'Số sao phải là một số' })
  @Min(1, { message: 'Số sao tối thiểu là 1' })
  @Max(5, { message: 'Số sao tối đa là 5' })
  rating!: number;

  @IsNotEmpty({ message: 'Nội dung nhận xét không được để trống' })
  @IsString()
  comment!: string;

  // Bổ sung 2 trường này để ValidationPipe cho phép đi qua
  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsString()
  itemId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  videos?: string[];
}
