import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Banner, BannerDocument } from './schemas/banner.schema';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@Injectable()
export class BannersService {
  constructor(
    @InjectModel(Banner.name)
    private readonly bannerModel: Model<BannerDocument>,
  ) {}

  private resolveBannerStatus(banner: Banner): Banner {
    if (!banner) return banner;

    if ((banner.status as any) === 'inactive') {
      return banner;
    }

    const now = new Date();

    const startDate = banner.startDate ? new Date(banner.startDate) : null;
    const endDate = banner.endDate ? new Date(banner.endDate) : null;

    if (startDate && startDate > now) {
      banner.status = 'scheduled' as any;
    } else if (endDate && endDate < now) {
      banner.status = 'inactive' as any;
    } else {
      banner.status = 'active' as any;
    }

    return banner;
  }

  async create(createBannerDto: CreateBannerDto): Promise<Banner> {
    const createdBanner = new this.bannerModel({
      ...createBannerDto,
      startDate: createBannerDto.startDate
        ? new Date(createBannerDto.startDate)
        : null,
      endDate: createBannerDto.endDate
        ? new Date(createBannerDto.endDate)
        : null,
    });

    const saved = await createdBanner.save();
    return this.resolveBannerStatus(saved.toObject() as Banner);
  }

  async findAll(
    search?: string,
    location?: string,
    status?: string,
  ): Promise<Banner[]> {
    const filter: any = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { linkUrl: { $regex: search, $options: 'i' } },
      ];
    }

    if (location && location !== 'all') {
      filter.location = location;
    }

    const rawBanners = await this.bannerModel
      .find(filter)
      .sort({ createdAt: -1 })
      .lean<Banner[]>()
      .exec();

    const computedBanners = rawBanners.map((b) => this.resolveBannerStatus(b));

    if (status && status !== 'all') {
      return computedBanners.filter((b) => b.status === status);
    }

    return computedBanners;
  }

  async findOne(id: string): Promise<Banner> {
    const banner = await this.bannerModel.findById(id).lean<Banner>().exec();
    if (!banner)
      throw new NotFoundException(`Banner with ID "${id}" not found`);

    return this.resolveBannerStatus(banner);
  }

  async update(id: string, updateBannerDto: UpdateBannerDto): Promise<Banner> {
    const payload: any = { ...updateBannerDto };

    if (updateBannerDto.startDate !== undefined) {
      payload.startDate = updateBannerDto.startDate
        ? new Date(updateBannerDto.startDate)
        : null;
    }
    if (updateBannerDto.endDate !== undefined) {
      payload.endDate = updateBannerDto.endDate
        ? new Date(updateBannerDto.endDate)
        : null;
    }

    const updatedBanner = await this.bannerModel
      .findByIdAndUpdate(id, payload, { new: true })
      .lean<Banner>()
      .exec();

    if (!updatedBanner)
      throw new NotFoundException(`Banner with ID "${id}" not found`);

    return this.resolveBannerStatus(updatedBanner);
  }

  async toggleStatus(id: string): Promise<Banner> {
    const banner = await this.bannerModel.findById(id).lean<Banner>().exec();
    if (!banner)
      throw new NotFoundException(`Banner with ID "${id}" not found`);

    const nextStatus = banner.status === 'inactive' ? 'active' : 'inactive';

    const updated = await this.bannerModel
      .findByIdAndUpdate(id, { status: nextStatus }, { new: true })
      .lean<Banner>()
      .exec();

    return this.resolveBannerStatus(updated!);
  }

  async remove(id: string): Promise<{ message: string }> {
    const deletedBanner = await this.bannerModel
      .findByIdAndDelete(id)
      .lean()
      .exec();
    if (!deletedBanner)
      throw new NotFoundException(`Banner with ID "${id}" not found`);
    return { message: 'Banner deleted successfully' };
  }

  async trackClick(id: string): Promise<void> {
    await this.bannerModel
      .findByIdAndUpdate(id, { $inc: { clicks: 1 } })
      .exec();
  }
}
