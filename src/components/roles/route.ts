import type { Express } from "express";
import { RoleController, RolesUtil } from "./controller.js";
import { body } from "express-validator";
import { validate } from "../../utils/validator.js";

const validateInput = [
  body("name").trim().notEmpty().withMessage("name is required"),
  body("description")
    .isLength({ max: 200 })
    .withMessage("length should not exceed 200 characters"),
  body("rights").custom((value: string[]) => {
    if (!Array.isArray(value)) {
      throw new Error("rights value must be an array");
    }
    if (value.length > 0) {
      const validRights = RolesUtil.getAllPerimissionsFromRights();
      const areRightsValid = value.every((right) =>
        validRights.includes(right),
      );
      if (!areRightsValid) {
        throw new Error("invalid permissions");
      }
    }
    return true;
  }),
];

const validateInputPatch = [
  body("name").optional().trim().notEmpty().withMessage("name is required"),
  body("description")
    .optional()
    .isLength({ max: 200 })
    .withMessage("length should not exceed 200 characters"),
  body("rights")
    .optional()
    .custom((value: string[]) => {
      if (!Array.isArray(value)) {
        throw new Error("rights value must be an array");
      }
      if (value.length > 0) {
        const validRights = RolesUtil.getAllPerimissionsFromRights();
        const areRightsValid = value.every((right) =>
          validRights.includes(right),
        );
        if (!areRightsValid) {
          throw new Error("invalid permissions");
        }
      }
      return true;
    }),
];

export class RoleRoutes {
  private basePoint = "/api/roles";
  constructor(app: Express) {
    const controller = new RoleController();

    app
      .route(this.basePoint)
      .post(validate(validateInput), controller.addHandler)
      .get(controller.getAllHandler);

    app
      .route(this.basePoint + "/:id")
      .delete(controller.deleteHandler)
      .patch(validate(validateInputPatch), controller.updateHandler)
      .get(controller.getOneHandler);
  }
}
