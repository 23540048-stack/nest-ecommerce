import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';

import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { ClientAuthGuard } from '../auth/guards/client-auth.guard';

@UseGuards(ClientAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // GET CART

  @Get()
  getCart(@Req() req: any) {
    return this.cartService.getCart(req.user.userId);
  }

  // ADD TO CART

  @Post('add')
  addToCart(@Req() req: any, @Body() addToCartDto: AddToCartDto) {
    return this.cartService.addToCart(req.user.userId, addToCartDto);
  }

  // PATCH /cart/items/:itemId

  @Patch('items/:itemId')
  updateQuantity(
    @Req() req: any,
    @Param('itemId') itemId: string,
    @Body('quantity') quantity: number,
  ) {
    return this.cartService.updateQuantity(
      req.user.userId,
      itemId,
      Number(quantity),
    );
  }

  // REMOVE ONE ITEM

  @Delete('items/:itemId')
  removeFromCart(@Req() req: any, @Param('itemId') itemId: string) {
    return this.cartService.removeFromCart(req.user.userId, itemId);
  }

  // CLEAR CART

  @Delete('clear')
  clearCart(@Req() req: any) {
    return this.cartService.clearCart(req.user.userId);
  }

  @Post('add-bulk')
  async addBulkToCart(
    @Req() req: any,
    @Body()
    body: {
      items: Array<{
        productId: string;
        quantity: number;
        size?: string;
        color?: string;
      }>;
    },
  ) {
    return this.cartService.addBulk(req.user.userId, body.items);
  }
}
