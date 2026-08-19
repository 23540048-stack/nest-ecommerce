import { Test, TestingModule } from '@nestjs/testing';
import { MembershipSettingsService } from './membership-settings.service';

describe('MembershipSettingsService', () => {
  let service: MembershipSettingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MembershipSettingsService],
    }).compile();

    service = module.get<MembershipSettingsService>(MembershipSettingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
