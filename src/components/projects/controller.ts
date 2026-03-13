import { BaseController } from "../../utils/base_controller.js";
import type { Request, Response } from "express";
import { ProjectsService } from "./service.js";
import { UsersUtil } from "../users/controller.js";
import { CacheUtil } from "../../utils/cache_utils.js";
import { NotificationUtils } from "../../utils/notification_utils.js";

export class ProjectsUtil {
  public static async checkValidProjectIds(project_ids: string[]) {
    const projectService = new ProjectsService();

    const projects = await projectService.findByIds(project_ids);

    return projects.data?.length === project_ids.length;
  }
}

export class ProjectController extends BaseController {
  public async addHandler(req: Request, res: Response) {
    try {
      const service = new ProjectsService();
      const project = req.body;

      const isValidUsers = await UsersUtil.checkValidUserIDs(project.user_ids);
      if (!isValidUsers) {
        res.status(400).json({
          statusCode: 400,
          status: "error",
          message: "invalid user_ids",
        });
        return;
      }
      const result = await service.create(project);
      if (result.status === "success" && result.data?.project_id) {
        for (const id of project.user_ids) {
          await NotificationUtils.send({
            userId: id as string,
            title: "Project Assigned",
            message: `You have been assigned a new project: ${project.name}`,
            channels: ["IN_APP"],
          });
        }
      }
      res.status(result.statusCode as number).json(result);
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
    const service = new ProjectsService();
    const result = await service.findAll(req.query);
    if (result.data) {
      for (const project of result.data) {
        project["users"] = await UsersUtil.getUsernamesByID(project.user_ids);
        delete (project as any).user_ids;
      }
    }
    res.status(result.statusCode as number).json(result);
  }
  public async getOneHandler(req: Request, res: Response) {
    const projectFromCache = await CacheUtil.get(
      "Project",
      req.params.id as string,
    );
    if (projectFromCache) {
      res
        .status(200)
        .json({ statusCode: 200, status: "success", data: projectFromCache });
      return;
    }
    const service = new ProjectsService();
    const result = await service.findOne(req.params.id as string);
    result["users"] = await UsersUtil.getUsernamesByID(
      result.data?.user_ids as string[],
    );
    delete (result.data as any).user_ids;
    await CacheUtil.set("Project", req.params.id as string, result.data);
    res.status(result.statusCode as number).json(result);
  }
  public async updateHandler(req: Request, res: Response) {
    const project = req.body;
    const service = new ProjectsService();
    const result = await service.update(req.params.id as string, project);

    CacheUtil.remove("Project", req.params.id as string);
    res.status(result.statusCode as number).json(result);
  }
  public async deleteHandler(req: Request, res: Response) {
    const service = new ProjectsService();
    const result = await service.delete(req.params.id as string);

    CacheUtil.remove("Project", req.params.id as string);

    res.status(result.statusCode as number).json(result);
  }
}
