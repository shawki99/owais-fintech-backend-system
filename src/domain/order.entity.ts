import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { Product } from './product.entity';

export type PaymentMethod = 'wallet' | 'gateway';
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User)
  buyer!: User;

  @ManyToOne(() => Product)
  product!: Product;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  amount!: string;

  @Column({ type: 'varchar' })
  paymentMethod!: PaymentMethod;

  @Column({ type: 'varchar', default: 'pending' })
  status!: OrderStatus;

  @Column({ nullable: true })
  gatewaySessionId?: string;

  @Column({ nullable: true })
  gatewayPaymentId?: string;

  @CreateDateColumn()
  createdAt!: Date;
}


