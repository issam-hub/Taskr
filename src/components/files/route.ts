import type { Express } from "express";
import { authorize } from "../../utils/auth_utils.js";
import { fileUploadMiddleware } from "../../utils/multer.js";
import { FileController } from "./controller.js";

export class FileRoutes {
  private baseEndPoint = "/api/files";
  constructor(app: Express) {
    const controller = new FileController();
    app
      .route(this.baseEndPoint)
      .all(authorize)
      .post(fileUploadMiddleware, controller.addHandler);

    app
      .route(this.baseEndPoint + "/:id")
      .all(authorize)
      .get(controller.getOneHandler)
      .put(fileUploadMiddleware, controller.updateHandler)
      .delete(controller.deleteHandler);

    app
      .route(this.baseEndPoint + "/task/:task_id")
      .all(authorize)
      .get(controller.getAllHandler);
  }
}
