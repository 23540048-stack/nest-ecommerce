import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Promotion,
  PromotionDocument,
  PromotionStatus,
} from './schemas/promotion.schema';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';

@Injectable()
export class PromotionsService {
  constructor(
    @InjectModel(Promotion.name)
    private readonly promotionModel: Model<PromotionDocument>,
  ) {}

  private resolveStatus(promo: Promotion): Promotion {
    if (!promo) return promo;
    const now = new Date();
    const startDate = promo.startDate ? new Date(promo.startDate) : null;
    const endDate = promo.endDate ? new Date(promo.endDate) : null;

    const result = { ...promo };

    if (result.status === 'active' || result.status === ('scheduled' as any)) {
      if (startDate && startDate > now) {
        result.status = 'scheduled' as any;
      } else if (endDate && endDate < now) {
        result.status = 'inactive' as any;
      } else {
        result.status = 'active' as any;
      }
    }
    return result;
  }

  async create(createDto: CreatePromotionDto): Promise<Promotion> {
    const existing = await this.promotionModel
      .findOne({ code: createDto.code.toUpperCase() })
      .exec();

    if (existing) {
      throw new BadRequestException(
        `Promotion code "${createDto.code}" already exists!`,
      );
    }

    const created = new this.promotionModel({
      ...createDto,
      code: createDto.code.toUpperCase(),
      startDate: new Date(createDto.startDate),
      endDate: createDto.endDate ? new Date(createDto.endDate) : null,
      usageCount: 0, // Khởi tạo 0 lượt dùng
    });

    const saved = await created.save();
    return this.resolveStatus(saved.toObject() as Promotion);
  }

  async findAll(search?: string, status?: string): Promise<Promotion[]> {
    const filter: any = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    const rawList = await this.promotionModel
      .find(filter)
      .sort({ createdAt: -1 })
      .lean<Promotion[]>()
      .exec();

    const computedList = rawList.map((p) => this.resolveStatus(p));

    if (status && status !== 'all') {
      return computedList.filter((p) => p.status === status);
    }

    return computedList;
  }

  async findOne(id: string): Promise<Promotion> {
    const promo = await this.promotionModel
      .findById(id)
      .lean<Promotion>()
      .exec();
    if (!promo)
      throw new NotFoundException(`Promotion with ID "${id}" not found`);

    return this.resolveStatus(promo);
  }

  async update(id: string, updateDto: UpdatePromotionDto): Promise<Promotion> {
    const payload: any = { ...updateDto };
    if (updateDto.code) payload.code = updateDto.code.toUpperCase();
    if (updateDto.startDate) payload.startDate = new Date(updateDto.startDate);
    if (updateDto.endDate !== undefined) {
      payload.endDate = updateDto.endDate ? new Date(updateDto.endDate) : null;
    }

    const updated = await this.promotionModel
      .findByIdAndUpdate(id, payload, { new: true })
      .lean<Promotion>()
      .exec();

    if (!updated)
      throw new NotFoundException(`Promotion with ID "${id}" not found`);

    return this.resolveStatus(updated);
  }

  // Tăng lượt sử dụng thực tế khi checkout thành công
  async applyPromotion(code: string): Promise<Promotion> {
    const updated = await this.promotionModel
      .findOneAndUpdate(
        {
          code: code.toUpperCase(),
          status: PromotionStatus.ACTIVE,
        },
        // 2. Update expression ($inc tăng giá trị)
        {
          $inc: { usageCount: 1 },
        },
        // 3. Options
        {
          new: true,
        },
      )
      .lean<Promotion>()
      .exec();

    if (!updated) {
      throw new BadRequestException(
        'Mã promotion không hợp lệ hoặc đã hết hạn',
      );
    }

    return this.resolveStatus(updated);
  }

  async remove(id: string): Promise<{ message: string }> {
    const deleted = await this.promotionModel
      .findByIdAndDelete(id)
      .lean()
      .exec();
    if (!deleted)
      throw new NotFoundException(`Promotion with ID "${id}" not found`);
    return { message: 'Promotion deleted successfully' };
  }
}
