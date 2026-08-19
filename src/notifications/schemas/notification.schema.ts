import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  message!: string;

  @Prop({
    default: 'info',
    enum: ['info', 'warning', 'success', 'error'],
  })
  type!: 'info' | 'warning' | 'success' | 'error';

  @Prop({ default: false })
  isRead!: boolean;

  @Prop({ default: '' })
  link?: string;

  @Prop({ type: String, default: null })
  userId?: string | null;

  // timestamps do MongoDB tự tạo
  createdAt!: Date;
  updatedAt!: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
