import { Router } from "express";
import type { Express } from "express";
import { NotificationController } from "./controller.js";
import { authorize } from "../../utils/auth_utils.js";

export class NotificationRoutes {
  private basePoint = "/api/notifications";

  constructor(app: Express) {
    const controller = new NotificationController();

    app.route(this.basePoint).all(authorize).get(controller.getMyNotifications);
    app.route(this.basePoint + "/mark-all-read").put(controller.markAllAsRead);
    app.route(this.basePoint + "/:id/read").put(controller.markAsRead);
    app
      .route(this.basePoint + "/:id")
      .all(authorize)
      .delete(controller.deleteNotification);
  }
}
