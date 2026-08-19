import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { MembershipSettingsService } from './membership-settings.service';
import { UpdateMembershipSettingDto } from './dto/update-membership-setting.dto';

// Import Guards & Decorators
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@Controller('membership-settings')
export class MembershipSettingsController {
  constructor(private readonly settingsService: MembershipSettingsService) {}

  // PUBLIC / ALL: Lấy cấu hình các cấp bậc hạng thành viên (để hiển thị lên Shop & Admin)
  @Get()
  getSettings() {
    return this.settingsService.getSettings();
  }

  // ADMIN ONLY: Cập nhật cấu hình hạng thành viên
  @Put()
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateSettings(@Body() dto: UpdateMembershipSettingDto) {
    return this.settingsService.updateSettings(dto);
  }
}
