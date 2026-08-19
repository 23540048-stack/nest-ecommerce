import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';

import { WishlistService } from './wishlist.service';
import { CreateWishlistItemDto } from './dto/create-wishlist.dto';
import { ClientAuthGuard } from '../auth/guards/client-auth.guard';

@Controller('wishlist')
@UseGuards(ClientAuthGuard) // Áp dụng cho toàn bộ API Wishlist của Khách hàng
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  // 🟢 Hàm phụ trợ lấy userId an toàn từ req.user (tương thích mọi kiểu JwtStrategy)
  private getUserId(req: any): string {
    const userId =
      req.user?._id || req.user?.id || req.user?.userId || req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException('Không tìm thấy thông tin người dùng.');
    }

    return userId;
  }

  @Get()
  async getAll(@Req() req: any) {
    const userId = this.getUserId(req);
    return this.wishlistService.findAll(userId);
  }

  @Post()
  async create(@Req() req: any, @Body() dto: CreateWishlistItemDto) {
    const userId = this.getUserId(req);
    return this.wishlistService.create(dto, userId);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    const userId = this.getUserId(req);
    await this.wishlistService.remove(id, userId);
    return { message: 'Item removed successfully' };
  }

  @Delete()
  async clearAll(@Req() req: any) {
    const userId = this.getUserId(req);
    await this.wishlistService.clearAll(userId);
    return { message: 'Wishlist cleared successfully' };
  }
}
