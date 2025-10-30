import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Wallet } from './wallet.entity';

export type WalletTransactionType = 'deposit' | 'withdraw' | 'purchase' | 'earning';

@Entity('wallet_transactions')
export class WalletTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Wallet)
  wallet!: Wallet;

  @Column({ type: 'varchar' })
  type!: WalletTransactionType;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  amount!: string;

  @Column({ nullable: true })
  referenceId?: string;

  @CreateDateColumn()
  createdAt!: Date;
}


