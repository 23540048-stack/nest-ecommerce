import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { MembershipTiersService } from './membership-tiers.service';
import { CreateMembershipTierDto } from './dto/create-membership-tier.dto';

// Import Guards & Decorators
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@Controller('membership-tiers')
export class MembershipTiersController {
  constructor(private readonly tiersService: MembershipTiersService) {}

  // Xem danh sách (Ai đăng nhập cũng xem được)
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.tiersService.findAll();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async findMyTier(@Req() req) {
    const tiers = await this.tiersService.findAll();
    const userExp = req.user?.exp || 0;

    return {
      currentExp: userExp,
      tiers: tiers,
    };
  }

  // Thêm Rank (Chỉ ADMIN)
  @Post()
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() createDto: CreateMembershipTierDto) {
    return this.tiersService.create(createDto);
  }

  // Cập nhật Rank (Chỉ ADMIN)
  @Patch(':id')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateMembershipTierDto>,
  ) {
    return this.tiersService.update(id, updateDto);
  }

  // Xóa Rank (Chỉ ADMIN)
  @Delete(':id')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.tiersService.remove(id);
  }
}
