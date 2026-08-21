import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Coupon, CouponDocument, DiscountType } from './schemas/coupon.schema';

import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(
    @InjectModel(Coupon.name)
    private readonly couponModel: Model<CouponDocument>,
  ) {}

  // =========================================================
  // HELPER: Convert MongoDB Coupon -> Frontend response
  // =========================================================

  private mapToFrontendResponse(coupon: CouponDocument) {
    const obj = coupon.toObject();

    return {
      ...obj,
      maxUses: obj.usageLimit ?? 0,
      status: obj.isActive ? 'active' : 'inactive',
      currency: 'USD',
    };
  }

  // =========================================================
  // 1. CREATE COUPON
  // =========================================================

  async createCoupon(dto: CreateCouponDto) {
    const code = dto.code.trim().toUpperCase();

    // -------------------------------------------------------
    // Check duplicate coupon code
    // -------------------------------------------------------

    const existing = await this.couponModel.findOne({ code });

    if (existing) {
      throw new BadRequestException('This coupon code already exists!');
    }

    // -------------------------------------------------------
    // Validate discount type
    // -------------------------------------------------------

    if (
      dto.discountType === DiscountType.PERCENTAGE &&
      dto.discountValue > 100
    ) {
      throw new BadRequestException('Percentage discount cannot exceed 100%!');
    }

    if (
      dto.discountType === DiscountType.FIXED_AMOUNT &&
      dto.discountValue <= 0
    ) {
      throw new BadRequestException(
        'Fixed discount amount must be greater than 0!',
      );
    }

    // -------------------------------------------------------
    // Validate minimum order
    // -------------------------------------------------------

    if (dto.minOrderValue !== undefined && dto.minOrderValue < 0) {
      throw new BadRequestException('Minimum order value cannot be negative!');
    }

    // -------------------------------------------------------
    // Validate max uses
    // -------------------------------------------------------

    if (dto.maxUses !== undefined && dto.maxUses < 1) {
      throw new BadRequestException('Maximum usage must be at least 1!');
    }

    // -------------------------------------------------------
    // Validate dates
    // -------------------------------------------------------

    const startDate = new Date(dto.startDate);

    if (Number.isNaN(startDate.getTime())) {
      throw new BadRequestException('Invalid start date!');
    }

    let endDate: Date | undefined;

    if (dto.endDate) {
      endDate = new Date(dto.endDate);

      if (Number.isNaN(endDate.getTime())) {
        throw new BadRequestException('Invalid end date!');
      }

      endDate.setHours(23, 59, 59, 999);

      if (endDate < startDate) {
        throw new BadRequestException(
          'End date cannot be earlier than start date!',
        );
      }
    }

    // -------------------------------------------------------
    // Build coupon data
    // -------------------------------------------------------

    const couponData: any = {
      code,
      title: dto.title,
      discountType: dto.discountType,
      discountValue: Number(dto.discountValue),
      minOrderValue: Number(dto.minOrderValue ?? 0),
      usageLimit: Number(dto.maxUses ?? 100),
      // Each user can use this coupon only once by default.
      userLimit: 1,
      maxDiscountAmount:
        dto.maxDiscountAmount !== undefined
          ? Number(dto.maxDiscountAmount)
          : undefined,
      isActive: dto.status !== undefined ? dto.status === 'active' : true,
      startDate,
      usedCount: 0,
      usedBy: [],
    };

    // Do not assign null to Date field.
    if (endDate) {
      couponData.endDate = endDate;
    }

    const created = await this.couponModel.create(couponData);
    return this.mapToFrontendResponse(created);
  }

  // =========================================================
  // 2. GET ALL COUPONS
  // =========================================================

  async getAllCoupons(search?: string) {
    const filter: any = {};
    if (search?.trim()) {
      const keyword = search.trim();
      filter.$or = [
        {
          code: {
            $regex: keyword,
            $options: 'i',
          },
        },
        {
          title: {
            $regex: keyword,
            $options: 'i',
          },
        },
      ];
    }

    const coupons = await this.couponModel.find(filter).sort({ createdAt: -1 });

    return coupons.map((coupon) => this.mapToFrontendResponse(coupon));
  }

  // =========================================================
  // 3. UPDATE COUPON
  // =========================================================

  async updateCoupon(id: string, dto: UpdateCouponDto) {
    const coupon = await this.couponModel.findById(id);

    if (!coupon) {
      throw new NotFoundException('Coupon not found!');
    }

    // -------------------------------------------------------
    // Code
    // -------------------------------------------------------

    if (dto.code !== undefined) {
      const newCode = dto.code.trim().toUpperCase();

      const existing = await this.couponModel.findOne({
        code: newCode,
        _id: { $ne: id },
      });

      if (existing) {
        throw new BadRequestException('This coupon code already exists!');
      }

      coupon.code = newCode;
    }

    // -------------------------------------------------------
    // Title
    // -------------------------------------------------------

    if (dto.title !== undefined) {
      coupon.set('title', dto.title);
    }

    // -------------------------------------------------------
    // Discount type
    // -------------------------------------------------------

    if (dto.discountType !== undefined) {
      coupon.discountType = dto.discountType;
    }

    // -------------------------------------------------------
    // Discount value
    // -------------------------------------------------------

    if (dto.discountValue !== undefined) {
      const discountType = dto.discountType ?? coupon.discountType;

      if (discountType === DiscountType.PERCENTAGE && dto.discountValue > 100) {
        throw new BadRequestException(
          'Percentage discount cannot exceed 100%!',
        );
      }

      if (dto.discountValue < 0) {
        throw new BadRequestException('Discount value cannot be negative!');
      }

      if (
        discountType === DiscountType.FIXED_AMOUNT &&
        dto.discountValue <= 0
      ) {
        throw new BadRequestException(
          'Fixed discount amount must be greater than 0!',
        );
      }

      coupon.discountValue = Number(dto.discountValue);
    }

    // -------------------------------------------------------
    // Minimum order value
    // -------------------------------------------------------

    if (dto.minOrderValue !== undefined) {
      if (dto.minOrderValue < 0) {
        throw new BadRequestException(
          'Minimum order value cannot be negative!',
        );
      }

      coupon.minOrderValue = Number(dto.minOrderValue);
    }

    // -------------------------------------------------------
    // Maximum discount amount
    // -------------------------------------------------------

    if (dto.maxDiscountAmount !== undefined) {
      if (dto.maxDiscountAmount < 0) {
        throw new BadRequestException(
          'Maximum discount amount cannot be negative!',
        );
      }

      coupon.maxDiscountAmount = Number(dto.maxDiscountAmount);
    }

    // -------------------------------------------------------
    // Maximum total uses
    // -------------------------------------------------------

    if (dto.maxUses !== undefined) {
      if (dto.maxUses < 1) {
        throw new BadRequestException('Maximum usage must be at least 1!');
      }

      if (dto.maxUses < coupon.usedCount) {
        throw new BadRequestException(
          'Maximum usage cannot be lower than the number of times this coupon has already been used!',
        );
      }

      coupon.usageLimit = Number(dto.maxUses);
    }

    // -------------------------------------------------------
    // Status
    // -------------------------------------------------------

    if (dto.status !== undefined) {
      coupon.isActive = dto.status === 'active';
    }

    // -------------------------------------------------------
    // Start date
    // -------------------------------------------------------

    if (dto.startDate !== undefined) {
      const startDate = new Date(dto.startDate);

      if (Number.isNaN(startDate.getTime())) {
        throw new BadRequestException('Invalid start date!');
      }

      if (coupon.endDate && startDate > coupon.endDate) {
        throw new BadRequestException(
          'Start date cannot be later than end date!',
        );
      }

      coupon.startDate = startDate;
    }

    // -------------------------------------------------------
    // End date
    // -------------------------------------------------------

    if (dto.endDate !== undefined) {
      const endDate = new Date(dto.endDate);

      if (Number.isNaN(endDate.getTime())) {
        throw new BadRequestException('Invalid end date!');
      }

      endDate.setHours(23, 59, 59, 999);

      if (coupon.startDate && endDate < coupon.startDate) {
        throw new BadRequestException(
          'End date cannot be earlier than start date!',
        );
      }

      coupon.endDate = endDate;
    }

    const updated = await coupon.save();

    return this.mapToFrontendResponse(updated);
  }

  // =========================================================
  // 4. TOGGLE ACTIVE STATUS
  // =========================================================

  async toggleActiveStatus(id: string) {
    const coupon = await this.couponModel.findById(id);

    if (!coupon) {
      throw new NotFoundException('Coupon not found!');
    }

    coupon.isActive = !coupon.isActive;

    await coupon.save();

    return this.mapToFrontendResponse(coupon);
  }

  // =========================================================
  // 5. DELETE COUPON
  // =========================================================

  async deleteCoupon(id: string) {
    const deleted = await this.couponModel.findByIdAndDelete(id);

    if (!deleted) {
      throw new NotFoundException('Coupon not found!');
    }

    return {
      message: 'Coupon deleted successfully!',
    };
  }

  // =========================================================
  // 6. VALIDATE & CALCULATE DISCOUNT
  // =========================================================

  async validateAndCalculateDiscount(
    code: string,
    userId: string,
    orderValue: number,
  ) {
    const normalizedCode = code.trim().toUpperCase();

    const coupon = await this.couponModel.findOne({
      code: normalizedCode,
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found!');
    }

    // -------------------------------------------------------
    // Validate order value
    // -------------------------------------------------------

    if (orderValue < 0) {
      throw new BadRequestException('Order value cannot be negative!');
    }

    // -------------------------------------------------------
    // Active status
    // -------------------------------------------------------

    if (!coupon.isActive) {
      throw new BadRequestException('This coupon is currently inactive!');
    }

    // -------------------------------------------------------
    // Date validation
    // -------------------------------------------------------

    const now = new Date();

    if (coupon.startDate && now < coupon.startDate) {
      throw new BadRequestException('This coupon is not available yet!');
    }

    if (coupon.endDate && now > coupon.endDate) {
      throw new BadRequestException('This coupon has expired!');
    }

    // -------------------------------------------------------
    // Global usage limit
    // -------------------------------------------------------

    if (coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('This coupon has reached its usage limit!');
    }

    // USER USAGE LIMIT

    if (userId) {
      let userObjectId: Types.ObjectId;

      try {
        userObjectId = new Types.ObjectId(userId);
      } catch {
        throw new BadRequestException('Invalid user ID!');
      }

      const userUsedCount =
        coupon.usedBy?.filter(
          (item) => item.userId.toString() === userObjectId.toString(),
        ).length ?? 0;

      if (userUsedCount >= coupon.userLimit) {
        throw new BadRequestException('You have already used this coupon!');
      }
    }

    // -------------------------------------------------------
    // Minimum order value
    // -------------------------------------------------------

    const minimumOrder = coupon.minOrderValue ?? 0;

    if (orderValue < minimumOrder) {
      throw new BadRequestException(
        `Minimum order value is $${minimumOrder.toFixed(2)}.`,
      );
    }

    // -------------------------------------------------------
    // Calculate discount
    // -------------------------------------------------------

    let discountAmount = 0;

    // Percentage discount
    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discountAmount = (orderValue * coupon.discountValue) / 100;

      if (
        coupon.maxDiscountAmount !== null &&
        coupon.maxDiscountAmount !== undefined &&
        discountAmount > coupon.maxDiscountAmount
      ) {
        discountAmount = coupon.maxDiscountAmount;
      }
    }

    // Fixed USD discount
    if (coupon.discountType === DiscountType.FIXED_AMOUNT) {
      discountAmount = Math.min(coupon.discountValue, orderValue);
    }

    // Prevent negative values
    discountAmount = Math.max(0, discountAmount);

    const finalAmount = Math.max(0, orderValue - discountAmount);

    return {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      originalValue: orderValue,
      finalAmount,
      currency: 'USD',
    };
  }

  // =========================================================
  // 7. GET PUBLIC COUPONS
  // =========================================================

  async getPublicCoupons() {
    const now = new Date();

    const coupons = await this.couponModel
      .find({
        isActive: true,

        $and: [
          {
            $or: [
              {
                startDate: {
                  $exists: false,
                },
              },
              {
                startDate: null,
              },
              {
                startDate: {
                  $lte: now,
                },
              },
            ],
          },

          {
            $or: [
              {
                endDate: {
                  $exists: false,
                },
              },
              {
                endDate: null,
              },
              {
                endDate: {
                  $gte: now,
                },
              },
            ],
          },
        ],

        $expr: {
          $lt: ['$usedCount', '$usageLimit'],
        },
      })
      .select('-usedBy');

    return coupons.map((coupon) => this.mapToFrontendResponse(coupon));
  }

  // =========================================================
  // 8. MARK COUPON AS USED
  // =========================================================

  async markCouponAsUsed(code: string, userId: string) {
    const normalizedCode = code.trim().toUpperCase();

    let userObjectId: Types.ObjectId;

    try {
      userObjectId = new Types.ObjectId(userId);
    } catch {
      throw new BadRequestException('Invalid user ID!');
    }

    // -------------------------------------------------------
    // Atomic update
    //
    // IMPORTANT:
    // Only update if:
    // 1. Coupon exists
    // 2. Coupon has remaining global usage
    // 3. User has not reached userLimit
    // -------------------------------------------------------

    const coupon = await this.couponModel.findOne({
      code: normalizedCode,

      isActive: true,

      $expr: {
        $lt: ['$usedCount', '$usageLimit'],
      },

      $or: [
        {
          usedBy: {
            $not: {
              $elemMatch: {
                userId: userObjectId,
              },
            },
          },
        },
      ],
    });

    if (!coupon) {
      throw new BadRequestException(
        'This coupon cannot be used or has already been used by this user!',
      );
    }

    // Check user limit again
    const userUsedCount =
      coupon.usedBy?.filter(
        (item) => item.userId.toString() === userObjectId.toString(),
      ).length ?? 0;

    if (userUsedCount >= coupon.userLimit) {
      throw new BadRequestException('You have already used this coupon!');
    }

    coupon.usedCount += 1;

    coupon.usedBy.push({
      userId: userObjectId,
      usedAt: new Date(),
    });

    await coupon.save();

    return {
      success: true,
      message: 'Coupon usage recorded successfully!',
    };
  }
}
