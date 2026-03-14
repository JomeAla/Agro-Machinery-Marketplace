import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  async createTicket(@Request() req, @Body() data: {
    category: string;
    subject: string;
    description: string;
    priority?: string;
  }) {
    return this.supportService.createTicket(req.user.id, data);
  }

  @Get('tickets')
  async getMyTickets(@Request() req, @Query() query: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    return this.supportService.getMyTickets(req.user.id, query);
  }

  @Get('tickets/:id')
  async getTicketById(@Request() req, @Param('id') id: string) {
    return this.supportService.getTicketById(id, req.user.id, req.user.role);
  }

  @Post('tickets/:id/replies')
  async addReply(@Request() req, @Param('id') id: string, @Body() data: { message: string }) {
    return this.supportService.addReply(id, req.user.id, req.user.role, data.message);
  }

  // Admin endpoints
  @Get('admin/tickets')
  @UseGuards(AdminGuard)
  async getAllTickets(@Query() query: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    category?: string;
    search?: string;
  }) {
    return this.supportService.getAllTickets(query);
  }

  @Get('admin/tickets/:id')
  @UseGuards(AdminGuard)
  async getAdminTicketById(@Request() req, @Param('id') id: string) {
    return this.supportService.getTicketById(id, req.user.id, 'ADMIN');
  }

  @Patch('admin/tickets/:id/status')
  @UseGuards(AdminGuard)
  async updateTicketStatus(@Param('id') id: string, @Body() data: { status: string }) {
    return this.supportService.updateTicketStatus(id, data.status);
  }

  @Patch('admin/tickets/:id/assign')
  @UseGuards(AdminGuard)
  async assignTicket(@Param('id') id: string, @Body() data: { assignedTo: string }) {
    return this.supportService.assignTicket(id, data.assignedTo);
  }

  @Post('admin/tickets/:id/replies')
  @UseGuards(AdminGuard)
  async adminAddReply(@Request() req, @Param('id') id: string, @Body() data: { message: string }) {
    return this.supportService.addReply(id, req.user.id, 'ADMIN', data.message);
  }

  @Get('admin/stats')
  @UseGuards(AdminGuard)
  async getTicketStats() {
    return this.supportService.getTicketStats();
  }
}
