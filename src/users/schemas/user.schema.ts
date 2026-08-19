import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from '../../auth/enums/role.enum';

export type UserDocument = User & Document;

@Schema({ _id: true })
export class Address {
  @Prop({ required: true })
  receiverName!: string;

  @Prop({ required: true })
  phone!: string;

  @Prop({ required: true })
  fullAddress!: string;

  @Prop({ default: false })
  isDefault!: boolean;
}

export const AddressSchema = SchemaFactory.createForClass(Address);

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop()
  resetPasswordToken?: string;

  @Prop()
  resetPasswordExpires?: Date;

  @Prop()
  phone?: string;

  @Prop({ type: [AddressSchema], default: [] })
  addresses!: Address[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }], default: [] })
  wishlist!: Types.ObjectId[];

  @Prop({ type: String, enum: Role, default: Role.USER })
  role!: Role;

  @Prop({ default: false })
  isBlocked!: boolean;

  @Prop({ default: 0 })
  points!: number; // Điểm thưởng tích lũy

  @Prop({ default: 0 })
  chakra!: number; // Bổ sung Ví Chakra đổi Voucher

  @Prop({ default: 0 })
  totalSpent!: number; // Tổng chi tiêu tích lũy

  @Prop({ type: Types.ObjectId, ref: 'MembershipTier' })
  tier?: Types.ObjectId; // Liên kết tới Hạng thành viên
}

export const UserSchema = SchemaFactory.createForClass(User);
