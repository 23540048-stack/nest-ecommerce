import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  MembershipTier,
  MembershipTierDocument,
} from './schemas/membership-tier.schema';
import { Voucher, VoucherDocument } from '../vouchers/schemas/voucher.schema';
import { CreateMembershipTierDto } from './dto/create-membership-tier.dto';
import { UpdateMembershipTierDto } from './dto/update-membership-tier.dto';

@Injectable()
export class MembershipTiersService {
  constructor(
    @InjectModel(MembershipTier.name)
    private tierModel: Model<MembershipTierDocument>,
    @InjectModel(Voucher.name)
    private voucherModel: Model<VoucherDocument>,
  ) {}

  async findAll(): Promise<MembershipTier[]> {
    return this.tierModel.find().populate('voucherIds').exec();
  }

  // Hàm xử lý lưu/tạo Voucher vào MongoDB Collection "vouchers"
  private async processVoucherCodes(
    vouchers?: string[],
  ): Promise<Types.ObjectId[]> {
    console.log('[DEBUG] Vouchers nhận từ Request:', vouchers);
    if (!vouchers || vouchers.length === 0) return [];

    const voucherObjectIds: Types.ObjectId[] = [];
    for (const code of vouchers) {
      const cleanCode = code.trim().toUpperCase();

      // Upsert: Nếu chưa có trong collection "vouchers" -> Tạo mới. Nếu có rồi -> Lấy record đó
      const voucher = await this.voucherModel.findOneAndUpdate(
        { code: cleanCode },
        {
          $setOnInsert: {
            code: cleanCode,
            isActive: true,
          },
        },
        { upsert: true, new: true },
      );

      console.log(
        '✅ [DEBUG] Đã lưu Voucher vào DB collection "vouchers":',
        voucher,
      );
      voucherObjectIds.push(voucher._id as Types.ObjectId);
    }
    return voucherObjectIds;
  }

  async create(createDto: CreateMembershipTierDto): Promise<MembershipTier> {
    console.log('[DEBUG] Payload Create Received:', createDto);
    const voucherIds = await this.processVoucherCodes(createDto.vouchers);

    const createdTier = new this.tierModel({
      ...createDto,
      voucherIds,
    });

    return createdTier.save();
  }

  async update(
    id: string,
    updateDto: UpdateMembershipTierDto,
  ): Promise<MembershipTier> {
    console.log('[DEBUG] Payload Update Received:', updateDto);
    let voucherIds: Types.ObjectId[] | undefined;

    if (updateDto.vouchers) {
      voucherIds = await this.processVoucherCodes(updateDto.vouchers);
    }

    const updatedTier = await this.tierModel
      .findByIdAndUpdate(
        id,
        {
          ...updateDto,
          ...(voucherIds && { voucherIds }),
        },
        { new: true },
      )
      .populate('voucherIds')
      .exec();

    if (!updatedTier) {
      throw new NotFoundException('This rank could not be found.');
    }
    return updatedTier;
  }

  async remove(id: string): Promise<MembershipTier> {
    const deletedTier = await this.tierModel.findByIdAndDelete(id).exec();
    if (!deletedTier) {
      throw new NotFoundException('This rank could not be found.');
    }
    return deletedTier;
  }

  async getTierBySpent(
    totalSpent: number,
  ): Promise<MembershipTierDocument | null> {
    return this.tierModel
      .findOne({ minSpent: { $lte: totalSpent } })
      .sort({ minSpent: -1 })
      .exec();
  }
}
