import { Test, TestingModule } from '@nestjs/testing';
import { FeaturedProductsController } from './featured-products.controller';

describe('FeaturedProductsController', () => {
  let controller: FeaturedProductsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeaturedProductsController],
    }).compile();

    controller = module.get<FeaturedProductsController>(FeaturedProductsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
