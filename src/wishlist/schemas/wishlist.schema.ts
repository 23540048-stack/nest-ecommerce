import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WishlistItemDocument = HydratedDocument<WishlistItem>;

@Schema({ timestamps: true })
export class WishlistItem {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  productId!: string;

  @Prop({ required: true })
  category!: string;

  @Prop({ required: true })
  price!: number;

  @Prop()
  originalPrice?: number;

  @Prop({ required: true })
  image!: string;

  @Prop({ default: true })
  inStock!: boolean;

  @Prop({ default: 0 })
  rating!: number;

  @Prop({ required: true })
  user!: string;
}

export const WishlistItemSchema = SchemaFactory.createForClass(WishlistItem);
