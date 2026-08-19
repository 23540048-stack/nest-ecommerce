import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WishlistItem, WishlistItemDocument } from './schemas/wishlist.schema';
import { CreateWishlistItemDto } from './dto/create-wishlist.dto';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(WishlistItem.name)
    private wishlistModel: Model<WishlistItemDocument>,
  ) {}

  async findAll(userId: string): Promise<WishlistItem[]> {
    return this.wishlistModel.find({ user: userId }).exec();
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.wishlistModel.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!result) throw new NotFoundException('Item not found');
  }

  async clearAll(userId: string): Promise<void> {
    await this.wishlistModel.deleteMany({ user: userId });
  }

  async create(
    dto: CreateWishlistItemDto,
    userId: string,
  ): Promise<WishlistItem> {
    const newItem = new this.wishlistModel({
      ...dto,
      user: userId,
    });

    return newItem.save();
  }
}
