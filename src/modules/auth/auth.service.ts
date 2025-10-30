import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../domain/user.entity';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Wallet } from '../../domain/wallet.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Wallet) private readonly wallets: Repository<Wallet>,
    private readonly jwt: JwtService,
  ) {}

  async signup(email: string, password: string, role: UserRole) {
    const existing = await this.users.findOne({ where: { email } });
    if (existing) throw new ConflictException('Email already registered');
    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.users.create({ email, passwordHash, role });
    await this.users.save(user);
    const wallet = this.wallets.create({ owner: user, balance: '0' });
    await this.wallets.save(wallet);
    const token = await this.signToken(user);
    return { accessToken: token };
  }

  async login(email: string, password: string) {
    const user = await this.users.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    const token = await this.signToken(user);
    return { accessToken: token };
  }

  private async signToken(user: User) {
    return this.jwt.signAsync({ sub: user.id, role: user.role, email: user.email });
  }
}


