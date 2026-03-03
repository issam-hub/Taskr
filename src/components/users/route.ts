import type { Express } from "express";
import { UserController } from "./controller.js";
import { body } from "express-validator";
import { validate } from "../../utils/validator.js";
import { authorize, hasPermission } from "../../utils/auth_utils.js";

const validUserInput = [
  body("username").trim().notEmpty().withMessage("username is required"),
  body("fullname").trim().notEmpty().withMessage("fullname is required"),
  body("email").isEmail().withMessage("email should be valid"),
  body("password")
    .isLength({ min: 8, max: 16 })
    .withMessage("password should be between 8 and 16 characters long")
    .isStrongPassword({
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage(
      "password must include at least one uppercase letter, one lowercase letter, one number, and one special character",
    ),
  body("role_id").custom((value: string) => {
    console.log("value: ", value);
    const uuidPattern =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    const isValid = uuidPattern.test(value.trim());
    if (!isValid) {
      throw new Error("role_id should be a valid UUID");
    }
    return true;
  }),
];

const validUserInputPatch = [
  body("fullname").optional().trim(),
  body("role_id")
    .optional()
    .custom((value: string) => {
      console.log("value: ", value);
      const uuidPattern =
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      const isValid = uuidPattern.test(value.trim());
      if (!isValid) {
        throw new Error("role_id should be a valid UUID");
      }
      return true;
    }),
];

export class UserRoutes {
  private basePoint = "/api/users";
  constructor(app: Express) {
    const controller = new UserController();

    app
      .route(this.basePoint)
      .all(authorize)
      .post(
        validate(validUserInput),
        hasPermission("add_user"),
        controller.addHandler,
      )
      .get(hasPermission("get_all_users"), controller.getAllHandler);

    app
      .route(this.basePoint + "/:id")
      .all(authorize)
      .delete(hasPermission("delete_user"), controller.deleteHandler)
      .patch(
        validate(validUserInputPatch),
        hasPermission("edit_user"),
        controller.updateHandler,
      )
      .get(hasPermission("get_details_user"), controller.getOneHandler);

    app.route("/api/login").post(controller.login);
    app
      .route("/api/refresh_token")
      .post(controller.getAccessTokenFromRefreshToken);
  }
}
