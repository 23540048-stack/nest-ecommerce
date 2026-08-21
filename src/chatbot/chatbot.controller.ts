import { Controller, Post, Body } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  // POST /chatbot/message

  @Post('message')
  async chat(@Body('message') message: string) {
    return this.chatbotService.handleUserMessage(message);
  }
}
