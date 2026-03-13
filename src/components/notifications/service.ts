import type { Repository } from "typeorm";
import { BaseService, type ApiResponse } from "../../utils/base_service.js";
import { ConnectDatabase } from "../../utils/db_utils.js";
import { Notifications } from "./entity.js";

export class NotificationService extends BaseService<Notifications> {
  private notificationsRepo: Repository<Notifications> | null = null;

  constructor() {
    const dbInstance = new ConnectDatabase();
    let notificationsRepo: Repository<Notifications> = dbInstance.getRepo(
      Notifications,
    ) as Repository<Notifications>;

    super(notificationsRepo);
    this.notificationsRepo = notificationsRepo;
  }

  async getAll(userId: string): Promise<ApiResponse<Notifications[]>> {
    if (this.notificationsRepo) {
      const data = await this.notificationsRepo.find({
        where: { user_id: userId },
        order: { created_at: "DESC" },
      });
      return { statusCode: 200, status: "success", data };
    }
    return {
      statusCode: 500,
      status: "error",
      message: "Database not connected",
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    if (this.notificationsRepo) {
      return await this.notificationsRepo.count({
        where: { user_id: userId, is_read: false },
      });
    }
    return 0;
  }

  async markAsRead(notificationId: string, userId: string) {
    if (this.notificationsRepo) {
      const notification = await this.notificationsRepo.findOne({
        where: { notification_id: notificationId, user_id: userId },
      });
      if (notification) {
        notification.is_read = true;
        return await this.notificationsRepo.save(notification);
      }
    }
    return null;
  }

  async markAllAsRead(userId: string) {
    if (this.notificationsRepo) {
      await this.notificationsRepo.update(
        { user_id: userId, is_read: false },
        { is_read: true },
      );
      return true;
    }
    return false;
  }
}
