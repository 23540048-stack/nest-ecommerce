import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import OpenAI from 'openai';
import { Product, ProductDocument } from '../products/schemas/product.schema';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    private configService: ConfigService,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async handleUserMessage(message: string) {
    try {
      const apiKey = this.configService.get<string>('GROQ_API_KEY');
      if (!apiKey) {
        throw new Error('Thiếu GROQ_API_KEY trong file .env');
      }

      const groq = new OpenAI({
        apiKey,
        baseURL: 'https://api.groq.com/openai/v1',
      });

      // 1. Trích xuất dữ liệu sản phẩm từ MongoDB
      const products = await this.productModel
        .find()
        .limit(20)
        .select('name price category description stock');

      const productContext =
        products.length > 0
          ? products
              .map(
                (p) =>
                  `- ${p.name}:Giá ${p.price.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  })}. Mô tả: ${p.description || 'Không có'}`,
              )
              .join('\n')
          : 'Hiện chưa có sản phẩm nào trong cửa hàng.';

      // 2. Kịch bản tư vấn nhập vai Naruto Làng Lá
      const systemPrompt = `
Bạn là Naruto - Trợ lý AI tư vấn bán hàng siêu nhiệt huyết và chuyên nghiệp!
Hãy trả lời khách hàng bằng tiếng Việt thân thiện, lịch sự và tràn đầy năng lượng (kèm emoji phù hợp 🍃🍥).

Dưới đây là danh sách sản phẩm hiện có trong CSDL cửa hàng:
${productContext}

Quy tắc phản hồi:
1. Nhập vai Naruto thân thiện, luôn giữ không khí vui vẻ của Làng Lá.
2. Chỉ tư vấn và báo giá các sản phẩm nằm trong danh sách trên. 
3. Nếu khách hỏi sản phẩm không có trong danh sách, hãy báo nhẹ nhàng là các ninja chưa mang mặt hàng này về Làng.
4. Trả lời ngắn gọn dưới 120 từ.
`;

      // 3. Gửi yêu cầu tới Groq API
      const completion = await groq.chat.completions.create({
        model: 'openai/gpt-oss-20b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        temperature: 0.6,
      });

      return {
        reply:
          completion.choices[0]?.message?.content ||
          'Không nhận được phản hồi từ AI.',
      };
    } catch (error: any) {
      this.logger.error('LỖI GROQ API CHI TIẾT:', error?.message || error);

      throw new InternalServerErrorException(
        `Lỗi AI Service: ${error?.message || 'Không thể kết nối đến trợ lý AI'}`,
      );
    }
  }
}
