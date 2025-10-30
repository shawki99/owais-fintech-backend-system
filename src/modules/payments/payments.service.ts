import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from '../../domain/order.entity';
import { Wallet } from '../../domain/wallet.entity';
import { User } from '../../domain/user.entity';
import { WalletTransaction } from '../../domain/wallet-transaction.entity';

@Injectable()
export class PaymentsService {
  private stripe?: Stripe;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Wallet) private readonly wallets: Repository<Wallet>,
    @InjectRepository(WalletTransaction) private readonly txs: Repository<WalletTransaction>,
  ) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (key) this.stripe = new Stripe(key, { apiVersion: '2024-06-20' } as any);
  }

  async createPaymentSession(orderId: string) {
    if (!this.stripe) {
      // Fallback mock
      return { id: `mock_sess_${orderId}` };
    }
    const order = await this.orders.findOne({ where: { id: orderId }, relations: ['product'] });
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(parseFloat(order!.amount) * 100),
            product_data: { name: order!.product.name },
          },
          quantity: 1,
        },
      ],
      metadata: { orderId },
    });
    return session;
  }

  async handleStripeWebhook(event: Stripe.Event) {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId as string;
      await this.markOrderPaid(orderId, session.id);
    }
  }

  async markOrderPaid(orderId: string, paymentId: string) {
    await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, { where: { id: orderId }, relations: ['product', 'product.merchant'] });
      if (!order || order.status !== 'pending') return;
      order.status = 'paid';
      order.gatewayPaymentId = paymentId;
      await manager.save(order);

      // Credit merchant wallet
      const merchant = await manager.findOne(User, { where: { id: order.product.merchant.id }, relations: ['wallet'] });
      const wallet = await manager.findOne(Wallet, { where: { id: merchant!.wallet!.id }, lock: { mode: 'pessimistic_write' } });
      wallet!.balance = (parseFloat(wallet!.balance) + parseFloat(order.amount)).toFixed(2);
      await manager.save(wallet!);
      const tx = manager.create(WalletTransaction, { wallet: wallet!, type: 'earning', amount: order.amount, referenceId: order.id });
      await manager.save(tx);
    });
  }
}


