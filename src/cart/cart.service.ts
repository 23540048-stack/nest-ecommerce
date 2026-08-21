import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Cart, CartDocument } from './schemas/cart.schema';

import { Product, ProductDocument } from '../products/schemas/product.schema';

import { AddToCartDto } from './dto/add-to-cart.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name)
    private readonly cartModel: Model<CartDocument>,

    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  // CALCULATE TOTAL

  private calculateTotalPrice(cart: CartDocument): number {
    return cart.items.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0,
    );
  }

  // GET CART

  async getCart(userId: string): Promise<CartDocument> {
    let cart = await this.cartModel
      .findOne({
        userId: new Types.ObjectId(userId),
      })
      .populate('items.productId');

    if (!cart) {
      cart = await this.cartModel.create({
        userId: new Types.ObjectId(userId),
        items: [],
        totalPrice: 0,
      });
    }

    return cart;
  }

  // ADD TO CART

  async addToCart(
    userId: string,
    addToCartDto: AddToCartDto,
  ): Promise<CartDocument> {
    const { productId, quantity, size } = addToCartDto;

    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0.');
    }

    const product = await this.productModel.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    // Check stock
    if (product.stock < quantity) {
      throw new BadRequestException(
        `Only ${product.stock} item(s) available in stock.`,
      );
    }

    let cart = await this.cartModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!cart) {
      cart = new this.cartModel({
        userId: new Types.ObjectId(userId),
        items: [],
        totalPrice: 0,
      });
    }

    // FIND EXISTING ITEM

    const itemIndex = cart.items.findIndex((item: any) => {
      const currentProductId = item.productId?._id
        ? item.productId._id.toString()
        : item.productId.toString();

      return (
        currentProductId === productId.toString() &&
        (item.size === size || (!item.size && !size))
      );
    });

    // ITEM ALREADY EXISTS

    if (itemIndex > -1) {
      const newQuantity =
        Number(cart.items[itemIndex].quantity) + Number(quantity);

      if (newQuantity > product.stock) {
        throw new BadRequestException(
          `Only ${product.stock} item(s) available in stock.`,
        );
      }

      cart.items[itemIndex].quantity = newQuantity;

      cart.items[itemIndex].price = Number(product.price);
    }

    // NEW ITEM
    else {
      const newItem: any = {
        productId: new Types.ObjectId(productId),
        quantity: Number(quantity),
        price: Number(product.price),
      };

      if (size) {
        newItem.size = size;
      }

      cart.items.push(newItem);
    }

    cart.markModified('items');

    cart.totalPrice = this.calculateTotalPrice(cart);

    const savedCart = await cart.save();

    return savedCart.populate('items.productId');
  }

  // UPDATE CART ITEM QUANTITY

  async updateQuantity(
    userId: string,
    itemId: string,
    quantity: number,
  ): Promise<CartDocument> {
    if (!Types.ObjectId.isValid(itemId)) {
      throw new BadRequestException('Invalid cart item ID.');
    }

    if (quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1.');
    }

    // Find cart

    const cart = await this.cartModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!cart) {
      throw new NotFoundException('Cart not found.');
    }

    // Find cart item by ITEM _id

    const itemIndex = cart.items.findIndex(
      (item: any) => item._id?.toString() === itemId,
    );

    if (itemIndex === -1) {
      throw new NotFoundException('Cart item not found.');
    }

    const item = cart.items[itemIndex];

    // Check product stock

    const product = await this.productModel.findById(item.productId);

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    if (quantity > product.stock) {
      throw new BadRequestException(
        `Only ${product.stock} item(s) available in stock.`,
      );
    }

    // Update quantity

    cart.items[itemIndex].quantity = Number(quantity);

    // Keep latest product price
    cart.items[itemIndex].price = Number(product.price);

    cart.markModified('items');

    // Recalculate total

    cart.totalPrice = this.calculateTotalPrice(cart);

    // Save

    const savedCart = await cart.save();

    return savedCart.populate('items.productId');
  }

  // REMOVE CART ITEM

  async removeFromCart(userId: string, itemId: string): Promise<CartDocument> {
    if (!Types.ObjectId.isValid(itemId)) {
      throw new BadRequestException('Invalid cart item ID.');
    }

    const cart = await this.cartModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!cart) {
      throw new NotFoundException('Cart not found.');
    }

    const originalLength = cart.items.length;

    cart.items = cart.items.filter(
      (item: any) => item._id?.toString() !== itemId,
    );

    if (cart.items.length === originalLength) {
      throw new NotFoundException('Cart item not found.');
    }

    cart.markModified('items');

    cart.totalPrice = this.calculateTotalPrice(cart);

    const savedCart = await cart.save();

    return savedCart.populate('items.productId');
  }

  // CLEAR CART

  async clearCart(userId: string): Promise<CartDocument> {
    const cart = await this.cartModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!cart) {
      throw new NotFoundException('Cart not found.');
    }

    cart.items = [];
    cart.totalPrice = 0;

    cart.markModified('items');

    return cart.save();
  }

  async addBulk(
    userId: string,
    items: Array<{
      productId: string;
      quantity: number;
      size?: string;
      color?: string;
    }>,
  ) {
    for (const item of items) {
      await this.addToCart(userId, item);
    }
    return { message: 'Items added to cart successfully' };
  }
}
