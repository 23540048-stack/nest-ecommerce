import 'multer';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Request,
  UploadedFiles,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GetProductsQueryDto } from './dto/get-products-query.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { multerOptions } from './helpers/multer.config';

// Import các tài nguyên Phân quyền
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { ClientAuthGuard } from '../auth/guards/client-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // 1. Tạo mới sản phẩm (Bảo mật: Admin)
  @Post()
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  // 2. Lấy danh sách sản phẩm + Tìm kiếm + Lọc + Phân trang (Công khai)
  @Get()
  findAll(@Query() query: GetProductsQueryDto) {
    return this.productsService.findAll(query);
  }

  // 3. API Upload ảnh sản phẩm (Bảo mật: Admin)
  @Post('upload')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('image', multerOptions))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Please select an image file to upload!');
    }

    return {
      message: 'File uploaded to Cloudinary successfully.',
      imageUrl: file.path,
    };
  }

  // 4. API Khách hàng gửi Đánh giá (Review) sản phẩm (Khách hàng)
  @Post(':id/reviews')
  @UseGuards(ClientAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 5, multerOptions))
  async addReview(
    @Param('id') productId: string,
    @Request() req: any,
    @Body() createReviewDto: CreateReviewDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const userId = req.user?.userId || req.user?.sub;
    return this.productsService.addReview(
      productId,
      userId,
      req.user.name,
      createReviewDto,
      files,
    );
  }

  // 5. Xem chi tiết 1 sản phẩm theo ID (Công khai)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  // 6. Cập nhật sản phẩm theo ID (Bảo mật: Admin)
  @Patch(':id')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  // 7. Xóa sản phẩm theo ID (Bảo mật: Admin)
  @Delete(':id')
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  // 8. Xóa đánh giá (Khách hàng)
  @Delete(':id/reviews')
  @UseGuards(ClientAuthGuard)
  async deleteReview(
    @Param('id') productId: string,
    @Query('orderId') orderId: string,
    @Query('itemId') itemId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.userId || req.user?.sub;
    return this.productsService.deleteReview(
      productId,
      userId,
      orderId,
      itemId,
    );
  }
}
