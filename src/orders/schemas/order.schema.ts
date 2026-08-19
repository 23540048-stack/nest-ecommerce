import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

export enum PaymentMethod {
  COD = 'COD',
  VNPAY = 'VNPAY',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCEL_REQUESTED = 'CANCEL_REQUESTED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  UNPAID = 'UNPAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user!: Types.ObjectId;

  @Prop({
    type: [
      {
        productId: { type: Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        image: { type: String },
        isReviewed: { type: Boolean, default: false },
        rating: { type: Number },
        comment: { type: String },
      },
    ],
    required: true,
  })
  items!: Array<{
    _id?: Types.ObjectId;
    productId: Types.ObjectId;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    isReviewed?: boolean;
    rating?: number;
    comment?: string;
  }>;

  @Prop({ required: true })
  shippingAddress!: string;

  @Prop({ required: true, type: Number })
  totalPrice!: number;

  @Prop({ type: String })
  couponCode?: string;

  @Prop({
    type: String,
    enum: PaymentMethod,
    default: PaymentMethod.COD,
  })
  paymentMethod!: PaymentMethod;

  @Prop({
    type: String,
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus!: PaymentStatus;

  @Prop({
    type: String,
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status!: OrderStatus;

  // Bổ sung cờ đánh dấu đơn đã được cộng Chakra & tổng chi tiêu chưa
  @Prop({ default: false })
  isRewardProcessed?: boolean;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
