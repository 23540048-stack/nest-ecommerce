import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OrderCompletedEvent } from '../orders/events/order-completed.event';
import { MembershipTiersService } from './membership-tiers.service';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';

@Injectable()
export class UserTierListener {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly tiersService: MembershipTiersService,
  ) {}

  // Hàm tự động chạy mỗi khi có sự kiện 'order.completed'
  @OnEvent('order.completed')
  async handleOrderCompletedEvent(event: OrderCompletedEvent) {
    const { userId } = event;

    try {
      // 1. Dùng Aggregate để tính TỔNG SỐ TIỀN của tất cả các đơn 'COMPLETED'
      const aggregateResult = await this.orderModel.aggregate([
        {
          $match: {
            userId: new Types.ObjectId(userId),
            status: 'COMPLETED',
          },
        },
        {
          $group: {
            _id: '$userId',
            totalSpent: { $sum: '$totalAmount' },
          },
        },
      ]);

      const totalSpent = aggregateResult[0]?.totalSpent || 0;

      // 2. Lấy Hạng phù hợp với số tiền đó
      const matchedTier = await this.tiersService.getTierBySpent(totalSpent);

      // 3. Kiểm tra an toàn: Nếu không tìm thấy Hạng phù hợp (matchedTier = null)
      if (!matchedTier) {
        await this.userModel.findByIdAndUpdate(userId, { totalSpent });
        console.warn(
          `[Cảnh báo] User ${userId} có tổng chi tiêu $${totalSpent} nhưng chưa tìm thấy Hạng phù hợp.`,
        );
        return;
      }

      // 4. Cập nhật totalSpent và Hạng mới vào User
      await this.userModel.findByIdAndUpdate(userId, {
        totalSpent: totalSpent,
        membershipTier: matchedTier._id,
      });

      console.log(
        `[Thành công] User ${userId} đã tiêu $${totalSpent} -> Lên hạng: ${matchedTier.name}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`[Lỗi Nâng Hạng] User ${userId}:`, errorMessage);
    }
  }
}
