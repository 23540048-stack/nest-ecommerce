import { Controller, Get, Patch, Delete, Param } from '@nestjs/common';

import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // ============================================================
  // GET ALL
  // ============================================================

  @Get()
  async getAll() {
    return this.notificationsService.findAll();
  }

  // ============================================================
  // MARK ONE AS READ
  // ============================================================

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  // ============================================================
  // MARK ALL AS READ
  // ============================================================

  @Patch('read-all')
  async markAllAsRead() {
    await this.notificationsService.markAllAsRead();

    return {
      success: true,
      message: 'All notifications marked as read.',
    };
  }

  // ============================================================
  // DELETE
  // ============================================================

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.notificationsService.remove(id);

    return {
      success: true,
      message: 'Notification deleted successfully.',
    };
  }
}
