import type { Express } from "express";
import { authorize } from "../../utils/auth_utils.js";
import { CommentController } from "./controller.js";
import { body } from "express-validator";
import { validate } from "../../utils/validator.js";

const validCommentInput = [
  body("comment").trim().notEmpty().withMessage("comment is required"),
  body("task_id").trim().notEmpty().withMessage("task ID is required"),
  body("user_id")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("user ID must not be empty if provided"),
];

const validCommentInputPatch = [
  body("comment")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("comment text must not be empty"),
  body("task_id")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("task ID must not be empty"),
  body("user_id")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("user ID must not be empty"),
];

export class CommentRoutes {
  private basePoint = "/api/comments";
  constructor(app: Express) {
    const controller = new CommentController();

    app
      .route(this.basePoint)
      .all(authorize)
      .post(validate(validCommentInput), controller.addHandler)
      .get(controller.getAllHandler);

    app
      .route(this.basePoint + "/:id")
      .all(authorize)
      .delete(controller.deleteHandler)
      .patch(validate(validCommentInputPatch), controller.updateHandler)
      .get(controller.getOneHandler);
  }
}
