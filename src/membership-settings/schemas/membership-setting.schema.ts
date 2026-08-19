import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MembershipSettingDocument = MembershipSetting & Document;

@Schema({ timestamps: true })
export class MembershipSetting {
  @Prop({ default: 10 })
  pointsRatio!: number;

  @Prop({ default: 1 })
  pointRedeemValue!: number;

  @Prop({ default: true })
  autoUpgrade!: boolean;
}

export const MembershipSettingSchema =
  SchemaFactory.createForClass(MembershipSetting);
