import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import * as qs from 'qs';

import {
  Order,
  OrderDocument,
  PaymentStatus,
} from '../orders/schemas/order.schema';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
  ) {}

  async createVnpayUrl(req: any, orderId: string): Promise<string> {
    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new BadRequestException('Order does not exist!');
    }

    // 1. CONFIG

    const tmnCode = process.env.VNP_TMNCODE?.trim();
    const secretKey = process.env.VNP_HASHSECRET?.trim();
    const vnpUrl = process.env.VNP_URL?.trim();
    const returnUrl = process.env.VNP_RETURNURL?.trim();

    if (!tmnCode || !secretKey || !vnpUrl || !returnUrl) {
      throw new BadRequestException(
        'Missing VNPay configuration in the .env file.',
      );
    }

    // 2. CLIENT IP

    let ipAddr =
      req.headers['x-forwarded-for'] ||
      req.socket?.remoteAddress ||
      '127.0.0.1';

    if (Array.isArray(ipAddr)) {
      ipAddr = ipAddr[0];
    }

    if (typeof ipAddr === 'string') {
      ipAddr = ipAddr.split(',')[0].trim();
    }

    // IPv6 localhost -> IPv4
    if (!ipAddr || ipAddr === '::1' || ipAddr.includes(':')) {
      ipAddr = '127.0.0.1';
    }

    // 3. CREATE DATE

    const createDate = this.formatDateGMT7(new Date());

    // 4. PARAMS

    let vnpParams: Record<string, any> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',

      vnp_TxnRef: orderId,

      vnp_OrderInfo: `Pay for the order. ${orderId}`,

      vnp_OrderType: 'other',

      // VNPay yêu cầu nhân 100
      vnp_Amount: Math.round(Number(order.totalPrice) * 100),

      vnp_ReturnUrl: returnUrl,

      vnp_IpAddr: ipAddr,

      vnp_CreateDate: createDate,
    };

    // 5. SORT

    vnpParams = this.sortObject(vnpParams);

    // 6. CREATE SIGNATURE

    const signData = qs.stringify(vnpParams, {
      encode: false,
    });

    const hmac = crypto.createHmac('sha512', secretKey);

    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    // 7. CREATE PAYMENT URL

    vnpParams['vnp_SecureHash'] = signed;

    const paymentUrl = `${vnpUrl}?${qs.stringify(vnpParams, {
      encode: false,
    })}`;

    console.log('========== VNPAY ==========');
    console.log('TMN CODE:', tmnCode);
    console.log('VNP URL:', vnpUrl);
    console.log('RETURN URL:', returnUrl);
    console.log('AMOUNT:', vnpParams.vnp_Amount);
    console.log('TXN REF:', orderId);
    console.log('PAYMENT URL:', paymentUrl);
    console.log('===========================');

    return paymentUrl;
  }

  // VNPay RETURN

  async handleVnpayReturn(query: any) {
    let vnpParams = { ...query };

    const secureHash = vnpParams['vnp_SecureHash'];

    delete vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHashType'];

    vnpParams = this.sortObject(vnpParams);

    const secretKey = process.env.VNP_HASHSECRET?.trim();

    if (!secretKey) {
      throw new BadRequestException('Missing VNP_HASHSECRET');
    }

    const signData = qs.stringify(vnpParams, {
      encode: false,
    });

    const hmac = crypto.createHmac('sha512', secretKey);

    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash !== signed) {
      throw new BadRequestException('Invalid signature!');
    }

    const orderId = vnpParams['vnp_TxnRef'];

    const responseCode = vnpParams['vnp_ResponseCode'];

    if (responseCode === '00') {
      await this.orderModel.findByIdAndUpdate(orderId, {
        paymentStatus: PaymentStatus.PAID,
      });

      return {
        status: 'success',
        message: 'VNPay payment successful!',
      };
    }

    await this.orderModel.findByIdAndUpdate(orderId, {
      paymentStatus: PaymentStatus.FAILED,
    });

    return {
      status: 'failed',
      message: 'VNPay payment failed!',
    };
  }

  // SORT OBJECT

  private sortObject(obj: Record<string, any>) {
    const sorted: Record<string, any> = {};

    const keys = Object.keys(obj).sort();

    for (const key of keys) {
      sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
    }

    return sorted;
  }

  // GMT +7

  private formatDateGMT7(date: Date): string {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(date);

    const p: Record<string, string> = {};

    parts.forEach(({ type, value }) => {
      p[type] = value;
    });

    return `${p.year}${p.month}${p.day}${p.hour}${p.minute}${p.second}`;
  }
}
