import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { VouchersService } from './vouchers.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';

// Import Guards & Decorators
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@Controller('vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  // Lấy danh sách Voucher (User & Admin đều xem được)
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.vouchersService.findAll();
  }

  // Lấy chi tiết 1 Voucher
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.vouchersService.findOne(id);
  }

  // Thêm Voucher mới (Chỉ Admin)
  @Post()
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateVoucherDto) {
    return this.vouchersService.create(dto);
  }

  // Cập nhật Voucher (Chỉ Admin)
  @Patch(':id')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateVoucherDto) {
    return this.vouchersService.update(id, dto);
  }

  // Xóa Voucher (Chỉ Admin)
  @Delete(':id')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.vouchersService.remove(id);
  }
}
