import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';
import { WinstonModule } from 'nest-winston';
import { transports, format } from 'winston';
import { User } from './domain/user.entity';
import { Wallet } from './domain/wallet.entity';
import { WalletTransaction } from './domain/wallet-transaction.entity';
import { Product } from './domain/product.entity';
import { Order } from './domain/order.entity';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';

@Module({
  imports: [
    WinstonModule.forRoot({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      ),
      transports: [new transports.Console()],
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        entities: [User, Wallet, WalletTransaction, Product, Order],
        synchronize: true,
        logging: false,
      }),
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          host: process.env.REDIS_HOST || 'localhost',
          port: Number(process.env.REDIS_PORT || 6379),
          ttl: 10_000,
        }),
      }),
    }),
    TypeOrmModule.forFeature([User, Wallet, WalletTransaction, Product, Order]),
    AuthModule,
    UsersModule,
    WalletModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
  ],
})
export class AppModule {}


