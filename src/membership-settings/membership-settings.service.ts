import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  MembershipSetting,
  MembershipSettingDocument,
} from './schemas/membership-setting.schema';
import { UpdateMembershipSettingDto } from './dto/update-membership-setting.dto';

@Injectable()
export class MembershipSettingsService {
  constructor(
    @InjectModel(MembershipSetting.name)
    private settingModel: Model<MembershipSettingDocument>,
  ) {}

  async getSettings() {
    let settings = await this.settingModel.findOne();
    if (!settings) {
      settings = await this.settingModel.create({});
    }
    return settings;
  }

  async updateSettings(dto: UpdateMembershipSettingDto) {
    return this.settingModel.findOneAndUpdate({}, dto, {
      upsert: true,
      returnDocument: 'after',
    });
  }
}
