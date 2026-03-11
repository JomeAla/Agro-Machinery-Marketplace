import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FinancingService } from './financing.service';
import { CreateFinancingRequestDto, UpdateFinancingStatusDto, FinancingQueryDto, CalculateInstallmentDto } from './dto/financing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Financing')
@Controller('financing')
export class FinancingController {
  constructor(private readonly financingService: FinancingService) {}

  @Post('request')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a financing request' })
  async create(@Request() req, @Body() dto: CreateFinancingRequestDto) {
    return this.financingService.create(req.user.id, dto);
  }

  @Post('calculate')
  @Public()
  @ApiOperation({ summary: 'Calculate installment preview' })
  async calculate(@Body() dto: CalculateInstallmentDto) {
    return this.financingService.calculateInstallment(dto);
  }

  @Get('providers')
  @Public()
  @ApiOperation({ summary: 'Get financing providers' })
  async getProviders() {
    return this.financingService.getProviders();
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all financing requests (Admin)' })
  @ApiQuery({ name: 'status', required: false })
  async findAll(@Query() query: FinancingQueryDto) {
    return this.financingService.findAll(query);
  }

  @Get('my-requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my financing requests' })
  async getMyRequests(@Request() req, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.financingService.getMyRequests(req.user.id, page, limit);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get financing request by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.financingService.findById(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update financing request status (Admin)' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFinancingStatusDto,
  ) {
    return this.financingService.updateStatus(id, dto);
  }
}
