import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PromotionDocument = HydratedDocument<Promotion>;

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export enum PromotionMediaType {
  IMAGE = 'image',
  VIDEO = 'video',
}

export enum PromotionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SCHEDULED = 'scheduled',
}

@Schema({ timestamps: true })
export class Promotion {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code!: string;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({
    type: String,
    enum: Object.values(DiscountType),
    default: DiscountType.PERCENTAGE,
  })
  discountType!: DiscountType;

  @Prop({ required: true, min: 0 })
  discountValue!: number;

  @Prop({ default: 0, min: 0 })
  minOrderValue!: number;

  @Prop({
    type: String,
    enum: Object.values(PromotionMediaType),
    default: PromotionMediaType.IMAGE,
  })
  mediaType!: PromotionMediaType;

  @Prop({ default: '' })
  mediaUrl!: string;

  @Prop({
    type: String,
    enum: Object.values(PromotionStatus),
    default: PromotionStatus.ACTIVE,
  })
  status!: PromotionStatus;

  @Prop({ required: true })
  startDate!: Date;

  @Prop({ type: Date, default: null })
  endDate?: Date;

  @Prop({ default: 0 })
  usageCount!: number;
}

export const PromotionSchema = SchemaFactory.createForClass(Promotion);
