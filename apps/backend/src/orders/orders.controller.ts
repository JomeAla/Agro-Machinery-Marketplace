import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request, ParseUUIDPipe, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, OrderQueryDto } from './dto/orders.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new order' })
  async create(@Request() req, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(req.user.id, dto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all orders with filters (Admin)' })
  @ApiQuery({ name: 'status', required: false })
  async findAll(@Query() query: OrderQueryDto) {
    return this.ordersService.findAll(query);
  }

  @Get('my-orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my orders (Buyer)' })
  async getMyOrders(@Request() req, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.ordersService.getMyOrders(req.user.id, page, limit);
  }

  @Get('seller-orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get seller orders (Seller)' })
  async getSellerOrders(@Request() req, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.ordersService.getSellerOrders(req.user.id, page, limit);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get order by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findById(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order status' })
  async updateStatus(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, req.user.id, dto);
  }

  @Patch(':id/freight')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Calculate freight cost (Seller)' })
  async calculateFreight(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('freightCost') freightCost: number,
  ) {
    return this.ordersService.calculateFreight(id, req.user.id, freightCost);
  }
}
