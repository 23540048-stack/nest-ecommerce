import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export type CouponDocument = Coupon & Document;

@Schema({ timestamps: true })
export class Coupon {
  @Prop({
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  })
  code!: string;

  @Prop({
    required: true,
    enum: DiscountType,
  })
  discountType!: DiscountType;

  /**
   * Nếu PERCENTAGE:
   *   10 = giảm 10%
   *
   * Nếu FIXED_AMOUNT:
   *   10 = giảm $10
   */
  @Prop({
    required: true,
    min: 0,
  })
  discountValue!: number;

  /**
   * Số tiền giảm tối đa.
   * Đơn vị: USD
   *
   * Chỉ sử dụng cho PERCENTAGE.
   */
  @Prop({ type: Number, required: false })
  maxDiscountAmount?: number;

  /**
   * Giá trị đơn hàng tối thiểu.
   * Đơn vị: USD.
   */
  @Prop({
    default: 0,
    min: 0,
  })
  minOrderValue!: number;

  @Prop({
    required: true,
  })
  startDate!: Date;

  @Prop({
    required: false,
    default: undefined,
  })
  endDate?: Date;

  /**
   * Tổng số lượt sử dụng tối đa.
   */
  @Prop({
    required: true,
    default: 100,
    min: 1,
  })
  usageLimit!: number;

  @Prop({
    default: 0,
    min: 0,
  })
  usedCount!: number;

  /**
   * Số lượt tối đa mỗi tài khoản.
   */
  @Prop({
    default: 1,
    min: 1,
  })
  userLimit!: number;

  @Prop({
    type: [
      {
        userId: {
          type: Types.ObjectId,
          ref: 'User',
        },
        usedAt: {
          type: Date,
        },
      },
    ],
    default: [],
  })
  usedBy!: {
    userId: Types.ObjectId;
    usedAt: Date;
  }[];

  @Prop({
    default: true,
  })
  isActive!: boolean;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
