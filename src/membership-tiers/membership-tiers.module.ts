import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MembershipTiersService } from './membership-tiers.service';
import { MembershipTiersController } from './membership-tiers.controller';
import {
  MembershipTier,
  MembershipTierSchema,
} from './schemas/membership-tier.schema';

import {
  MembershipSetting,
  MembershipSettingSchema,
} from '../membership-settings/schemas/membership-setting.schema';
import { UserTierListener } from './user-tier-listener.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { Voucher, VoucherSchema } from '../vouchers/schemas/voucher.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MembershipTier.name, schema: MembershipTierSchema },
      { name: MembershipSetting.name, schema: MembershipSettingSchema },
      { name: User.name, schema: UserSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Voucher.name, schema: VoucherSchema },
    ]),
  ],
  controllers: [MembershipTiersController],
  providers: [MembershipTiersService, UserTierListener],
  exports: [MembershipTiersService, MongooseModule],
})
export class MembershipTiersModule {}
