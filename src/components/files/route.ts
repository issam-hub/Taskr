import type { Express } from "express";
import { authorize } from "../../utils/auth_utils.js";
import { fileUploadMiddleware } from "../../utils/multer.js";
import { FileController } from "./controller.js";

export class FileRoutes {
  private baseEndPoint = "/api/files";
  constructor(app: Express) {
    const controller = new FileController();
    app
      .route(this.baseEndPoint + "/task")
      .all(authorize)
      .post(fileUploadMiddleware, controller.addHandler("task"));

    app
      .route(this.baseEndPoint + "/comment")
      .all(authorize)
      .post(fileUploadMiddleware, controller.addHandler("comment"));

    app
      .route(this.baseEndPoint + "/:id")
      .all(authorize)
      .get(controller.getOneHandler)
      .put(fileUploadMiddleware, controller.updateHandler)
      .delete(controller.deleteHandler);

    app
      .route(this.baseEndPoint + "/task/:task_id")
      .all(authorize)
      .get(controller.getAllHandler("task"));

    app
      .route(this.baseEndPoint + "/comment/:comment_id")
      .all(authorize)
      .get(controller.getAllHandler("comment"));
  }
}
