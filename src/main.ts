import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import * as dns from 'dns';
import cookieParser = require('cookie-parser');

dns.setServers(['8.8.8.8', '8.8.4.4']);

async function bootstrap() {
  // 1. Ép kiểu NestExpressApplication để sử dụng app.set()
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 2. BẮT BUỘC TRÊN RENDER: Nhận diện HTTPS từ Reverse Proxy để gửi Secure Cookie
  app.set('trust proxy', 1);

  app.use(cookieParser());

  // 3. Helmet: Nới lỏng cấu hình cross-origin
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // 4. Bật CORS cho Frontend Vercel
  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  });

  // 5. Chuẩn hóa Validation DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Server đang chạy tại http://localhost:${port}`);
}
bootstrap();
