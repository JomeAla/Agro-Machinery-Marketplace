import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MessagingService } from './messaging.service';
import { NotificationsService, NotificationType } from '../notifications/notifications.service';
import { CreateConversationDto, ConversationQueryDto, SendMessageDto } from './dto/messaging.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Messaging')
@Controller('conversations')
export class MessagingController {
  constructor(
    private readonly messagingService: MessagingService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start a new conversation' })
  async createConversation(@Request() req, @Body() dto: CreateConversationDto) {
    return this.messagingService.createConversation(req.user.id, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my conversations' })
  async getMyConversations(@Request() req, @Query() query: ConversationQueryDto) {
    return this.messagingService.getMyConversations(req.user.id, query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get conversation details' })
  async getConversation(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.messagingService.getConversation(id, req.user.id);
  }

  @Get(':id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get messages in a conversation' })
  async getMessages(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.messagingService.getMessages(id, req.user.id, page, limit);
  }

  @Post(':id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a message' })
  async sendMessage(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendMessageDto,
  ) {
    const message = await this.messagingService.sendMessage(id, req.user.id, dto);
    
    // Get conversation to find recipient
    const conversation = await this.messagingService.getConversation(id, req.user.id);
    const recipientId = conversation.buyerId === req.user.id ? conversation.sellerId : conversation.buyerId;
    const senderName = message.sender?.firstName || message.sender?.lastName || 'Someone';
    
    // Create notification for recipient
    await this.notificationsService.create({
      userId: recipientId,
      type: NotificationType.MESSAGE_RECEIVED,
      title: 'New Message',
      message: `You have a new message from ${senderName}`,
      data: { conversationId: id, senderId: req.user.id },
    });
    
    return message;
  }
}
