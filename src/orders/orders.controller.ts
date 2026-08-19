import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { PaymentStatus } from './schemas/order.schema';

// Import các Guard và Decorator phân quyền
import { ClientAuthGuard } from '../auth/guards/client-auth.guard';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // 1. USER: Đặt hàng từ giỏ hàng hiện tại
  @Post()
  @UseGuards(ClientAuthGuard)
  createOrder(@Req() req: any, @Body() createOrderDto: CreateOrderDto) {
    const userId = req.user?.userId || req.user?.sub;
    return this.ordersService.createOrder(userId, createOrderDto);
  }

  // 2. USER: Xem danh sách đơn hàng của chính mình
  @Get()
  @UseGuards(ClientAuthGuard)
  getUserOrders(@Req() req: any) {
    const userId = req.user?.userId || req.user?.sub;
    return this.ordersService.getUserOrders(userId);
  }

  // 3. ADMIN ONLY: Xem tất cả đơn hàng (Đặt trước route :id để tránh ghi đè)
  @Get('admin')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getAllOrders() {
    return this.ordersService.getAllOrders();
  }

  // 4. USER/ADMIN: Xem chi tiết 1 đơn hàng cụ thể
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getOrderById(@Req() req: any, @Param('id') orderId: string) {
    const userId = req.user?.userId || req.user?.sub;
    return this.ordersService.getOrderById(userId, orderId);
  }

  // 5. USER: Gửi yêu cầu hủy đơn hàng (Cập nhật trạng thái thành CANCEL_REQUESTED)
  @Patch(':id/cancel-request')
  @UseGuards(ClientAuthGuard)
  requestCancelOrder(@Req() req: any, @Param('id') orderId: string) {
    const userId = req.user?.userId || req.user?.sub;
    return this.ordersService.requestCancelOrder(userId, orderId);
  }

  // 6. ADMIN ONLY: Cập nhật trạng thái đơn hàng (Tự tích điểm/nâng hạng khi DELIVERED)
  @Patch(':id/status')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateOrderStatus(
    @Param('id') orderId: string,
    @Body('status') status: string,
  ) {
    return this.ordersService.updateOrderStatus(orderId, status);
  }

  // 7. ADMIN ONLY: Cập nhật trạng thái thanh toán (UNPAID -> PAID / FAILED)
  @Patch(':id/payment-status')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updatePaymentStatus(
    @Param('id') orderId: string,
    @Body('paymentStatus') paymentStatus: PaymentStatus,
  ) {
    return this.ordersService.updatePaymentStatus(orderId, paymentStatus);
  }
}
