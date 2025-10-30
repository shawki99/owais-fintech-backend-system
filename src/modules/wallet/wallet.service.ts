import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Wallet } from '../../domain/wallet.entity';
import { WalletTransaction, WalletTransactionType } from '../../domain/wallet-transaction.entity';
import { User } from '../../domain/user.entity';

@Injectable()
export class WalletService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Wallet) private readonly wallets: Repository<Wallet>,
    @InjectRepository(WalletTransaction) private readonly txs: Repository<WalletTransaction>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async getWallet(userId: string) {
    const user = await this.users.findOne({ where: { id: userId }, relations: ['wallet'] });
    if (!user || !user.wallet) throw new NotFoundException();
    return { balance: user.wallet.balance };
  }

  async getTransactions(userId: string) {
    const user = await this.users.findOne({ where: { id: userId }, relations: ['wallet'] });
    if (!user || !user.wallet) throw new NotFoundException();
    return this.txs.find({ where: { wallet: { id: user.wallet.id } }, order: { createdAt: 'DESC' } });
  }

  async deposit(userId: string, amount: number, referenceId?: string) {
    if (amount <= 0) throw new BadRequestException('Invalid amount');
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, { where: { id: userId }, relations: ['wallet'] });
      if (!user || !user.wallet) throw new NotFoundException();
      const wallet = await manager.findOne(Wallet, { where: { id: user.wallet.id }, lock: { mode: 'pessimistic_write' } });
      const newBalance = (parseFloat(wallet!.balance) + amount).toFixed(2);
      wallet!.balance = newBalance;
      await manager.save(wallet!);
      const tx = manager.create(WalletTransaction, { wallet: wallet!, type: 'deposit' as WalletTransactionType, amount: amount.toFixed(2), referenceId });
      await manager.save(tx);
      return { balance: wallet!.balance };
    });
  }

  async withdraw(userId: string, amount: number, referenceId?: string) {
    if (amount <= 0) throw new BadRequestException('Invalid amount');
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, { where: { id: userId }, relations: ['wallet'] });
      if (!user || !user.wallet) throw new NotFoundException();
      const wallet = await manager.findOne(Wallet, { where: { id: user.wallet.id }, lock: { mode: 'pessimistic_write' } });
      const current = parseFloat(wallet!.balance);
      if (current < amount) throw new BadRequestException('Insufficient funds');
      const newBalance = (current - amount).toFixed(2);
      wallet!.balance = newBalance;
      await manager.save(wallet!);
      const tx = manager.create(WalletTransaction, { wallet: wallet!, type: 'withdraw' as WalletTransactionType, amount: amount.toFixed(2), referenceId });
      await manager.save(tx);
      return { balance: wallet!.balance };
    });
  }
}


