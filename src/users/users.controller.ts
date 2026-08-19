import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

// Import Guards & Decorators
import { ClientAuthGuard } from '../auth/guards/client-auth.guard';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 1. Register account (Public)
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // 2. ADMIN ONLY: Get all users
  @Get()
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findAll() {
    return this.usersService.findAll();
  }

  // 3. USER: Get profile info
  @Get('me')
  @UseGuards(ClientAuthGuard)
  async getProfile(@Req() req: any) {
    const userId = req.user?.userId || req.user?.sub || req.user?._id;
    return this.usersService.findOne(userId);
  }

  // 3b. USER: Update profile info
  @Patch('me')
  @UseGuards(ClientAuthGuard)
  async updateProfile(@Req() req: any, @Body() updateData: any) {
    const userId = req.user?.userId || req.user?.sub || req.user?._id;
    return this.usersService.update(userId, updateData);
  }

  // 3c. USER: Create address
  @Post('addresses')
  @UseGuards(ClientAuthGuard)
  async createAddress(@Req() req: any, @Body() createAddressDto: any) {
    const userId = req.user?.userId || req.user?.sub || req.user?._id;
    return this.usersService.createAddress(userId, createAddressDto);
  }

  // 3d. USER: Get addresses
  @Get('addresses')
  @UseGuards(ClientAuthGuard)
  async getAddresses(@Req() req: any) {
    const userId = req.user?.userId || req.user?.sub || req.user?._id;
    return this.usersService.getAddresses(userId);
  }

  // 3e. USER: Update address
  @Patch('addresses/:addressId')
  @UseGuards(ClientAuthGuard)
  async updateAddress(
    @Req() req: any,
    @Param('addressId') addressId: string,
    @Body() updateAddressDto: any,
  ) {
    const userId = req.user?.userId || req.user?.sub || req.user?._id;
    return this.usersService.updateAddress(userId, addressId, updateAddressDto);
  }

  // 3f. USER: Delete address
  @Delete('addresses/:addressId')
  @UseGuards(ClientAuthGuard)
  async deleteAddress(@Req() req: any, @Param('addressId') addressId: string) {
    const userId = req.user?.userId || req.user?.sub || req.user?._id;
    return this.usersService.deleteAddress(userId, addressId);
  }

  // 3g. USER: Change password
  @Patch('change-password')
  @UseGuards(ClientAuthGuard)
  async changePassword(@Req() req: any, @Body() dto: any) {
    const userId = req.user?.userId || req.user?.sub || req.user?._id;
    return this.usersService.changePassword(userId, dto);
  }

  // 4. USER: Get membership status
  @Get('membership')
  @UseGuards(ClientAuthGuard)
  getMembershipStatus(@Req() req: any) {
    const userId = req.user?.userId || req.user?.sub;
    return this.usersService.getMembershipStatus(userId);
  }

  // 5. USER: Get wishlist
  @Get('wishlist')
  @UseGuards(ClientAuthGuard)
  getWishlist(@Req() req: any) {
    const userId = req.user?.userId || req.user?.sub;
    return this.usersService.getWishlist(userId);
  }

  // 6. USER: Add/Remove product from wishlist
  @Post('wishlist/:productId')
  @UseGuards(ClientAuthGuard)
  toggleWishlist(@Req() req: any, @Param('productId') productId: string) {
    const userId = req.user?.userId || req.user?.sub;
    return this.usersService.toggleWishlist(userId, productId);
  }

  // 7. ADMIN ONLY: Block / Unblock user account
  @Patch(':id/block')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  toggleBlockUser(
    @Param('id') userId: string,
    @Body('isBlocked') isBlocked?: boolean,
  ) {
    return this.usersService.toggleBlockUser(userId, isBlocked);
  }

  // 8. ADMIN ONLY: Update user role
  @Patch(':id/role')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateUserRole(@Param('id') userId: string, @Body('role') role: string) {
    return this.usersService.updateUserRole(userId, role);
  }
}
