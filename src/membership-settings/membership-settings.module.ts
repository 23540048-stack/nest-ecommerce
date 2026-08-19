import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  MembershipSetting,
  MembershipSettingSchema,
} from './schemas/membership-setting.schema';
import { MembershipSettingsService } from './membership-settings.service';
import { MembershipSettingsController } from './membership-settings.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MembershipSetting.name, schema: MembershipSettingSchema },
    ]),
  ],
  controllers: [MembershipSettingsController],
  providers: [MembershipSettingsService],
  exports: [MembershipSettingsService],
})
export class MembershipSettingsModule {}
