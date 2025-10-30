import { Body, Controller, Get, Post, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { ProductsService } from './products.service';
import { IsInt, IsNumber, IsString, Min } from 'class-validator';
import { AuthGuard } from '@nestjs/passport';
import { Roles, RolesGuard } from '../../common/roles.guard';
import { UseGuards as UseGuards2 } from '@nestjs/common';

class CreateProductDto {
  @IsString()
  name!: string;
  @IsNumber()
  @Min(0.01)
  price!: number;
  @IsInt()
  @Min(0)
  availableUnits!: number;
}

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @UseInterceptors(CacheInterceptor)
  list() {
    return this.products.list();
  }

  @UseGuards(AuthGuard('jwt'))
  @UseGuards2(RolesGuard)
  @Roles('merchant')
  @Post()
  create(@Req() req: any, @Body() dto: CreateProductDto) {
    return this.products.create(req.user.userId, dto.name, dto.price, dto.availableUnits);
  }
}


