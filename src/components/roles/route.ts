import type { Express } from "express";
import { RoleController, RolesUtil } from "./controller.js";
import { body } from "express-validator";
import { validate } from "../../utils/validator.js";
import { authorize, hasPermission } from "../../utils/auth_utils.js";

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
  body("name").optional().trim(),
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
      .all(authorize)
      .post(
        validate(validateInput),
        hasPermission("add_role"),
        controller.addHandler,
      )
      .get(hasPermission("get_all_roles"), controller.getAllHandler);

    app
      .route(this.basePoint + "/:id")
      .all(authorize)
      .delete(hasPermission("delete_role"), controller.deleteHandler)
      .patch(
        validate(validateInputPatch),
        hasPermission("edit_role"),
        controller.updateHandler,
      )
      .get(hasPermission("get_details_role"), controller.getOneHandler);
  }
}
