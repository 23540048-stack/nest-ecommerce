import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model, Types } from 'mongoose';
import {
  MembershipTier,
  MembershipTierDocument,
} from '../membership-tiers/schemas/membership-tier.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(MembershipTier.name)
    private tierModel: Model<MembershipTierDocument>,
  ) {}

  // 1. Create New User
  async create(createUserDto: CreateUserDto) {
    const { name, email, password } = createUserDto;

    const existed = await this.userModel.findOne({ email });
    if (existed) throw new BadRequestException('Email already exists!');

    // 🟢 SỬA: Truyền password thô, hook pre('save') trong Schema sẽ tự động hash 1 lần duy nhất
    const user = new this.userModel({ name, email, password });
    return user.save();
  }

  // 2. Get All Users (Exclude Passwords)
  async findAll() {
    return this.userModel.find().select('-password').exec();
  }

  // 3. Find User By ID
  async findOne(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .populate('tier')
      .select('-password')
      .exec();

    if (!user) throw new NotFoundException('User not found!');
    return user;
  }

  // 4. Update User Profile
  async update(userId: string, updateData: any) {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, { $set: updateData }, { new: true })
      .select('-password')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException('User not found!');
    }

    return updatedUser;
  }

  // 5. Create User Address
  async createAddress(param1: any, param2?: any) {
    const userId = param2 ? param1 : param1?.userId;
    const addressData = param2 || param1;

    if (userId) {
      const user = await this.userModel.findById(userId);
      if (user) {
        if ((user as any).addresses) {
          if (addressData.isDefault) {
            (user as any).addresses.forEach((a: any) => {
              a.isDefault = false;
            });
          }
          (user as any).addresses.push(addressData);
          await user.save();
          return {
            message: 'Address added successfully!',
            addresses: (user as any).addresses,
          };
        }
      }
    }

    return { message: 'Address created successfully!', data: addressData };
  }

  // 5b. Update User Address
  async updateAddress(
    userId: string,
    addressId: string,
    updateAddressDto: any,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found!');

    const addresses = (user as any).addresses;
    if (!addresses || addresses.length === 0) {
      throw new NotFoundException('Address not found!');
    }

    const address = addresses.id
      ? addresses.id(addressId)
      : addresses.find((a: any) => (a._id || a.id)?.toString() === addressId);

    if (!address) {
      throw new NotFoundException('Address not found!');
    }

    if (updateAddressDto.isDefault) {
      addresses.forEach((a: any) => {
        a.isDefault = false;
      });
    }

    if (updateAddressDto.receiverName !== undefined)
      address.receiverName = updateAddressDto.receiverName;
    if (updateAddressDto.phone !== undefined)
      address.phone = updateAddressDto.phone;
    if (updateAddressDto.fullAddress !== undefined)
      address.fullAddress = updateAddressDto.fullAddress;
    if (updateAddressDto.isDefault !== undefined)
      address.isDefault = updateAddressDto.isDefault;

    await user.save();

    return {
      message: 'Address updated successfully!',
      addresses: (user as any).addresses,
    };
  }

  // 5c. Delete User Address
  async deleteAddress(userId: string, addressId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found!');

    const addresses = (user as any).addresses;
    if (!addresses) {
      throw new NotFoundException('Address not found!');
    }

    if (typeof addresses.pull === 'function') {
      addresses.pull({ _id: addressId });
    } else {
      (user as any).addresses = addresses.filter(
        (a: any) => (a._id || a.id)?.toString() !== addressId,
      );
    }

    await user.save();

    return {
      message: 'Address deleted successfully!',
      addresses: (user as any).addresses,
    };
  }

  // Change Password
  async changePassword(
    userId: string,
    dto: { currentPassword: string; newPassword: string },
  ) {
    // 🟢 SỬA 1: Bổ sung .select('+password') để lấy trường password ra đối chiếu
    const user = await this.userModel.findById(userId).select('+password');
    if (!user) throw new NotFoundException('User not found');

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Current password is not correct');
    }

    // 🟢 SỬA 2: Gán trực tiếp newPassword, để hook pre('save') mã hóa tự động
    user.password = dto.newPassword;
    await user.save();

    return { message: 'Password updated successfully' };
  }

  // 6. Get User Addresses
  async getAddresses(userId?: string) {
    if (userId) {
      const user = await this.userModel.findById(userId).exec();
      if (user && (user as any).addresses) {
        return (user as any).addresses;
      }
    }
    return [];
  }

  // 7. Find User By Email
  async findByEmail(email: string): Promise<UserDocument | null> {
    // 🟢 SỬA: Bổ sung .select('+password') để AuthService dùng đăng nhập
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  // 8. Find User By Reset Token
  async findByResetToken(token: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ resetPasswordToken: token }).exec();
  }

  // 9. Get Wishlist Products
  async getWishlist(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .populate('wishlist')
      .exec();

    if (!user) throw new NotFoundException('User not found!');
    return user.wishlist || [];
  }

  // 10. Toggle Wishlist Item
  async toggleWishlist(userId: string, productId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found!');

    if (!user.wishlist) {
      user.wishlist = [];
    }

    const prodObjectId = new Types.ObjectId(productId);
    const existsIndex = user.wishlist.findIndex(
      (id) => id.toString() === productId,
    );

    if (existsIndex > -1) {
      user.wishlist.splice(existsIndex, 1);
      await user.save();

      return {
        message: 'Product removed from wishlist',
        isLiked: false,
      };
    } else {
      user.wishlist.push(prodObjectId as any);
      await user.save();

      return {
        message: 'Product added to wishlist',
        isLiked: true,
      };
    }
  }

  // 11. Find Tier Matching Total Spend
  async findMatchingTier(
    totalSpent: number,
  ): Promise<MembershipTierDocument | null> {
    const tiers = await this.tierModel.find().sort({ minSpent: -1 });
    if (tiers.length === 0) return null;

    const matched = tiers.find((t) => totalSpent >= t.minSpent);
    return matched || tiers[tiers.length - 1];
  }

  // 12. Process Order Points (Chakra) & Tier Upgrade
  async processOrderSuccess(userId: string, orderTotal: number) {
    const user = await this.userModel.findById(userId).populate('tier');
    if (!user) throw new NotFoundException('User not found!');

    let currentTier = user.tier as unknown as MembershipTierDocument;
    if (!currentTier) {
      const matched = await this.findMatchingTier(user.totalSpent || 0);
      if (matched) currentTier = matched;
    }

    user.totalSpent = (user.totalSpent || 0) + orderTotal;

    const multiplier = currentTier?.pointsMultiplier || 1;
    const earnedPoints = Math.floor(orderTotal * multiplier);
    user.points = (user.points || 0) + earnedPoints;

    const newTier = await this.findMatchingTier(user.totalSpent);
    if (newTier) {
      user.tier = newTier._id as Types.ObjectId;
    }

    await user.save();

    return {
      totalSpent: user.totalSpent,
      earnedPoints,
      points: user.points,
      tier: newTier ? newTier.name : currentTier?.name,
    };
  }

  // 13. Get Membership Status & Progress
  async getMembershipStatus(userId: string) {
    const user = await this.userModel.findById(userId).populate('tier').exec();
    if (!user) throw new NotFoundException('User not found!');

    const allTiers = await this.tierModel.find().sort({ minSpent: 1 }).exec();

    let currentTier = user.tier as unknown as MembershipTierDocument;
    if (!currentTier) {
      const matched = await this.findMatchingTier(user.totalSpent || 0);
      if (matched) currentTier = matched;
    }

    const nextTier = allTiers.find((t) => t.minSpent > (user.totalSpent || 0));
    const amountNeeded = nextTier
      ? nextTier.minSpent - (user.totalSpent || 0)
      : 0;

    return {
      currentTier: currentTier ? currentTier.name : 'GENIN',
      discountPercent: currentTier ? currentTier.discountRate : 0,
      pointMultiplier: currentTier ? currentTier.pointsMultiplier : 1,
      totalSpent: user.totalSpent || 0,
      points: user.points || 0,
      nextTier: nextTier ? nextTier.name : 'Max Rank Achieved',
      amountNeededForNextTier: amountNeeded,
    };
  }

  // 14. ADMIN ONLY: Block / Unblock User
  async toggleBlockUser(userId: string, isBlocked?: boolean) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found!');
    }

    user.isBlocked = isBlocked !== undefined ? isBlocked : !user.isBlocked;
    await user.save();

    return {
      message: `Account ${user.isBlocked ? 'blocked' : 'unblocked'} successfully!`,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        isBlocked: user.isBlocked,
      },
    };
  }

  // 15. ADMIN ONLY: Update User Role
  async updateUserRole(userId: string, newRole: string) {
    const validRoles = ['user', 'admin'];
    if (!validRoles.includes(newRole)) {
      throw new BadRequestException(
        `Invalid role! Allowed values: ${validRoles.join(', ')}`,
      );
    }

    const user = await this.userModel
      .findByIdAndUpdate(userId, { role: newRole }, { new: true })
      .select('-password');

    if (!user) {
      throw new NotFoundException('User not found!');
    }

    return {
      message: `Updated account role to ${newRole.toUpperCase()} successfully!`,
      user,
    };
  }
}
