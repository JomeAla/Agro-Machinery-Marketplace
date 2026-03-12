import { 
  Controller, 
  Get, 
  Patch, 
  Delete, 
  Post, 
  Body, 
  Param, 
  Query,
  UseGuards 
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
}
