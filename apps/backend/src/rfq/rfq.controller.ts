import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RfqService } from './rfq.service';
import { CreateRfqDto, UpdateRfqDto, CreateQuoteDto, RfqQueryDto } from './dto/rfq.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('RFQ')
@Controller('rfqs')
export class RfqController {
  constructor(private readonly rfqService: RfqService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new RFQ (Buyer only)' })
  async create(@Request() req, @Body() dto: CreateRfqDto) {
    return this.rfqService.create(req.user.id, dto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all RFQs with filters' })
  @ApiQuery({ name: 'status', required: false })
  async findAll(@Query() query: RfqQueryDto) {
    return this.rfqService.findAll(query);
  }

  @Get('open')
  @Public()
  @ApiOperation({ summary: 'Get open RFQs for sellers' })
  async getOpenRfqs(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.rfqService.getOpenRfqsForSellers(page, limit);
  }

  @Get('my-rfqs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my RFQs (Buyer only)' })
  async getMyRfqs(@Request() req, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.rfqService.getMyRfqs(req.user.id, page, limit);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get RFQ by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rfqService.findById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an RFQ (Owner only)' })
  async update(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRfqDto,
  ) {
    return this.rfqService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an RFQ (Owner only)' })
  async delete(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.rfqService.delete(req.user.id, id);
  }

  @Post('quotes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a quote (Seller only)' })
  async createQuote(@Request() req, @Body() dto: CreateQuoteDto) {
    return this.rfqService.createQuote(req.user.id, dto);
  }

  @Post('quotes/:quoteId/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept a quote (Buyer only)' })
  async acceptQuote(@Request() req, @Param('quoteId', ParseUUIDPipe) quoteId: string) {
    return this.rfqService.acceptQuote(req.user.id, quoteId);
  }
}
