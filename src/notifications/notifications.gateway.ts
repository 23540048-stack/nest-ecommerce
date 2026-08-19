import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3001', 'http://localhost:3000'],
    credentials: true,
  },
  transports: ['polling', 'websocket'],
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    console.log(`[WS] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[WS] Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(client: Socket, userId: string) {
    if (!userId) {
      return;
    }

    client.join(`user_${userId}`);

    console.log(`[WS] Client ${client.id} joined room: user_${userId}`);
  }

  sendRealtimeToast(
    userId: string,
    action: string,
    message: string,
    data?: any,
  ) {
    if (!userId) {
      return;
    }

    this.server.to(`user_${userId}`).emit('realtime_toast', {
      action,
      message,
      data,
      timestamp: new Date(),
    });
  }

  sendNotificationToAll(notification: {
    _id: string;
    title: string;
    message: string;
    type?: string;
    isRead?: boolean;
    link?: string;
    userId?: string | null;
    createdAt: Date;
  }) {
    this.server.emit('new_notification', {
      _id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type || 'info',
      isRead: notification.isRead ?? false,
      link: notification.link || '',
      userId: notification.userId ?? null,
      createdAt: notification.createdAt,
    });
  }
}
