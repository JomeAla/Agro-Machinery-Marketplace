import { 
  Controller, 
  Get, 
  Patch, 
  Delete, 
  Post, 
  Body, 
  Param, 
  Query,
  UseGuards,
  Res
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { 
  AdminUserQueryDto, 
  UpdateUserStatusDto,
  ProductModerationDto,
  OrderQueryDto,
  ResolveDisputeDto,
  ApproveProductDto,
  RejectProductDto,
} from './dto/admin.dto';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Response } from 'express';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ==================== Analytics ====================

  @Get('analytics')
  async getAnalytics() {
    return this.adminService.getAnalytics();
  }

  @Get('dashboard-stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // ==================== User Management ====================

  @Get('users')
  async getUsers(@Query() query: AdminUserQueryDto) {
    return this.adminService.getUsers(query);
  }

  @Get('users/:id')
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id/status')
  async updateUserStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(id, dto);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  // ==================== Product Moderation ====================

  @Get('products')
  async getProducts(@Query() query: ProductModerationDto) {
    return this.adminService.getProducts(query);
  }

  @Post('products/:id/approve')
  async approveProduct(@Param('id') id: string) {
    return this.adminService.approveProduct(id);
  }

  @Post('products/:id/reject')
  async rejectProduct(
    @Param('id') id: string,
    @Body() dto: RejectProductDto,
  ) {
    return this.adminService.rejectProduct(id, dto.reason);
  }

  @Post('products/:id/flag')
  async flagProduct(
    @Param('id') id: string,
    @Body() dto: RejectProductDto,
  ) {
    return this.adminService.flagProduct(id, dto.reason);
  }

  // ==================== Order Management ====================

  @Get('orders')
  async getOrders(@Query() query: OrderQueryDto) {
    return this.adminService.getOrders(query);
  }

  @Get('orders/:id')
  async getOrderById(@Param('id') id: string) {
    return this.adminService.getOrderById(id);
  }

  @Post('orders/:id/resolve-dispute')
  async resolveDispute(
    @Param('id') id: string,
    @Body() dto: ResolveDisputeDto,
  ) {
    return this.adminService.resolveDispute(id, dto);
  }

  // ==================== Transaction Management ====================

  @Get('transactions')
  async getTransactions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('provider') provider?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getTransactions({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      status,
      provider,
      search,
    });
  }

  @Get('transactions/:id')
  async getTransactionById(@Param('id') id: string) {
    return this.adminService.getTransactionById(id);
  }

  @Post('transactions/:id/refund')
  async processRefund(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.adminService.processRefund(id, reason);
  }

  @Get('refunds')
  async getRefundHistory(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getRefundHistory({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('transactions/export')
  async exportTransactions(@Res() res: Response) {
    const transactions = await this.adminService.getTransactions({ limit: 10000 });
    
    const csv = [
      ['ID', 'Order Number', 'Buyer', 'Amount', 'Provider', 'Status', 'Date'].join(','),
      ...transactions.data.map(t => [
        t.id,
        t.order?.orderNumber || '',
        t.order?.buyer?.firstName + ' ' + t.order?.buyer?.lastName || '',
        t.amount,
        t.provider,
        t.status,
        t.createdAt.toISOString(),
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
    res.send(csv);
  }
}
