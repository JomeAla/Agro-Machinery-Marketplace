import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, UnauthorizedException } from '@nestjs/common';
import { WsJwtAuthGuard } from '../auth/guards/ws-jwt.guard';
import { MessagingService } from './messaging.service';
import { CreateMessageDto } from './dto/messaging.dto';
import { JwtService } from '@nestjs/jwt';
import { NotificationsService, NotificationType } from '../notifications/notifications.service';

@WebSocketGateway({
  cors: {
    origin: '*', // Adjust for production
  },
  namespace: 'messaging',
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  constructor(
    private readonly messagingService: MessagingService,
    private readonly jwtService: JwtService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      
      this.connectedUsers.set(userId, client.id);
      client.data.userId = userId;
      
      console.log(`User connected to messaging: ${userId}`);
    } catch (e) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.connectedUsers.delete(userId);
      console.log(`User disconnected from messaging: ${userId}`);
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: CreateMessageDto,
  ) {
    const senderId = client.data.userId;
    const message = await this.messagingService.createMessage(senderId, dto);

    // Get sender info for notification
    const senderName = message.sender?.firstName || message.sender?.lastName || 'Someone';

    // Emit to recipient if online
    const recipientSocketId = this.connectedUsers.get(dto.receiverId);
    if (recipientSocketId) {
      this.server.to(recipientSocketId).emit('newMessage', message);
    } else {
      // Recipient is offline - create notification
      await this.notificationsService.create({
        userId: dto.receiverId,
        type: NotificationType.MESSAGE_RECEIVED,
        title: 'New Message',
        message: `You have a new message from ${senderName}`,
        data: { conversationId: dto.conversationId, senderId },
      });
    }

    // Emit back to sender (confirming)
    client.emit('messageSent', message);
    
    return message;
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: string; isTyping: boolean },
  ) {
    const senderId = client.data.userId;
    const recipientSocketId = this.connectedUsers.get(data.receiverId);
    
    if (recipientSocketId) {
      this.server.to(recipientSocketId).emit('userTyping', {
        userId: senderId,
        isTyping: data.isTyping,
      });
    }
  }
}
