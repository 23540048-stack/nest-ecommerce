import { Test, TestingModule } from '@nestjs/testing';
import { MembershipTiersService } from './membership-tiers.service';

describe('MembershipTiersService', () => {
  let service: MembershipTiersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MembershipTiersService],
    }).compile();

    service = module.get<MembershipTiersService>(MembershipTiersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
