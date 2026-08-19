import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BannerDocument = Banner & Document;

@Schema({ timestamps: true })
export class Banner {
  @Prop({ required: true })
  title!: string;

  @Prop()
  subtitle?: string;

  @Prop()
  description?: string;

  @Prop()
  badge?: string;

  @Prop()
  badgeText?: string;

  @Prop()
  mediaUrl?: string;

  @Prop()
  imageUrl?: string;

  @Prop()
  image?: string;

  @Prop({ default: 'image' })
  mediaType?: 'image' | 'video';

  @Prop()
  linkUrl?: string;

  @Prop({ default: 'HOME_HERO' })
  location?: string;

  @Prop({ default: 'active' })
  status?: string;

  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;

  @Prop({ default: 0 })
  clicks?: number;
}

export const BannerSchema = SchemaFactory.createForClass(Banner);
