import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BannerDocument = Banner & Document;

@Schema({ _id: false })
export class MediaItem {
  @Prop({
    required: true,
    enum: ['image', 'video'],
    default: 'image',
  })
  type!: 'image' | 'video';

  @Prop({ required: true })
  url!: string;

  @Prop()
  caption?: string;
}

export const MediaItemSchema = SchemaFactory.createForClass(MediaItem);

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

  @Prop({
    type: [MediaItemSchema],
    default: [],
  })
  items!: MediaItem[];

  @Prop()
  mediaUrl?: string;

  @Prop()
  imageUrl?: string;

  @Prop()
  image?: string;

  @Prop({
    default: 'image',
    enum: ['image', 'video'],
  })
  mediaType?: 'image' | 'video';

  @Prop()
  linkUrl?: string;

  @Prop({
    type: String,
    enum: ['HOME_HERO', 'PROMO_BAR', 'CATEGORY_SIDEBAR', 'POPUP'],
    default: 'HOME_HERO',
  })
  location?: 'HOME_HERO' | 'PROMO_BAR' | 'CATEGORY_SIDEBAR' | 'POPUP';

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
