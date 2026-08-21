import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  Patch,
} from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';

@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post()
  create(@Body() createDto: CreatePromotionDto) {
    return this.promotionsService.create(createDto);
  }

  @Get()
  findAll(@Query('search') search?: string, @Query('status') status?: string) {
    return this.promotionsService.findAll(search, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.promotionsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdatePromotionDto) {
    return this.promotionsService.update(id, updateDto);
  }

  @Patch('apply/:code')
  applyPromotion(@Param('code') code: string) {
    return this.promotionsService.applyPromotion(code);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.promotionsService.remove(id);
  }
}
