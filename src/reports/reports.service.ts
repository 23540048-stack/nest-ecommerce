import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  // 1. Thống kê tổng quan (Dashboard Summary)
  async getOverviewStats() {
    const [totalUsers, totalProducts, totalOrders, revenueResult] =
      await Promise.all([
        this.userModel.countDocuments(),
        this.productModel.countDocuments(),
        this.orderModel.countDocuments(),
        this.orderModel.aggregate([
          { $match: { status: 'DELIVERED' } },
          { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } },
        ]),
      ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    return {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
    };
  }

  // 2. Báo cáo doanh thu theo khoảng thời gian (Lọc theo ngày)
  async getRevenueByDateRange(startDateStr?: string, endDateStr?: string) {
    const startDate = startDateStr
      ? new Date(startDateStr)
      : new Date(new Date().setDate(new Date().getDate() - 30)); // Mặc định 30 ngày gần nhất
    const endDate = endDateStr ? new Date(endDateStr) : new Date();

    return this.orderModel.aggregate([
      {
        $match: {
          status: 'DELIVERED',
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalPrice' },
          totalOrders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  // 3. Top sản phẩm bán chạy nhất
  async getTopSellingProducts(limit: number = 5) {
    return this.orderModel.aggregate([
      { $match: { status: 'DELIVERED' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalQuantitySold: { $sum: '$items.quantity' },
          totalRevenue: {
            $sum: { $multiply: ['$items.price', '$items.quantity'] },
          },
        },
      },
      { $sort: { totalQuantitySold: -1 } },
      { $limit: Number(limit) },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      { $unwind: '$productInfo' },
      {
        $project: {
          _id: 1,
          productName: '$productInfo.name',
          totalQuantitySold: 1,
          totalRevenue: 1,
        },
      },
    ]);
  }

  // 4. Thống kê số lượng đơn hàng theo trạng thái
  async getOrderStatusBreakdown() {
    return this.orderModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
  }

  // 5. Thống kê phân bổ Hạng thành viên của User
  async getMembershipDistribution() {
    return this.userModel.aggregate([
      {
        $group: {
          _id: '$tier',
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'membershiptiers',
          localField: '_id',
          foreignField: '_id',
          as: 'tierInfo',
        },
      },
      {
        $project: {
          tierName: {
            $arrayElemAt: ['$tierInfo.name', 0],
          },
          count: 1,
        },
      },
    ]);
  }
}
