import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  FeaturedProduct,
  FeaturedProductSchema,
} from './schemas/featured-product.schema';
import { FeaturedProductsController } from './featured-products.controller';
import { FeaturedProductsService } from './featured-products.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FeaturedProduct.name, schema: FeaturedProductSchema },
    ]),
  ],
  controllers: [FeaturedProductsController],
  providers: [FeaturedProductsService],
})
export class FeaturedProductsModule {}
