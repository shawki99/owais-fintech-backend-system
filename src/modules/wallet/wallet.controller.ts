import { Body, Controller, Get, Post, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { WalletService } from './wallet.service';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { AuthGuard } from '@nestjs/passport';

class AmountDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;
  @IsOptional()
  @IsString()
  referenceId?: string;
}

@UseGuards(AuthGuard('jwt'))
@Controller('wallet')
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Get()
  @UseInterceptors(CacheInterceptor)
  get(@Req() req: any) {
    return this.wallet.getWallet(req.user.userId);
  }

  @Get('transactions')
  getTx(@Req() req: any) {
    return this.wallet.getTransactions(req.user.userId);
  }

  @Post('deposit')
  deposit(@Req() req: any, @Body() dto: AmountDto) {
    return this.wallet.deposit(req.user.userId, dto.amount, dto.referenceId);
  }

  @Post('withdraw')
  withdraw(@Req() req: any, @Body() dto: AmountDto) {
    return this.wallet.withdraw(req.user.userId, dto.amount, dto.referenceId);
  }
}


