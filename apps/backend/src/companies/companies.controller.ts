import { Controller, Get, Post, Patch, Body, UseGuards, Request, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto, UpdateCompanyDto, VerifyCompanyDto } from './dto/companies.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new company (Sellers only)' })
  async create(@Request() req, @Body() dto: CreateCompanyDto) {
    return this.companiesService.create(req.user.id, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user\'s company' })
  async getMyCompany(@Request() req) {
    return this.companiesService.getMyCompany(req.user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user\'s company' })
  async updateMyCompany(@Request() req, @Body() dto: UpdateCompanyDto) {
    const user = await this.companiesService['prisma'].user.findUnique({
      where: { id: req.user.id },
    });
    return this.companiesService.update(req.user.id, user.companyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all verified companies' })
  async findAll() {
    return this.companiesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get company by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.companiesService.findById(id);
  }

  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify a company (Admin only)' })
  async verifyCompany(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifyCompanyDto,
  ) {
    return this.companiesService.verifyCompany(id, dto.isVerified);
  }
}
