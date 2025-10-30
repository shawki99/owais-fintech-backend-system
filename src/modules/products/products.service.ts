import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../domain/product.entity';
import { User } from '../../domain/user.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  create(merchantId: string, name: string, price: number, availableUnits: number) {
    return this.users.findOne({ where: { id: merchantId } }).then((merchant) => {
      const product = this.products.create({ merchant: merchant!, name, price: price.toFixed(2), availableUnits });
      return this.products.save(product);
    });
  }

  list() {
    return this.products
      .createQueryBuilder('p')
      .where('p.availableUnits > 0')
      .getMany();
  }
}


