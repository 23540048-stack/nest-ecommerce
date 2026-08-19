import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

export type CategoryStatus = 'ACTIVE' | 'INACTIVE';

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, trim: true, lowercase: true, unique: true })
  slug!: string;

  @Prop({ trim: true, default: '' })
  image?: string;

  @Prop({ trim: true, default: '' })
  description?: string;

  @Prop({
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE',
  })
  status!: CategoryStatus;

  @Prop({ default: 'group-hover:text-brand-primary', trim: true })
  hoverColor!: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
