import type { Express } from "express";
import { TaskController } from "./controller.js";
import { checkValidDate } from "../../utils/common.js";
import { body } from "express-validator";
import { authorize, hasPermission } from "../../utils/auth_utils.js";
import { validate } from "../../utils/validator.js";

const validTaskInput = [
  body("name").trim().notEmpty().withMessage("name is required"),
  body("project_id").trim().notEmpty().withMessage("project ID is required"),
  body("user_id").trim().notEmpty().withMessage("user ID is required"),
  body("estimated_start_time")
    .trim()
    .notEmpty()
    .withMessage("estimated start time is required"),
  body("estimated_end_time")
    .trim()
    .notEmpty()
    .withMessage("estimated end time is required"),
  body("estimated_start_time").custom((value) => {
    if (!checkValidDate(value)) {
      throw new Error("Invalid date format, should be YYYY-MM-DD HH:mm:ss");
    }
    const startTime = new Date(value);
    const currentTime = new Date();
    if (startTime <= currentTime) {
      throw new Error("Start time must be greater than the current time");
    }
    return true;
  }),
  body("estimated_end_time").custom((value, { req }) => {
    if (!checkValidDate(value)) {
      throw new Error("Invalid date format, should be YYYY-MM-DD HH:mm:ss");
    }
    const startTime = new Date(req.body.start_time);
    const endTime = new Date(value);
    if (endTime <= startTime) {
      throw new Error("End time must be greater than the start time");
    }
    return true;
  }),
];
const validTaskInputPatch = [
  body("name").optional(),
  body("estimated_start_time").optional(),
  body("estimated_end_time").optional(),
  body("estimated_start_time")
    .optional()
    .custom((value) => {
      if (!checkValidDate(value)) {
        throw new Error("Invalid date format, should be YYYY-MM-DD HH:mm:ss");
      }
      const startTime = new Date(value);
      const currentTime = new Date();
      if (startTime <= currentTime) {
        throw new Error("Start time must be greater than the current time");
      }
      return true;
    }),
  body("estimated_end_time")
    .optional()
    .custom((value, { req }) => {
      if (!checkValidDate(value)) {
        throw new Error("Invalid date format, should be YYYY-MM-DD HH:mm:ss");
      }
      const startTime = new Date(req.body.start_time);
      const endTime = new Date(value);
      if (endTime <= startTime) {
        throw new Error("End time must be greater than the start time");
      }
      return true;
    }),
];

export class TaskRoutes {
  private basePoint = "/api/tasks";
  constructor(app: Express) {
    const controller = new TaskController();

    app
      .route(this.basePoint)
      .all(authorize)
      .post(
        validate(validTaskInput),
        hasPermission("add_task"),
        controller.addHandler,
      )
      .get(hasPermission("get_all_tasks"), controller.getAllHandler);

    app
      .route(this.basePoint + "/:id")
      .all(authorize)
      .delete(hasPermission("delete_task"), controller.deleteHandler)
      .patch(
        validate(validTaskInputPatch),
        hasPermission("edit_task"),
        controller.updateHandler,
      )
      .get(hasPermission("get_details_task"), controller.getOneHandler);
  }
}
