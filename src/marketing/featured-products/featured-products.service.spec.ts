import { Test, TestingModule } from '@nestjs/testing';
import { FeaturedProductsService } from './featured-products.service';

describe('FeaturedProductsService', () => {
  let service: FeaturedProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FeaturedProductsService],
    }).compile();

    service = module.get<FeaturedProductsService>(FeaturedProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
