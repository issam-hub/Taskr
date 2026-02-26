import type { Express } from "express";
import { UserController } from "./controller.js";

export class UserRoutes {
  private basePoint = "/api/users";
  constructor(app: Express) {
    const controller = new UserController();

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
