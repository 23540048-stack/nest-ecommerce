import { Test, TestingModule } from '@nestjs/testing';
import { MembershipTiersController } from './membership-tiers.controller';
import { MembershipTiersService } from './membership-tiers.service';

describe('MembershipTiersController', () => {
  let controller: MembershipTiersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MembershipTiersController],
      providers: [MembershipTiersService],
    }).compile();

    controller = module.get<MembershipTiersController>(MembershipTiersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
