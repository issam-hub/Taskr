import { BaseController } from "../../utils/base_controller.js";
import type { Request, Response } from "express";
import { UsersService } from "./service.js";
import { RolesUtil } from "../roles/controller.js";
import {
  bcryptCompare,
  encryptString,
  SERVER_CONST,
} from "../../utils/common.js";
import jwt from "jsonwebtoken";

export class UsersUtil {
  public static async getUserFromUsername(username: string) {
    try {
      const service = new UsersService();
      const users = await service.customQuery(`username = '${username}'`);
      if (users && users.length > 0) {
        return users[0];
      }
    } catch (error: any) {
      console.error("error while getting user from username: ", error.message);
    }
    return null;
  }
}

export class UserController extends BaseController {
  public async addHandler(req: Request, res: Response) {
    try {
      const service = new UsersService();
      const user = req.body;

      const isValidRole = await RolesUtil.checkValidRoleID(user.role_id);
      if (!isValidRole) {
        res.status(400).json({
          statusCode: 400,
          status: "error",
          message: "invalid role_id",
        });
        return;
      }

      user.email = user.email?.toLowerCase();
      user.username = user.username?.toLowerCase();
      user.password = await encryptString(user.password);

      const createdUser = await service.create(user);
      res.status(createdUser.statusCode as number).json(createdUser);
    } catch (error: any) {
      console.error("error while adding user: ", error.message);
      res.status(500).json({
        statusCode: 500,
        status: "error",
        message: "internal server error",
      });
    }
  }
  public async getAllHandler(req: Request, res: Response) {
    const service = new UsersService();
    const result = await service.findAll(req.query);
    if (result.statusCode === 200) {
      result.data?.forEach((element) => delete (element as any).password);
    }
    res.status(result.statusCode as number).json(result);
  }
  public async getOneHandler(req: Request, res: Response) {
    const service = new UsersService();
    const result = await service.findOne(req.params.id as string);
    if (result.statusCode === 200) {
      delete (result.data as any).password;
    }
    res.status(result.statusCode as number).json(result);
  }
  public async updateHandler(req: Request, res: Response) {
    const service = new UsersService();
    const user = req.body;

    delete (user as any).username;
    delete (user as any).email;
    delete (user as any).password;

    const result = await service.update(req.params.id as string, user);
    if (result.statusCode === 200) {
      delete (result.data as any).password;
    }

    res.status(result.statusCode as number).json(result);
  }
  public async deleteHandler(req: Request, res: Response) {
    const service = new UsersService();
    const result = await service.delete(req.params.id as string);
    res.status(result.statusCode as number).json(result);
  }
  public async login(req: Request, res: Response) {
    const { email, password } = req.body;
    const service = new UsersService();

    const result = await service.findAll({ email });
    if (result.data && result.data.length < 1) {
      res
        .status(404)
        .json({ statusCode: 404, status: "error", message: "email not found" });
      return;
    } else {
      const user = result.data && result.data[0];
      const comparePassword = await bcryptCompare(
        password,
        user?.password as string,
      );
      if (!comparePassword) {
        res.status(400).json({
          statusCode: 404,
          status: "error",
          message: "password is invalid",
        });
        return;
      }
      const accessToken: string = jwt.sign(
        {
          email: user?.email as string,
          username: user?.username as string,
        },
        SERVER_CONST.JWTSECRET,
        {
          expiresIn: SERVER_CONST.ACCESS_TOKEN_EXPIRY_TIME_SECONDS,
        },
      );
      const refreshToken: string = jwt.sign(
        {
          email: user?.email as string,
          username: user?.username as string,
        },
        SERVER_CONST.JWTSECRET,
        {
          expiresIn: SERVER_CONST.REFRESH_TOKEN_EXPIRY_TIME_SECONDS,
        },
      );

      res.status(200).json({
        statusCode: 200,
        status: "success",
        data: {
          accessToken,
          refreshToken,
        },
      });
      return;
    }
  }
  public async getAccessTokenFromRefreshToken(req: Request, res: Response) {
    const refreshToken = req.body.refreshToken;

    jwt.verify(refreshToken, SERVER_CONST.JWTSECRET, (err, user) => {
      if (err) {
        res.status(403).json({
          statusCode: 403,
          status: "error",
          message: "invalid refresh token",
        });
        return;
      }
      const accessToken: string = jwt.sign(user, SERVER_CONST.JWTSECRET, {
        expiresIn: SERVER_CONST.ACCESS_TOKEN_EXPIRY_TIME_SECONDS,
      });
      res.status(200).json({
        statusCode: 200,
        status: "success",
        data: { accessToken },
      });
      return;
    });
  }
}
