import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MailerService } from '@nestjs-modules/mailer';
import { EventEmitter2 } from '@nestjs/event-emitter';

import {
  Order,
  OrderDocument,
  OrderStatus,
  PaymentStatus,
} from './schemas/order.schema';
import { Cart, CartDocument } from '../cart/schemas/cart.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { CouponsService } from '../coupons/coupons.service';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OrderCompletedEvent } from './events/order-completed.event';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,

    @InjectModel(Cart.name)
    private readonly cartModel: Model<CartDocument>,

    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,

    private readonly mailerService: MailerService,
    private readonly couponsService: CouponsService,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService, // Giữ lại để gửi thông báo cho Admin
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ============================================================
  // CREATE ORDER
  // Currency: USD
  // ============================================================

  async createOrder(
    userId: string,
    createOrderDto: CreateOrderDto,
  ): Promise<{
    order: OrderDocument;
    paymentUrl: string | null;
  }> {
    const userObjectId = new Types.ObjectId(userId);

    // 1. GET CART
    const cart = await this.cartModel.findOne({
      userId: userObjectId,
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Your shopping cart is empty.');
    }

    const originalTotal = Number(cart.totalPrice || 0);

    if (originalTotal <= 0) {
      throw new BadRequestException('The cart total must be greater than 0.');
    }

    // 2. CHECK PRODUCT STOCK
    const orderItems: Array<{
      productId: any;
      name: string;
      quantity: number;
      price: number;
      size?: string;
      color?: string;
      image?: string;
    }> = [];

    for (const item of cart.items) {
      const product = await this.productModel.findById(item.productId);

      if (!product) {
        throw new NotFoundException(
          `Product with ID ${item.productId} was not found.`,
        );
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Product "${product.name}" does not have enough stock.`,
        );
      }

      orderItems.push({
        productId: item.productId,
        name: product.name,
        quantity: Number(item.quantity),
        price: Number(item.price || product.price),
        size: (item as any).size,
        color: (item as any).color,
        image: product.images?.[0] || (item as any).image || '',
      });
    }

    // 3. COUPON DISCOUNT
    let couponDiscountAmount = 0;
    let appliedCouponCode: string | null = null;

    if (createOrderDto.couponCode?.trim()) {
      const normalizedCouponCode = createOrderDto.couponCode
        .trim()
        .toUpperCase();

      const discountResult =
        await this.couponsService.validateAndCalculateDiscount(
          normalizedCouponCode,
          userId,
          originalTotal,
        );

      couponDiscountAmount = Number(discountResult.discountAmount || 0);
      appliedCouponCode = discountResult.code;
    }

    // 4. MEMBERSHIP DISCOUNT
    const membershipInfo = await this.usersService.getMembershipStatus(userId);
    const membershipDiscountPercent = Number(
      membershipInfo.discountPercent || 0,
    );
    const membershipDiscountAmount =
      (originalTotal * membershipDiscountPercent) / 100;

    // 5. CALCULATE FINAL TOTAL
    const totalDiscountAmount = couponDiscountAmount + membershipDiscountAmount;
    const finalTotalPrice = Math.max(0, originalTotal - totalDiscountAmount);

    // 6. CREATE ORDER
    const order = new this.orderModel({
      user: userObjectId,
      userId: userObjectId,
      items: orderItems,
      totalPrice: finalTotalPrice,
      discountAmount: totalDiscountAmount,
      couponCode: appliedCouponCode,
      shippingAddress: createOrderDto.shippingAddress,
      paymentMethod: createOrderDto.paymentMethod || 'COD',
      paymentStatus: PaymentStatus.UNPAID,
      status: OrderStatus.PENDING,
    });

    await order.save();

    // 7. MARK COUPON AS USED
    if (appliedCouponCode) {
      await this.couponsService.markCouponAsUsed(appliedCouponCode, userId);
    }

    // 8. UPDATE PRODUCT STOCK
    for (const item of cart.items) {
      await this.productModel.findByIdAndUpdate(
        new Types.ObjectId(item.productId as any),
        {
          $inc: { stock: -Number(item.quantity) },
        },
      );
    }

    // 9. CLEAR CART
    cart.items = [];
    cart.totalPrice = 0;
    cart.markModified('items');
    await cart.save();

    // 10. ADMIN NOTIFICATION (Bắn thông báo về trang Admin)
    await this.notificationsService.createAndEmit({
      title: 'NEW MISSION ORDER',
      message: `New order #${order._id
        .toString()
        .slice(-6)} placed ($${finalTotalPrice.toFixed(2)})`,
      type: 'success',
      link: '/admin/orders',
      userId,
    });

    // 11. SEND CONFIRMATION EMAIL TO CLIENT
    const populatedOrder = await order.populate('user', 'email name');
    const userEmail = (populatedOrder.user as any)?.email;

    if (userEmail) {
      const formatUSD = (value: number) => `$${value.toFixed(2)}`;

      this.mailerService
        .sendMail({
          to: userEmail,
          subject: 'Order Confirmation - Shinobi Goods',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #222;">
              <h2>Thank you for your order!</h2>
              <p>Your order has been successfully placed at <strong>Shinobi Goods</strong>.</p>
              <hr />
              <p><strong>Order ID:</strong> ${order._id}</p>
              <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
              <p><strong>Shipping Address:</strong> ${order.shippingAddress}</p>
              <hr />
              <p><strong>Original Subtotal:</strong> ${formatUSD(originalTotal)}</p>
              ${
                membershipDiscountAmount > 0
                  ? `<p style="color: #16a34a;"><strong>Membership Discount (${membershipInfo.currentTier}):</strong> -${formatUSD(membershipDiscountAmount)} (${membershipDiscountPercent}%)</p>`
                  : ''
              }
              ${
                couponDiscountAmount > 0
                  ? `<p style="color: #16a34a;"><strong>Coupon Discount (${appliedCouponCode}):</strong> -${formatUSD(couponDiscountAmount)}</p>`
                  : ''
              }
              <hr />
              <h3>Total: <span style="color: #ea580c;">${formatUSD(finalTotalPrice)}</span></h3>
              <p><strong>Currency:</strong> USD</p>
              <p><strong>Order Status:</strong> ${order.status}</p>
              <hr />
              <p>We will notify you when your order status changes.</p>
              <p>Thank you for shopping with <strong>Shinobi Goods</strong>.</p>
            </div>
          `,
        })
        .catch((err) =>
          console.error('Failed to send order confirmation email:', err),
        );
    }

    const paymentUrl: string | null = null;

    return {
      order,
      paymentUrl,
    };
  }

  // ============================================================
  // GET USER ORDERS
  // ============================================================

  async getUserOrders(userId: string): Promise<OrderDocument[]> {
    return this.orderModel
      .find({ user: new Types.ObjectId(userId) })
      .populate('items.productId')
      .sort({ createdAt: -1 });
  }

  // ============================================================
  // GET ORDER BY ID
  // ============================================================

  async getOrderById(userId: string, orderId: string): Promise<OrderDocument> {
    const order = await this.orderModel
      .findOne({
        _id: new Types.ObjectId(orderId),
        user: new Types.ObjectId(userId),
      })
      .populate('items.productId');

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    return order;
  }

  // ============================================================
  // USER - REQUEST ORDER CANCELLATION
  // ============================================================

  async requestCancelOrder(
    userId: string,
    orderId: string,
  ): Promise<OrderDocument> {
    const order = await this.orderModel.findOne({
      _id: new Types.ObjectId(orderId),
      user: new Types.ObjectId(userId),
    });

    if (!order) {
      throw new NotFoundException('Order not found or access denied.');
    }

    if (order.status === OrderStatus.CANCEL_REQUESTED) {
      throw new BadRequestException('Cancellation request already submitted.');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order has already been cancelled.');
    }

    if (
      order.status === OrderStatus.SHIPPED ||
      order.status === OrderStatus.DELIVERED
    ) {
      throw new BadRequestException(
        'Cannot request cancellation for orders that are already shipped or delivered.',
      );
    }

    order.status = OrderStatus.CANCEL_REQUESTED;
    await order.save();

    // ADMIN NOTIFICATION (Thông báo cho Admin biết có yêu cầu hủy đơn)
    await this.notificationsService.createAndEmit({
      title: 'ORDER CANCEL REQUESTED',
      message: `User requested cancellation for order #${order._id
        .toString()
        .slice(-6)}`,
      type: 'warning',
      link: '/admin/orders',
      userId,
    });

    return order;
  }

  // ============================================================
  // ADMIN - GET ALL ORDERS
  // ============================================================

  async getAllOrders(): Promise<OrderDocument[]> {
    return this.orderModel
      .find()
      .populate('user', 'fullName name rank village phone email')
      .populate('items.productId')
      .sort({ createdAt: -1 });
  }

  // ============================================================
  // ADMIN - UPDATE ORDER STATUS
  // ============================================================

  async updateOrderStatus(
    orderId: string,
    status: string,
  ): Promise<OrderDocument> {
    const validStatuses = Object.values(OrderStatus);

    if (!validStatuses.includes(status as OrderStatus)) {
      throw new BadRequestException(
        `Invalid order status. Allowed values: ${validStatuses.join(', ')}`,
      );
    }

    const currentOrder = await this.orderModel.findById(orderId);

    if (!currentOrder) {
      throw new NotFoundException('Order not found.');
    }

    const oldStatus = currentOrder.status;
    currentOrder.status = status as OrderStatus;

    // DELIVERED
    if (
      status === OrderStatus.DELIVERED &&
      oldStatus !== OrderStatus.DELIVERED &&
      !currentOrder.isRewardProcessed
    ) {
      if (currentOrder.paymentMethod === 'COD') {
        currentOrder.paymentStatus = PaymentStatus.PAID;
      }

      currentOrder.isRewardProcessed = true;

      await this.usersService.processOrderSuccess(
        currentOrder.user.toString(),
        currentOrder.totalPrice,
      );
    }

    // CANCELLED
    if (
      status === OrderStatus.CANCELLED &&
      oldStatus !== OrderStatus.CANCELLED
    ) {
      currentOrder.paymentStatus = PaymentStatus.REFUNDED;

      for (const item of currentOrder.items) {
        if (item.productId) {
          await this.productModel.findByIdAndUpdate(
            new Types.ObjectId(item.productId as any),
            {
              $inc: { stock: Number(item.quantity) },
            },
          );
        }
      }
    }

    await currentOrder.save();

    // ORDER COMPLETED EVENT
    if (
      status === OrderStatus.DELIVERED &&
      oldStatus !== OrderStatus.DELIVERED
    ) {
      this.eventEmitter.emit(
        'order.completed',
        new OrderCompletedEvent(
          currentOrder.user.toString(),
          currentOrder._id.toString(),
          currentOrder.totalPrice,
        ),
      );
    }

    return currentOrder;
  }

  // ============================================================
  // UPDATE PAYMENT STATUS
  // ============================================================

  async updatePaymentStatus(
    orderId: string,
    paymentStatus: PaymentStatus,
  ): Promise<OrderDocument> {
    const order = await this.orderModel.findByIdAndUpdate(
      new Types.ObjectId(orderId),
      { paymentStatus },
      { new: true },
    );

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    return order;
  }
}
