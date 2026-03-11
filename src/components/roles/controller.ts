import type { Request, Response } from "express";
import type { DeepPartial } from "typeorm";
import { BaseController } from "../../utils/base_controller.js";
import { Rights } from "../../utils/common.js";
import { RolesService } from "./service.js";
import type { Roles } from "./entity.js";
import { CacheUtil } from "../../utils/cache_utils.js";

export class RolesUtil {
  public static getAllPerimissionsFromRights(): string[] {
    let permissions: string[] = [];
    for (const module in Rights) {
      if (Rights[module]["ALL"]) {
        let sectionValues = Rights[module]["ALL"];
        sectionValues = sectionValues.split(",");
        permissions = [...permissions, ...(sectionValues as string[])];
      }
    }
    return permissions;
  }
  public static async checkValidRoleID(role_id: string): Promise<boolean> {
    const service = new RolesService();

    const role = await service.findOne(role_id);

    return !!role.data;
  }

  public static async getAllRightsFromRole(role_id: string): Promise<string[]> {
    const service = new RolesService();
    let rights: string[] = [];
    const queryData = await service.findOne(role_id);

    rights = [...new Set(queryData.data?.rights)];
    return rights;
  }
  public static async cacheAllRoles() {
    const service = new RolesService();
    const result = await service.findAll({});
    if (result.statusCode === 200) {
      const roles = result.data;
      roles?.forEach(async (role) => {
        await CacheUtil.set("Role", role.role_id, role);
      });
      console.log("all roles are cached");
    } else {
      console.error("error while caching all roles: ", result.message);
      console.log(result);
    }
  }
}

export class RoleController extends BaseController {
  public async addHandler(req: Request, res: Response) {
    const role = req.body;
    const service = new RolesService();
    const result = await service.create(role as DeepPartial<Roles>);
    CacheUtil.set("Role", result.data?.role_id as string, result.data);
    res.status(result.statusCode as number).json(result);
  }
  public async getAllHandler(req: Request, res: Response) {
    const query = req.query;
    const service = new RolesService();
    const result = await service.findAll(query);
    res.status(result.statusCode as number).json(result);
  }
  public async getOneHandler(req: Request, res: Response) {
    const id = req.params.id;
    const service = new RolesService();
    const result = await service.findOne(id as string);
    res.status(result.statusCode as number).json(result);
  }
  public async updateHandler(req: Request, res: Response) {
    const role = req.body;
    const id = req.params.id;

    const service = new RolesService();
    const result = await service.update(id as string, role);
    CacheUtil.remove("Role", req.params.id as string);
    res.status(result.statusCode as number).json(result);
  }
  public async deleteHandler(req: Request, res: Response) {
    const id = req.params.id;
    const service = new RolesService();
    const result = await service.delete(id as string);
    CacheUtil.remove("Role", req.params.id as string);
    res.status(result.statusCode as number).json(result);
  }
}
