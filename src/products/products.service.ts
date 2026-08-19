import 'multer';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GetProductsQueryDto } from './dto/get-products-query.dto';
import { CreateReviewDto } from './dto/create-review.dto';

// Remove Vietnamese accents for search filtering
function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

// Build accent-insensitive Vietnamese search regex
function buildVietnameseRegex(text: string): RegExp {
  const cleanText = removeVietnameseTones(text.trim().normalize('NFC'));
  const charMap: Record<string, string> = {
    a: '[aàáảãạăằắẳẵặâầấẩẫậ]',
    e: '[eèéẻẽẹêềếểễệ]',
    i: '[iìíỉĩị]',
    o: '[oòóỏõọôồốổỗộơờớởỡợ]',
    u: '[uùúủũụưừứửữự]',
    y: '[yỳýỷỹỵ]',
    d: '[dđ]',
  };
  let pattern = cleanText.toLowerCase();
  for (const [char, regex] of Object.entries(charMap)) {
    pattern = pattern.replace(new RegExp(char, 'g'), regex);
  }
  return new RegExp(pattern, 'i');
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  // Create Product
  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Validate category ObjectId if present
    if (createProductDto.category) {
      if (!Types.ObjectId.isValid(createProductDto.category as any)) {
        throw new BadRequestException('Invalid Category ID format');
      }
    }

    const createdProduct = new this.productModel(createProductDto);
    const savedProduct = await createdProduct.save();
    return savedProduct.populate('category');
  }

  // Get All Products with Filters, Pagination, and Population
  async findAll(query: GetProductsQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      minPrice,
      maxPrice,
      category,
      minRating,
      sortBy,
    } = query;

    const skip = (page - 1) * limit;
    const filter: any = {};

    // 1. Search by name (supports Vietnamese accents)
    if (search) {
      filter.name = buildVietnameseRegex(search);
    }

    // 2. Filter by price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }

    // 3. Filter by category ID
    if (category) {
      if (Types.ObjectId.isValid(category)) {
        filter.category = new Types.ObjectId(category);
      } else {
        filter.category = category;
      }
    }

    // 4. Filter by minimum rating
    if (minRating !== undefined) {
      filter.rating = { $gte: minRating };
    }

    // 5. Sorting configuration
    let sortOptions: any = { createdAt: -1 };
    if (sortBy === 'price_asc') sortOptions = { price: 1 };
    if (sortBy === 'price_desc') sortOptions = { price: -1 };
    if (sortBy === 'rating_desc') sortOptions = { rating: -1 };

    const [data, total] = await Promise.all([
      this.productModel
        .find(filter)
        .populate('category') // Population of category reference
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Find single product by ID
  async findOne(id: string): Promise<Product> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Product ID format');
    }

    const product = await this.productModel
      .findById(id)
      .populate('category')
      .exec();

    if (!product) {
      throw new NotFoundException(`Product not found with ID: ${id}`);
    }
    return product;
  }

  // Update product
  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Product ID format');
    }

    // Validate category ObjectId if it's being updated
    if (updateProductDto.category) {
      if (!Types.ObjectId.isValid(updateProductDto.category as any)) {
        throw new BadRequestException('Invalid Category ID format');
      }
    }

    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, updateProductDto, { new: true })
      .populate('category')
      .exec();

    if (!updatedProduct) {
      throw new NotFoundException(`Product not found with ID: ${id}`);
    }
    return updatedProduct;
  }

  // Delete product
  async remove(id: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Product ID format');
    }

    const result = await this.productModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Product not found with ID: ${id}`);
    }
    return { message: 'Product successfully deleted' };
  }

  // Add / Update review to product & Sync with Order
  async addReview(
    productId: string,
    userId: string,
    userName: string,
    dto: CreateReviewDto,
    files?: Express.Multer.File[],
  ) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid Product ID format');
    }

    const product = await this.productModel.findById(productId);
    if (!product) throw new NotFoundException('Product not found');

    // 1. Xử lý ảnh upload từ Cloudinary
    const uploadedImageUrls = files
      ? files
          .map(
            (file) =>
              file.path || (file as any).secure_url || (file as any).url,
          )
          .filter((url): url is string => Boolean(url))
      : [];

    // 2. Xử lý ảnh truyền qua DTO (nếu có)
    let dtoImages: string[] = [];
    if (dto.images) {
      dtoImages = Array.isArray(dto.images) ? dto.images : [dto.images];
    }

    // 3. Lọc sạch triệt để các giá trị null/undefined/"null"/"undefined"/chuỗi rỗng
    const newImages = [...uploadedImageUrls, ...dtoImages].filter(
      (img) =>
        img &&
        typeof img === 'string' &&
        img !== 'null' &&
        img !== 'undefined' &&
        img.trim() !== '',
    );

    // 4. Tìm vị trí review cũ của người dùng này
    const reviewIndex = product.reviews.findIndex(
      (r) => r.user.toString() === userId,
    );

    if (reviewIndex !== -1) {
      // NẾU ĐÃ TỒN TẠI -> CHỈNH SỬA (UPDATE)
      product.reviews[reviewIndex].rating = Number(dto.rating);
      product.reviews[reviewIndex].comment = dto.comment;

      // Cập nhật mảng ảnh nếu có ảnh mới gửi lên
      if (newImages.length > 0) {
        product.reviews[reviewIndex].images = newImages;
      }
    } else {
      // NẾU CHƯA TỒN TẠI -> THÊM MỚI (CREATE)
      const newReview = {
        user: new Types.ObjectId(userId),
        userName,
        rating: Number(dto.rating),
        comment: dto.comment,
        images: newImages,
        videos: dto.videos || [],
      };
      product.reviews.push(newReview as any);
    }

    // 5. Tính toán lại số lượng và điểm Rating trung bình
    product.numReviews = product.reviews.length;
    const totalRating = product.reviews.reduce(
      (sum, item) => sum + item.rating,
      0,
    );
    product.rating = Number((totalRating / product.reviews.length).toFixed(1));

    await product.save();

    // 6. Đồng bộ trạng thái isReviewed vào bảng Order (nếu có orderId)
    const orderId = dto.orderId;
    const itemId = dto.itemId;

    if (orderId && Types.ObjectId.isValid(orderId)) {
      const orderFilter =
        itemId && Types.ObjectId.isValid(itemId)
          ? {
              _id: new Types.ObjectId(orderId),
              'items._id': new Types.ObjectId(itemId),
            }
          : {
              _id: new Types.ObjectId(orderId),
              'items.productId': new Types.ObjectId(productId),
            };

      await this.orderModel.updateOne(orderFilter, {
        $set: {
          'items.$.isReviewed': true,
          'items.$.rating': Number(dto.rating),
          'items.$.comment': dto.comment,
        },
      });
    }

    return {
      message:
        reviewIndex !== -1
          ? 'Review updated successfully!'
          : 'Review submitted successfully!',
      rating: product.rating,
      numReviews: product.numReviews,
    };
  }

  // Delete review & Reset Order Status
  async deleteReview(
    productId: string,
    userId: string,
    orderId?: string,
    itemId?: string,
  ) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid Product ID format');
    }

    const product = await this.productModel.findById(productId);
    if (!product) throw new NotFoundException('Product not found');

    // Tìm vị trí review của người dùng
    const reviewIndex = product.reviews.findIndex(
      (r) => r.user.toString() === userId,
    );

    if (reviewIndex === -1) {
      throw new NotFoundException('Review not found');
    }

    // Xóa review khỏi mảng
    product.reviews.splice(reviewIndex, 1);
    product.numReviews = product.reviews.length;

    // Tính toán lại rating trung bình
    if (product.numReviews > 0) {
      const totalRating = product.reviews.reduce(
        (sum, item) => sum + item.rating,
        0,
      );
      product.rating = Number((totalRating / product.numReviews).toFixed(1));
    } else {
      product.rating = 0;
    }

    await product.save();

    // Đồng bộ reset trạng thái isReviewed trong bảng Order (nếu có orderId)
    if (orderId && Types.ObjectId.isValid(orderId)) {
      const orderFilter =
        itemId && Types.ObjectId.isValid(itemId)
          ? {
              _id: new Types.ObjectId(orderId),
              'items._id': new Types.ObjectId(itemId),
            }
          : {
              _id: new Types.ObjectId(orderId),
              'items.productId': new Types.ObjectId(productId),
            };

      await this.orderModel.updateOne(orderFilter, {
        $set: { 'items.$.isReviewed': false },
        $unset: { 'items.$.rating': '', 'items.$.comment': '' },
      });
    }

    return {
      message: 'Review deleted successfully!',
      rating: product.rating,
      numReviews: product.numReviews,
    };
  }
}
