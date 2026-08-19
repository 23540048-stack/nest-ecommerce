import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,

    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,
  ) {}

  // Fetch all categories
  async findAll(): Promise<any[]> {
    return this.categoryModel
      .aggregate([
        {
          $lookup: {
            from: 'products', // Tên collection Product trong MongoDB
            localField: '_id',
            foreignField: 'category',
            as: 'products',
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            icon: 1,
            status: 1,
            slug: 1,
            createdAt: 1,
            updatedAt: 1,
            gearCount: { $size: '$products' },
          },
        },
        { $sort: { createdAt: -1 } },
      ])
      .exec();
  }

  // Find single category by ID
  async findOne(id: string): Promise<any> {
    this.validateObjectId(id);
    const category = await this.categoryModel.findById(id).lean().exec();
    if (!category) {
      throw new NotFoundException(`Category not found with ID: ${id}`);
    }

    // Đếm số lượng sản phẩm thuộc category
    const gearCount = await this.productModel.countDocuments({
      category: id as any,
    });

    return {
      ...category,
      gearCount,
    };
  }

  // Create new category
  async create(createCategoryDto: CreateCategoryDto): Promise<any> {
    const newCategory = new this.categoryModel(createCategoryDto);
    const saved = await newCategory.save();
    return {
      ...saved.toObject(),
      gearCount: 0,
    };
  }

  // Update existing category
  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<any> {
    this.validateObjectId(id);
    const updatedCategory = await this.categoryModel
      .findByIdAndUpdate(id, updateCategoryDto, { new: true })
      .lean()
      .exec();

    if (!updatedCategory) {
      throw new NotFoundException(`Category not found with ID: ${id}`);
    }

    const gearCount = await this.productModel.countDocuments({
      category: id as any,
    });

    return {
      ...updatedCategory,
      gearCount,
    };
  }

  // Delete category
  async remove(id: string): Promise<{ message: string }> {
    this.validateObjectId(id);

    // Kiểm tra nếu vẫn còn sản phẩm thuộc category này thì chặn xóa
    const count = await this.productModel.countDocuments({
      category: id as any,
    });

    if (count > 0) {
      throw new BadRequestException(
        `Cannot delete. There are still ${count} gear(s) associated with this category.`,
      );
    }

    const deleted = await this.categoryModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException(`Category not found with ID: ${id}`);
    }

    return { message: 'Category unsealed and successfully deleted' };
  }

  // Validate MongoDB ObjectId format
  private validateObjectId(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid MongoDB ObjectId format');
    }
  }
}
