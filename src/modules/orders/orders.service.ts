import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Order } from '../../domain/order.entity';
import { Product } from '../../domain/product.entity';
import { User } from '../../domain/user.entity';
import { Wallet } from '../../domain/wallet.entity';
import { WalletTransaction } from '../../domain/wallet-transaction.entity';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Wallet) private readonly wallets: Repository<Wallet>,
    @InjectRepository(WalletTransaction) private readonly txs: Repository<WalletTransaction>,
    private readonly payments: PaymentsService,
  ) {}

  async createOrder(buyerId: string, productId: string, paymentMethod: 'wallet' | 'gateway') {
    if (!['wallet', 'gateway'].includes(paymentMethod)) throw new BadRequestException('Invalid payment method');
    if (!productId) throw new BadRequestException('productId is required');

    if (paymentMethod === 'wallet') {
      return this.walletPurchase(buyerId, productId);
    }
    return this.gatewayPurchase(buyerId, productId);
  }

  private async walletPurchase(buyerId: string, productId: string) {
    return this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(Product, { where: { id: productId }, relations: ['merchant'] });
      if (!product) throw new NotFoundException('Product not found');
      if (product.availableUnits <= 0) throw new BadRequestException('Out of stock');

      // Lock product row
      const lockedProduct = await manager.findOne(Product, { where: { id: product.id }, lock: { mode: 'pessimistic_write' } });
      if (lockedProduct!.availableUnits <= 0) throw new BadRequestException('Out of stock');

      const buyer = await manager.findOne(User, { where: { id: buyerId }, relations: ['wallet'] });
      const merchant = await manager.findOne(User, { where: { id: product.merchant.id }, relations: ['wallet'] });
      if (!buyer?.wallet || !merchant?.wallet) throw new NotFoundException('Wallet missing');

      // Lock wallets
      const buyerWallet = await manager.findOne(Wallet, { where: { id: buyer.wallet.id }, lock: { mode: 'pessimistic_write' } });
      const merchantWallet = await manager.findOne(Wallet, { where: { id: merchant.wallet.id }, lock: { mode: 'pessimistic_write' } });

      const price = parseFloat(product.price);
      const buyerBalance = parseFloat(buyerWallet!.balance);
      if (buyerBalance < price) throw new BadRequestException('Insufficient funds');

      buyerWallet!.balance = (buyerBalance - price).toFixed(2);
      merchantWallet!.balance = (parseFloat(merchantWallet!.balance) + price).toFixed(2);
      lockedProduct!.availableUnits -= 1;
      await manager.save([buyerWallet!, merchantWallet!, lockedProduct!]);

      const order = manager.create(Order, {
        buyer: buyer!,
        product: product!,
        amount: price.toFixed(2),
        paymentMethod: 'wallet',
        status: 'paid',
      });
      await manager.save(order);

      await manager.save(
        manager.create(WalletTransaction, { wallet: buyerWallet!, type: 'purchase', amount: price.toFixed(2), referenceId: order.id })
      );
      await manager.save(
        manager.create(WalletTransaction, { wallet: merchantWallet!, type: 'earning', amount: price.toFixed(2), referenceId: order.id })
      );

      return { orderId: order.id, status: order.status };
    });
  }

  private async gatewayPurchase(buyerId: string, productId: string) {
    const order = await this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(Product, { where: { id: productId }, lock: { mode: 'pessimistic_write' } });
      if (!product) throw new NotFoundException('Product not found');
      if (product.availableUnits <= 0) throw new BadRequestException('Out of stock');
      // Reserve a unit by decrementing immediately to avoid oversell; restored if payment fails via timeout job (not implemented here)
      product.availableUnits -= 1;
      await manager.save(product);
      const buyer = await manager.findOne(User, { where: { id: buyerId } });
      const o = manager.create(Order, {
        buyer: buyer!,
        product: product!,
        amount: parseFloat(product.price).toFixed(2),
        paymentMethod: 'gateway',
        status: 'pending',
      });
      return manager.save(o);
    });

    const session = await this.payments.createPaymentSession(order.id);
    order.gatewaySessionId = (session as any).id;
    await this.orders.save(order);
    return { orderId: order.id, status: order.status, sessionId: order.gatewaySessionId };
  }
}


