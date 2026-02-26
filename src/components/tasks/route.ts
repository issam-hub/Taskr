import type { Express } from "express";
import { TaskController } from "./controller.js";

export class TaskRoutes {
  private basePoint = "/api/tasks";
  constructor(app: Express) {
    const controller = new TaskController();

    app
      .route(this.basePoint)
      .post(controller.addHandler)
      .get(controller.getAllHandler);

    app
      .route(this.basePoint + "/:id")
      .delete(controller.deleteHandler)
      .patch(controller.updateHandler)
      .get(controller.getOneHandler);
  }
}
