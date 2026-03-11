import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MaintenanceService } from './maintenance.service';
import { 
  CreateManualDto, 
  CreateMaintenanceScheduleDto, 
  CreateMaintenanceRecordDto,
  CreateWarrantyClaimDto,
  UpdateWarrantyClaimDto 
} from './dto/maintenance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Maintenance')
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post('manuals')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add manual to product (Seller)' })
  async addManual(@Request() req, @Body() dto: CreateManualDto) {
    return this.maintenanceService.addManual(req.user.id, dto);
  }

  @Get('manuals/:productId')
  @ApiOperation({ summary: 'Get manuals for a product' })
  async getManuals(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.maintenanceService.getManuals(productId);
  }

  @Delete('manuals/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a manual (Seller)' })
  async deleteManual(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.maintenanceService.deleteManual(req.user.id, id);
  }

  @Post('schedules')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create maintenance schedule (Seller)' })
  async createSchedule(@Request() req, @Body() dto: CreateMaintenanceScheduleDto) {
    return this.maintenanceService.createSchedule(req.user.id, dto);
  }

  @Get('schedules/:productId')
  @ApiOperation({ summary: 'Get maintenance schedules for a product' })
  async getSchedules(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.maintenanceService.getSchedules(productId);
  }

  @Delete('schedules/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a maintenance schedule (Seller)' })
  async deleteSchedule(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.maintenanceService.deleteSchedule(req.user.id, id);
  }

  @Post('records')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create maintenance record (Buyer/Seller)' })
  async createRecord(@Request() req, @Body() dto: CreateMaintenanceRecordDto) {
    return this.maintenanceService.createRecord(req.user.id, dto);
  }

  @Get('records/:productId')
  @ApiOperation({ summary: 'Get maintenance records for a product' })
  async getRecords(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.maintenanceService.getRecords(productId);
  }

  @Post('warranty')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit warranty claim (Buyer)' })
  async createWarrantyClaim(@Request() req, @Body() dto: CreateWarrantyClaimDto) {
    return this.maintenanceService.createWarrantyClaim(req.user.id, dto);
  }

  @Get('warranty/my-claims')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my warranty claims' })
  async getMyClaims(@Request() req) {
    return this.maintenanceService.getMyClaims(req.user.id);
  }

  @Get('warranty/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all warranty claims (Admin)' })
  async getAllClaims() {
    return this.maintenanceService.getAllClaims();
  }

  @Patch('warranty/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update warranty claim status (Admin)' })
  async updateClaimStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWarrantyClaimDto,
  ) {
    return this.maintenanceService.updateClaimStatus(id, dto);
  }

  @Get('warranty/status/:productId')
  @ApiOperation({ summary: 'Get warranty status for a product' })
  async getWarrantyStatus(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.maintenanceService.getWarrantyStatus(productId, orderId);
  }
}
