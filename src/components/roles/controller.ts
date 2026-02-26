import type { Request, Response } from "express";
import type { DeepPartial } from "typeorm";
import { BaseController } from "../../utils/base_controller.js";
import { Rights } from "../../utils/common.js";
import { RolesService } from "./service.js";
import type { Roles } from "./entity.js";

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
}

export class RoleController extends BaseController {
  public async addHandler(req: Request, res: Response) {
    const role = req.body;
    const service = new RolesService();
    const result = await service.create(role as DeepPartial<Roles>);
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
    res.status(result.statusCode as number).json(result);
  }
  public async deleteHandler(req: Request, res: Response) {
    const id = req.params.id;
    const service = new RolesService();
    const result = await service.delete(id as string);
    res.status(result.statusCode as number).json(result);
  }
}
