import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// 1. Định nghĩa Sub-Schema cho Review
@Schema({ timestamps: true })
export class Review {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user!: Types.ObjectId;

  @Prop({ required: true })
  userName!: string;

  @Prop({ required: true, min: 1, max: 5 })
  rating!: number;

  @Prop({ required: true })
  comment!: string;

  @Prop({ type: [String], default: [] })
  images!: string[];

  @Prop({ type: [String], default: [] })
  videos!: string[];
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// 2. Schema Product chính
export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name!: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  price!: number;

  @Prop({ default: 0 })
  stock!: number;

  @Prop()
  imageUrl?: string;

  @Prop({ type: [String], default: [] })
  images!: string[];

  @Prop({ type: Types.ObjectId, ref: 'Category' })
  category?: Types.ObjectId;

  @Prop({ default: 0 })
  rating!: number;

  @Prop({ default: 0 })
  numReviews!: number;

  // Sử dụng ReviewSchema ở đây
  @Prop({ type: [ReviewSchema], default: [] })
  reviews!: Review[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);
