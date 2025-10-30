import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { IsIn, IsString } from 'class-validator';
import { AuthGuard } from '@nestjs/passport';

class CreateOrderDto {
  @IsString()
  productId!: string;
  @IsIn(['wallet', 'gateway'])
  paymentMethod!: 'wallet' | 'gateway';
}

@UseGuards(AuthGuard('jwt'))
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateOrderDto) {
    return this.orders.createOrder(req.user.userId, dto.productId, dto.paymentMethod);
  }
}


