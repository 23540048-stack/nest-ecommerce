import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';

import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,

    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  // ============================================================
  // CREATE + SAVE DB + EMIT REALTIME
  // ============================================================

  async createAndEmit(data: {
    title: string;
    message: string;
    type?: 'info' | 'warning' | 'success' | 'error';
    link?: string;
    userId?: string | null;
  }): Promise<NotificationDocument> {
    const notification = new this.notificationModel({
      title: data.title,
      message: data.message,
      type: data.type || 'info',
      isRead: false,
      link: data.link || '',
      userId: data.userId ?? null,
    });

    const savedNotification = await notification.save();

    this.notificationsGateway.sendNotificationToAll({
      _id: savedNotification._id.toString(),
      title: savedNotification.title,
      message: savedNotification.message,
      type: savedNotification.type,
      isRead: savedNotification.isRead,
      link: savedNotification.link,
      userId: savedNotification.userId,
      createdAt: savedNotification.createdAt,
    });

    return savedNotification;
  }

  // ============================================================
  // GET NOTIFICATIONS
  // ============================================================

  async findAll(): Promise<NotificationDocument[]> {
    return this.notificationModel.find().sort({ createdAt: -1 }).exec();
  }

  // ============================================================
  // GET USER NOTIFICATIONS
  // ============================================================

  async findByUser(userId: string): Promise<NotificationDocument[]> {
    return this.notificationModel
      .find({
        $or: [{ userId }, { userId: null }],
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  // ============================================================
  // MARK ONE AS READ
  // ============================================================

  async markAsRead(id: string): Promise<NotificationDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Notification not found.');
    }

    const notification = await this.notificationModel.findByIdAndUpdate(
      id,
      {
        isRead: true,
      },
      {
        new: true,
      },
    );

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    return notification;
  }

  // ============================================================
  // MARK ALL AS READ
  // ============================================================

  async markAllAsRead(): Promise<void> {
    await this.notificationModel.updateMany(
      {
        isRead: false,
      },
      {
        $set: {
          isRead: true,
        },
      },
    );
  }

  // ============================================================
  // DELETE NOTIFICATION
  // ============================================================

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Notification not found.');
    }

    const result = await this.notificationModel.findByIdAndDelete(id);

    if (!result) {
      throw new NotFoundException('Notification not found.');
    }
  }
}
