// src/admin/dashboard/dashboard.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// Export các Interface để Controller và các Module khác có thể định danh kiểu dữ liệu (Sửa lỗi TS4053)
export interface RecentMission {
  id: string;
  ninja: string;
  status: string;
}

export interface LowStockItem {
  name: string;
  stock: number;
}

export interface DashboardStatsResponse {
  totalRevenue: number;
  activeMissions: number;
  totalGear: number;
  registeredShinobi: number;
  recentMissions: RecentMission[];
  lowStockItems: LowStockItem[];
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectModel('Order') private readonly orderModel: Model<any>,
    @InjectModel('Product') private readonly productModel: Model<any>,
    @InjectModel('User') private readonly userModel: Model<any>,
  ) {}

  async getStats(): Promise<DashboardStatsResponse> {
    let totalRevenue = 0;
    let activeMissions = 0;
    let totalGear = 0;
    let registeredShinobi = 0;

    // Khai báo kiểu mảng rõ ràng để tránh lỗi never[]
    let recentMissions: RecentMission[] = [];
    let lowStockItems: LowStockItem[] = [];

    // 1. Tính tổng doanh thu
    try {
      const revenueResult = await this.orderModel.aggregate([
        { $match: { status: { $in: ['DELIVERED', 'COMPLETED', 'SEALED'] } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]);
      if (revenueResult.length > 0) {
        totalRevenue = revenueResult[0].total || 0;
      }
    } catch (err) {
      this.logger.error('Error calculating total revenue', err);
    }

    // 2. Đếm số đơn hàng đang xử lý
    try {
      activeMissions = await this.orderModel.countDocuments({
        status: { $in: ['PENDING', 'PROCESSING', 'SHIPPING'] },
      } as any);
    } catch (err) {
      this.logger.error('Error counting active orders', err);
    }

    // 3. Đếm tổng số sản phẩm
    try {
      totalGear = await this.productModel.countDocuments();
    } catch (err) {
      this.logger.error('Error counting products', err);
    }

    // 4. Đếm tổng số người dùng
    try {
      registeredShinobi = await this.userModel.countDocuments({
        role: { $in: ['user', 'customer', 'USER', 'CUSTOMER'] },
      } as any);
    } catch (err) {
      this.logger.error('Error counting users', err);
    }

    // 5. Lấy danh sách 5 đơn hàng gần nhất
    try {
      const rawOrders = await this.orderModel
        .find()
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
        .exec();

      recentMissions = rawOrders.map((order: any) => ({
        id: order.code || String(order._id).slice(-6).toUpperCase(),
        ninja:
          order.shippingAddress?.fullName ||
          order.fullName ||
          'Shinobi Customer',
        status: order.status || 'PENDING',
      }));
    } catch (err) {
      this.logger.error('Error fetching recent orders', err);
    }

    // 6. Lấy danh sách sản phẩm sắp hết hàng (stock <= 5)
    try {
      const rawLowStock = await this.productModel
        .find({ stock: { $lte: 5 } } as any)
        .sort({ stock: 1 })
        .limit(5)
        .select('name stock')
        .lean()
        .exec();

      lowStockItems = rawLowStock.map((item: any) => ({
        name: item.name || 'Unknown Item',
        stock: item.stock ?? 0,
      }));
    } catch (err) {
      this.logger.error('Error fetching low stock items', err);
    }

    return {
      totalRevenue,
      activeMissions,
      totalGear,
      registeredShinobi,
      recentMissions,
      lowStockItems,
    };
  }
}
