import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type VoucherDocument = Voucher & Document;

@Schema({ timestamps: true })
export class Voucher {
  @Prop({ required: true, unique: true, uppercase: true })
  code!: string;

  @Prop({ required: false })
  name?: string;

  @Prop({ required: true, enum: ['FIXED', 'PERCENTAGE'] })
  discountType!: string;

  @Prop({ required: true, default: 0 })
  discountValue!: number;

  @Prop({ default: 0 })
  minOrderValue?: number;

  @Prop({ default: 0 })
  maxDiscountAmount?: number;

  @Prop({ default: 0 })
  usageLimit?: number;

  @Prop()
  expirationDate?: Date;

  @Prop({ default: false })
  isChakraRedeemable?: boolean;

  @Prop({ default: 0 })
  chakraCost?: number;
}

export const VoucherSchema = SchemaFactory.createForClass(Voucher);
