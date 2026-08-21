import { BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import * as dotenv from 'dotenv';

dotenv.config();
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cấu hình tài khoản Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cấu hình lưu trữ trên Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req: any, file: any) => {
    return {
      folder: 'nest-ecommerce',
      resource_type: 'auto',
      public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
    };
  },
});

export const multerOptions = {
  storage: storage,
  fileFilter: (req: any, file: any, callback: any) => {
    if (
      !file.originalname.match(
        /\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|mkv|webm)$/i,
      )
    ) {
      return callback(
        new BadRequestException('Only image or video files are accepted!'),
        false,
      );
    }
    callback(null, true);
  },
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
};
