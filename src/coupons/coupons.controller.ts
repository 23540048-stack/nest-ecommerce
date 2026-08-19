import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';

import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ApplyCouponDto } from './dto/apply-coupon.dto';

// Import Guards & Decorators
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { ClientAuthGuard } from '../auth/guards/client-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  // =========================================================
  // ADMIN - CREATE COUPON
  // =========================================================

  @Post()
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  createCoupon(@Body() dto: CreateCouponDto) {
    return this.couponsService.createCoupon(dto);
  }

  // =========================================================
  // ADMIN - GET ALL COUPONS
  // =========================================================

  @Get()
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getAllCoupons(@Query('search') search?: string) {
    return this.couponsService.getAllCoupons(search);
  }

  // =========================================================
  // PUBLIC - GET AVAILABLE COUPONS
  // =========================================================

  @Get('public')
  getPublicCoupons() {
    return this.couponsService.getPublicCoupons();
  }

  // =========================================================
  // APPLY COUPON (Khách hàng áp dụng mã giảm giá khi đặt hàng)
  // =========================================================

  @Post('apply')
  @UseGuards(ClientAuthGuard)
  applyCoupon(@Req() req: any, @Body() dto: ApplyCouponDto) {
    const userId = req.user?.userId || req.user?.sub;
    return this.couponsService.validateAndCalculateDiscount(
      dto.code,
      userId,
      dto.orderValue,
    );
  }

  // =========================================================
  // ADMIN - UPDATE COUPON
  // =========================================================

  @Put(':id')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateCoupon(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.couponsService.updateCoupon(id, dto);
  }

  // =========================================================
  // ADMIN - TOGGLE STATUS
  // =========================================================

  @Patch(':id/toggle')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  toggleActiveStatus(@Param('id') id: string) {
    return this.couponsService.toggleActiveStatus(id);
  }

  // =========================================================
  // ADMIN - DELETE COUPON
  // =========================================================

  @Delete(':id')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  deleteCoupon(@Param('id') id: string) {
    return this.couponsService.deleteCoupon(id);
  }
}
