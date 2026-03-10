import type { Express } from "express";
import { ProjectController } from "./controller.js";
import { body } from "express-validator";
import { checkValidDate } from "../../utils/common.js";
import { authorize, hasPermission } from "../../utils/auth_utils.js";
import { validate } from "../../utils/validator.js";

const validProjectInput = [
  body("name").trim().notEmpty().withMessage("name is required"),
  body("user_ids")
    .isArray()
    .withMessage("user_ids should be an array of users ids"),
  body("start_time").custom((value) => {
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
  body("end_time").custom((value, { req }) => {
    if (!checkValidDate(value)) {
      throw new Error("Invalid date format, shoule be YYYY-MM-DD HH:mm:ss");
    }
    const startTime = new Date(req.body.start_time);
    const endTime = new Date(value);
    if (endTime <= startTime) {
      throw new Error("End time must be greater than the start time");
    }
    return true;
  }),
];

const validProjectInputPatch = [
  body("name").optional().trim(),
  body("user_ids")
    .optional()
    .isArray()
    .withMessage("user_ids should be an array of users ids"),
  body("start_time")
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
  body("end_time")
    .optional()
    .custom((value, { req }) => {
      if (!checkValidDate(value)) {
        throw new Error("Invalid date format, shoule be YYYY-MM-DD HH:mm:ss");
      }
      const startTime = new Date(req.body.start_time);
      const endTime = new Date(value);
      if (endTime <= startTime) {
        throw new Error("End time must be greater than the start time");
      }
      return true;
    }),
];

export class ProjectRoutes {
  private basePoint = "/api/projects";
  constructor(app: Express) {
    const controller = new ProjectController();

    app
      .route(this.basePoint)
      .all(authorize)
      .post(
        validate(validProjectInput),
        hasPermission("add_project"),
        controller.addHandler,
      )
      .get(hasPermission("get_all_projects"), controller.getAllHandler);

    app
      .route(this.basePoint + "/:id")
      .all(authorize)
      .delete(hasPermission("delete_project"), controller.deleteHandler)
      .patch(
        validate(validProjectInputPatch),
        hasPermission("edit_project"),
        controller.updateHandler,
      )
      .get(hasPermission("get_details_project"), controller.getOneHandler);
  }
}
