import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Voucher, VoucherDocument } from './schemas/voucher.schema';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';

@Injectable()
export class VouchersService {
  constructor(
    @InjectModel(Voucher.name) private voucherModel: Model<VoucherDocument>,
  ) {}

  async findAll(): Promise<Voucher[]> {
    return this.voucherModel.find().exec();
  }

  async findOne(id: string): Promise<Voucher> {
    const voucher = await this.voucherModel.findById(id).exec();
    if (!voucher) {
      throw new NotFoundException('Voucher not found.');
    }
    return voucher;
  }

  async create(dto: CreateVoucherDto): Promise<Voucher> {
    const voucher = new this.voucherModel(dto);
    return voucher.save();
  }

  async update(id: string, dto: UpdateVoucherDto): Promise<Voucher> {
    const voucher = await this.voucherModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();

    if (!voucher) {
      throw new NotFoundException('Voucher not found.');
    }
    return voucher;
  }

  async remove(id: string): Promise<Voucher> {
    const voucher = await this.voucherModel.findByIdAndDelete(id).exec();
    if (!voucher) {
      throw new NotFoundException('Voucher not found.');
    }
    return voucher;
  }
}
