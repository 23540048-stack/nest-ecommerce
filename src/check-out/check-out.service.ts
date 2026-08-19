import { Injectable, BadRequestException } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { ProcessCheckoutDto } from './dto/check-out.dto';
import { PaymentMethod } from '../orders/schemas/order.schema';

@Injectable()
export class CheckoutService {
  constructor(private readonly ordersService: OrdersService) {}

  async processCheckout(userId: string, dto: ProcessCheckoutDto) {
    if (dto.paymentMethod === PaymentMethod.VNPAY) {
      throw new BadRequestException(
        'VNPay payment method is currently under maintenance. Please select COD.',
      );
    }

    const newOrder = await this.ordersService.createOrder(userId, dto);

    return {
      message: 'Order placed successfully',
      paymentMethod: PaymentMethod.COD,
      order: newOrder,
    };
  }
}
