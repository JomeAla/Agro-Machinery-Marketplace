import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FaqService } from './faq.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('FAQ')
@Controller('faq')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  // ==================== Public Routes ====================

  @Get('categories')
  @ApiOperation({ summary: 'Get all FAQ categories' })
  async getCategories() {
    return this.faqService.getCategories();
  }

  @Get('articles')
  @ApiOperation({ summary: 'Get published FAQ articles' })
  async getPublishedArticles() {
    return this.faqService.getPublishedArticles();
  }

  @Get('articles/search')
  @ApiOperation({ summary: 'Search FAQ articles' })
  async searchArticles(@Query('q') search: string) {
    return this.faqService.getArticles({ search, published: true });
  }

  @Get('articles/:id')
  @ApiOperation({ summary: 'Get FAQ article by ID' })
  async getArticle(@Param('id') id: string) {
    return this.faqService.getArticleById(id);
  }

  @Post('articles/:id/vote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vote on FAQ article' })
  async voteArticle(
    @Param('id') id: string,
    @Body('helpful') helpful: boolean,
    @Req() req: any,
  ) {
    return this.faqService.voteArticle(id, req.user.id, helpful);
  }

  @Get('articles/:id/vote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user vote for article' })
  async getUserVote(@Param('id') id: string, @Req() req: any) {
    const vote = await this.faqService.getUserVote(id, req.user.id);
    return { helpful: vote?.helpful };
  }

  // ==================== Admin Routes ====================

  @Get('admin/categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all categories (Admin)' })
  async getAdminCategories() {
    return this.faqService.getCategories();
  }

  @Post('admin/categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create category (Admin)' })
  async createCategory(@Body() data: { name: string; slug: string; description?: string; order?: number }) {
    return this.faqService.createCategory(data);
  }

  @Patch('admin/categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update category (Admin)' })
  async updateCategory(@Param('id') id: string, @Body() data: { name?: string; slug?: string; description?: string; order?: number }) {
    return this.faqService.updateCategory(id, data);
  }

  @Delete('admin/categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete category (Admin)' })
  async deleteCategory(@Param('id') id: string) {
    return this.faqService.deleteCategory(id);
  }

  @Get('admin/articles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all articles (Admin)' })
  async getAdminArticles(
    @Query('categoryId') categoryId?: string,
    @Query('published') published?: string,
  ) {
    return this.faqService.getArticles({
      categoryId,
      published: published === 'true' ? true : published === 'false' ? false : undefined,
    });
  }

  @Post('admin/articles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create article (Admin)' })
  async createArticle(@Body() data: {
    title: string;
    slug: string;
    content: string;
    categoryId: string;
    order?: number;
    published?: boolean;
  }) {
    return this.faqService.createArticle(data);
  }

  @Patch('admin/articles/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update article (Admin)' })
  async updateArticle(@Param('id') id: string, @Body() data: {
    title?: string;
    slug?: string;
    content?: string;
    categoryId?: string;
    order?: number;
    published?: boolean;
  }) {
    return this.faqService.updateArticle(id, data);
  }

  @Delete('admin/articles/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete article (Admin)' })
  async deleteArticle(@Param('id') id: string) {
    return this.faqService.deleteArticle(id);
  }
}
