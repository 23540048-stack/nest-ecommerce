import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';

// Import Guards & Decorators
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@Controller('reports')
@UseGuards(AdminAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // GET /reports/overview - Tổng quan doanh thu, đơn hàng, người dùng
  @Get('overview')
  async getOverview() {
    return this.reportsService.getOverviewStats();
  }

  // GET /reports/revenue?startDate=2026-01-01&endDate=2026-08-01 - Doanh thu theo ngày
  @Get('revenue')
  async getRevenue(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getRevenueByDateRange(startDate, endDate);
  }

  // GET /reports/top-products?limit=5 - Top sản phẩm bán chạy
  @Get('top-products')
  async getTopProducts(@Query('limit') limit?: number) {
    return this.reportsService.getTopSellingProducts(limit || 5);
  }

  // GET /reports/order-status - Tỷ lệ trạng thái đơn hàng (PENDING, DELIVERED...)
  @Get('order-status')
  async getOrderStatus() {
    return this.reportsService.getOrderStatusBreakdown();
  }

  // GET /reports/membership-distribution - Tỷ lệ các hạng thành viên
  @Get('membership-distribution')
  async getMembershipDistribution() {
    return this.reportsService.getMembershipDistribution();
  }
}
