import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';

// Import ClientAuthGuard
import { ClientAuthGuard } from '../auth/guards/client-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // USER: Tạo URL chuyển sang trang thanh toán VNPay
  @Post('vnpay-url')
  @UseGuards(ClientAuthGuard)
  createVnpayUrl(@Req() req: any, @Body('orderId') orderId: string) {
    return this.paymentsService.createVnpayUrl(req, orderId);
  }

  // PUBLIC: VNPay callback trả kết quả về (Không cần Guard)
  @Get('vnpay-return')
  vnpayReturn(@Query() query: any) {
    return this.paymentsService.handleVnpayReturn(query);
  }
}
