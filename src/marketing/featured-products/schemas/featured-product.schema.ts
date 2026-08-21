import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type FeaturedProductDocument = FeaturedProduct & Document;

export enum BadgeLabel {
  HOT = 'HOT',
  LIMITED = 'LIMITED',
  NEW = 'NEW',
  TOP_RATED = 'TOP RATED',
}

@Schema({ timestamps: true })
export class FeaturedProduct {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Product',
    required: true,
    unique: true,
  })
  productId!: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, enum: BadgeLabel, default: BadgeLabel.HOT })
  badgeLabel!: BadgeLabel;

  @Prop({ default: 1 })
  displayOrder!: number;

  @Prop({ default: 'active', enum: ['active', 'inactive'] })
  status!: string;
}

export const FeaturedProductSchema =
  SchemaFactory.createForClass(FeaturedProduct);
