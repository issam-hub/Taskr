import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { SERVER_CONST } from "./common.js";
import type { Users } from "../components/users/entity.js";
import { UsersUtil } from "../components/users/controller.js";
import { RolesUtil } from "../components/roles/controller.js";

export const authorize = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.headers.authorization
    ? (req.headers.authorization.split("Bearer ")[1] as string)
    : null;
  if (!token) {
    return res.status(401).json({
      statusCode: 401,
      status: "error",
      message: "missing authorization token",
    });
  }

  try {
    const decodedToken = jwt.verify(token, SERVER_CONST.JWTSECRET);
    req.user = {};
    req.user.user_id = decodedToken["user_id"] ?? "";
    req.user.username = decodedToken["username"] ?? "";
    req.user.email = decodedToken["email"] ?? "";
    if (req.user.username) {
      const user: Users = (await UsersUtil.getUserFromUsername(
        req.user.username,
      )) as Users;
      const rights = await RolesUtil.getAllRightsFromRole(user.role_id);
      req.user.rights = rights;
    }

    next();
  } catch (error: any) {
    console.error("error while authorization: ", error.message);
    return res
      .status(401)
      .json({ statusCode: 401, status: "error", message: "invalid token" });
  }
};

export const hasPermission = (desired_rights: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.rights?.includes(desired_rights)) {
      return res.status(403).json({
        statusCode: 403,
        status: "error",
        message:
          "user don't have the required permissions to perform this action",
      });
    }
    return next();
  };
};
