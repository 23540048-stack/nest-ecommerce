import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { CouponsModule } from './coupons/coupons.module';
import { MembershipTiersModule } from './membership-tiers/membership-tiers.module';
import { ReportsModule } from './reports/reports.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DashboardModule } from './admin/dashboard/dashboard.module';
import { CategoriesModule } from './categories/categories.module';
import { BannersModule } from './marketing/banners/banners.module';
import { PromotionsModule } from './marketing/promotions/promotions.module';
import { FeaturedProductsModule } from './marketing/featured-products/featured-products.module';
import { CheckoutModule } from './check-out/check-out.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MembershipSettingsModule } from './membership-settings/membership-settings.module';
import { VouchersModule } from './vouchers/vouchers.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    ProductsModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    CartModule,
    OrdersModule,
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: {
          host: process.env.MAIL_HOST || 'smtp.gmail.com',
          port: Number(process.env.MAIL_PORT) || 587,
          secure: false,
          auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
          },
        },
        defaults: {
          from: process.env.MAIL_FROM,
        },
      }),
    }),
    CouponsModule,
    MembershipTiersModule,
    ReportsModule,
    ChatbotModule,
    NotificationsModule,
    DashboardModule,
    CategoriesModule,
    BannersModule,
    PromotionsModule,
    FeaturedProductsModule,
    CheckoutModule,
    WishlistModule,
    MembershipSettingsModule,
    EventEmitterModule.forRoot(),
    VouchersModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Áp dụng Rate Limit cho tất cả API
    },
  ],
})
export class AppModule {}
