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
import type { Users } from "./entity.js";
import { loadEnvFile } from "process";
import { renderTemplate, sendMail } from "../../utils/email_util.js";

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
  public static async getUserByEmail(email: string) {
    try {
      if (email) {
        const service = new UsersService();
        const users = await service.customQuery(`email = '${email}'`);
        if (users && users.length > 0) {
          return users[0];
        }
      }
    } catch (error: any) {
      console.error(`error while getting user by email: `, error.message);
    }
    return null;
  }
  public static async checkValidUserIDs(user_ids: string[]) {
    const userService = new UsersService();

    const users = await userService.findByIds(user_ids);

    return users.data?.length === user_ids.length;
  }
  public static async getUsernamesByID(user_ids: string[]) {
    const userService = new UsersService();
    const queryResult = await userService.findByIds(user_ids);
    if (queryResult.statusCode === 200) {
      const users = queryResult.data;
      const usernames = users?.map((i) => {
        return {
          username: i.username,
          user_id: i.user_id,
        };
      });
      return usernames;
    }
    return [];
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
      const { exp, ...userData } = user as Record<string, unknown>;
      const accessToken: string = jwt.sign(userData, SERVER_CONST.JWTSECRET, {
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

  public async changePassword(req: Request, res: Response) {
    const { oldPassword, newPassword } = req.body;
    const service = new UsersService();

    const findUserResult = await service.findOne(req.params.id as string);
    if (findUserResult.statusCode !== 200) {
      res
        .status(404)
        .send({ statusCode: 404, status: "error", message: "user not found" });
      return;
    }

    const user = findUserResult.data;

    if (user?.username !== req.user?.username) {
      res.status(400).json({
        statusCode: 400,
        status: "error",
        message: "users can only change their own passwords",
      });
      return;
    }

    const comparePasswords = await bcryptCompare(
      oldPassword,
      user?.password as string,
    );

    if (!comparePasswords) {
      res.status(400).json({
        statusCode: 400,
        status: "error",
        message: "old password doesn't match",
      });
      return;
    }
    const newEncryptedPassword = await encryptString(newPassword);

    const result = await service.update(req.params.id as string, {
      password: newEncryptedPassword,
    });

    if (result.statusCode === 200) {
      res.status(200).json({
        statusCode: 200,
        status: "success",
        message: "password changed successfully",
      });
      return;
    } else {
      res.status(result.statusCode as number).json(result);
    }
  }

  public async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      res
        .status(400)
        .json({ statusCode: 400, status: "error", message: "invalid email" });
      return;
    }

    const user: Users = (await UsersUtil.getUserByEmail(email)) as Users;
    if (!user) {
      res
        .status(404)
        .json({ statusCode: 404, status: "error", message: "user not found" });
      return;
    }

    loadEnvFile();

    const resetToken = jwt.sign({ email }, SERVER_CONST.JWTSECRET, {
      expiresIn: "1h",
    });

    const resetLink = `${process.env.APP_URL}/reset-password?token=${resetToken}`;

    const html = renderTemplate("reset_password", {
      username: user.username,
      resetLink,
      year: new Date().getFullYear(),
    });

    const mailOptions = {
      to: email,
      subject: "Password Reset",
      html,
    };

    const emailStatus = await sendMail(
      mailOptions.to,
      mailOptions.subject,
      mailOptions.html,
    );
    if (emailStatus) {
      res.status(200).json({
        statusCode: 200,
        status: "success",
        message: "reset link set to your email",
        data: {
          resetToken: resetToken,
        },
      });
    } else {
      res.status(400).json({
        statusCode: 400,
        status: "error",
        message: "something went wrong, try again",
      });
    }
  }
  public async resetPassword(req: Request, res: Response) {
    const { newPassword, token } = req.body;

    const service = new UsersService();
    let email;
    try {
      const decoded = jwt.verify(token, SERVER_CONST.JWTSECRET);
      if (!decoded) {
        throw new Error("invalid reset token");
      }

      email = decoded["email"];
    } catch (error: any) {
      res.status(400).json({
        statusCode: 400,
        status: "error",
        message: "reset token is invalid or expired",
      });
      return;
    }

    try {
      const user = await UsersUtil.getUserByEmail(email);
      if (!user) {
        res.status(404).json({
          statusCode: 404,
          status: "error",
          message: "user not found",
        });
        return;
      }

      const newEncryptedPassword = await encryptString(newPassword);
      const result = await service.update((user as any).user_id as string, {
        password: newEncryptedPassword,
      });
      if (result.statusCode === 200) {
        res.status(200).json({
          statusCode: 200,
          status: "success",
          message: "password updated successfully",
        });
      } else {
        res.status(result.statusCode as number).json(result);
      }
    } catch (error: any) {
      console.error("error while reseting password: ", error.message);
      res.status(500).json({
        statusCode: 500,
        status: "error",
        message: "internal server error",
      });
    }
  }
}
