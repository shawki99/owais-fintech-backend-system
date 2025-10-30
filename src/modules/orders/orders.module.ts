import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../../domain/order.entity';
import { Product } from '../../domain/product.entity';
import { User } from '../../domain/user.entity';
import { Wallet } from '../../domain/wallet.entity';
import { WalletTransaction } from '../../domain/wallet-transaction.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Product, User, Wallet, WalletTransaction]),
    PaymentsModule,
  ],
  providers: [OrdersService],
  controllers: [OrdersController],
})
export class OrdersModule {}


