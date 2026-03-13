import type { Request, Response } from "express";
import { NotificationService } from "./service.js";

export class NotificationController {
  private service: NotificationService;

  constructor() {
    this.service = new NotificationService();
  }

  public getMyNotifications = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.user_id;
      const notifications = await this.service.getAll(userId as string);
      const unreadCount = await this.service.getUnreadCount(userId as string);

      return res.status(200).json({
        data: notifications,
        unread_count: unreadCount,
      });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };

  public markAsRead = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.user_id;

      const notification = await this.service.markAsRead(
        id as string,
        userId as string,
      );
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      return res
        .status(200)
        .json({ message: "Notification marked as read", data: notification });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };

  public markAllAsRead = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.user_id;
      await this.service.markAllAsRead(userId as string);
      return res.status(200).json({
        statusCode: 200,
        status: "success",
        message: "All notifications marked as read",
      });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({
        statusCode: "500",
        status: "error",
        message: "Internal Server Error",
      });
    }
  };

  public async deleteNotification(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await this.service.delete(id as string);
      return res.status(result.statusCode as number).json(result);
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({
        statusCode: "500",
        status: "error",
        message: "Internal Server Error",
      });
    }
  }
}
