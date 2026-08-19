import { Test, TestingModule } from '@nestjs/testing';
import { MembershipSettingsController } from './membership-settings.controller';

describe('MembershipSettingsController', () => {
  let controller: MembershipSettingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MembershipSettingsController],
    }).compile();

    controller = module.get<MembershipSettingsController>(MembershipSettingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
