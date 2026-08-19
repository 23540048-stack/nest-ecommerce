import { PartialType } from '@nestjs/mapped-types';
import { CreateMembershipTierDto } from './create-membership-tier.dto';

export class UpdateMembershipTierDto extends PartialType(
  CreateMembershipTierDto,
) {}
