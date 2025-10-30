import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../../domain/order.entity';
import { User } from '../../domain/user.entity';
import { Wallet } from '../../domain/wallet.entity';
import { WalletTransaction } from '../../domain/wallet-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, User, Wallet, WalletTransaction])],
  providers: [PaymentsService],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}


