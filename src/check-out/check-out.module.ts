import { Module } from '@nestjs/common';
import { CheckoutController } from './check-out.controller';
import { CheckoutService } from './check-out.service';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [OrdersModule],
  controllers: [CheckoutController],
  providers: [CheckoutService],
})
export class CheckoutModule {}
