import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { CheckoutService } from './check-out.service';
import { ProcessCheckoutDto } from './dto/check-out.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('checkout')
@UseGuards(JwtAuthGuard)
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  async processCheckout(@Req() req, @Body() dto: ProcessCheckoutDto) {
    const userId = req.user.id || req.user._id;
    return this.checkoutService.processCheckout(userId, dto);
  }
}
