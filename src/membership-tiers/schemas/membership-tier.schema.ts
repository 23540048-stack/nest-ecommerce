import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MembershipTierDocument = MembershipTier & Document;

@Schema({ timestamps: true })
export class MembershipTier {
  @Prop({ required: true, unique: true })
  name!: string;

  @Prop({ required: true, default: 0 })
  minSpent!: number;

  @Prop({ required: true, default: 0 })
  discountRate!: number;

  @Prop({ required: true, default: 1 })
  pointsMultiplier!: number;

  @Prop({ type: [String], default: [] })
  perks?: string[];

  @Prop({ default: 'border-slate-300 text-slate-700 bg-slate-50' })
  badgeColor?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Voucher' }], default: [] })
  voucherIds?: Types.ObjectId[];
}

export const MembershipTierSchema =
  SchemaFactory.createForClass(MembershipTier);
