import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  FeaturedProduct,
  FeaturedProductDocument,
} from './schemas/featured-product.schema';
import { CreateFeaturedProductDto } from './dto/create-featured-product.dto';
import { UpdateFeaturedProductDto } from './dto/update-featured-product.dto';

@Injectable()
export class FeaturedProductsService {
  constructor(
    @InjectModel(FeaturedProduct.name)
    private featuredModel: Model<FeaturedProductDocument>,
  ) {}

  async findAll(search?: string, categoryId?: string) {
    const items = await this.featuredModel
      .find()
      .populate({
        path: 'productId',
        populate: { path: 'category' },
      })
      .sort({ displayOrder: 1, createdAt: -1 })
      .exec();

    return items.filter((item) => {
      const product: any = item.productId;
      if (!product) return false;

      const matchSearch = search
        ? product.name?.toLowerCase().includes(search.toLowerCase())
        : true;

      const matchCategory =
        categoryId && categoryId !== 'all'
          ? product.category?._id?.toString() === categoryId ||
            product.category === categoryId
          : true;

      return matchSearch && matchCategory;
    });
  }

  async create(dto: CreateFeaturedProductDto) {
    const exists = await this.featuredModel.findOne({
      productId: new Types.ObjectId(dto.productId) as any,
    });

    if (exists) {
      throw new ConflictException('This product is already featured!');
    }

    const newFeatured = new this.featuredModel({
      productId: new Types.ObjectId(dto.productId),
      badgeLabel: dto.badgeLabel,
      displayOrder: dto.displayOrder ?? 1,
      status: dto.status ?? 'active',
    });

    const saved = await newFeatured.save();
    return saved.populate({
      path: 'productId',
      populate: { path: 'category' },
    });
  }

  async update(id: string, dto: UpdateFeaturedProductDto) {
    const updatePayload: any = { ...dto };
    if (dto.productId) {
      updatePayload.productId = new Types.ObjectId(dto.productId);
    }

    const updated = await this.featuredModel
      .findByIdAndUpdate(id, updatePayload, { new: true })
      .populate({
        path: 'productId',
        populate: { path: 'category' },
      });

    if (!updated) {
      throw new NotFoundException('Featured product record not found!');
    }
    return updated;
  }

  async toggleStatus(id: string) {
    const item = await this.featuredModel.findById(id);
    if (!item)
      throw new NotFoundException('Featured product record not found!');

    item.status = item.status === 'active' ? 'inactive' : 'active';
    await item.save();
    return item.populate({
      path: 'productId',
      populate: { path: 'category' },
    });
  }

  async remove(id: string) {
    const deleted = await this.featuredModel.findByIdAndDelete(id);
    if (!deleted)
      throw new NotFoundException('Featured product record not found!');
    return { success: true, message: 'Removed from featured list' };
  }
}
