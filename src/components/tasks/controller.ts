import { BaseController } from "../../utils/base_controller.js";
import type { Request, Response } from "express";
import { TasksService } from "./service.js";
import { ProjectsUtil } from "../projects/controller.js";
import { UsersUtil } from "../users/controller.js";

export class TasksUtil {
  public static async checkValidTasksIds(tasks_ids: string[]) {
    const tasksService = new TasksService();

    const projects = await tasksService.findByIds(tasks_ids);

    return projects.data?.length === tasks_ids.length;
  }
}

export class TaskController extends BaseController {
  public async addHandler(req: Request, res: Response) {
    try {
      const service = new TasksService();
      const task = req.body;
      const isValidProject = await ProjectsUtil.checkValidProjectIds([
        task.project_id as string,
      ]);
      if (!isValidProject) {
        res.status(400).json({
          statusCode: 400,
          status: "error",
          message: "invalid project_id",
        });
        return;
      }

      const isValidUser = await UsersUtil.checkValidUserIDs([
        task.user_id as string,
      ]);

      if (!isValidUser) {
        res.status(400).json({
          statusCode: 400,
          status: "error",
          message: "invalid user_id",
        });
        return;
      }

      const createdTask = await service.create(task);
      res.status(201).json(createdTask);
    } catch (error: any) {
      console.error("error while creating task: ", error.message);
      res.status(500).json({
        statusCode: 500,
        status: "error",
        message: "internal server error",
      });
    }
  }
  public async getAllHandler(req: Request, res: Response) {
    const service = new TasksService();
    const result = await service.findAll(req.query);
    res.status(result.statusCode as number).json(result);
  }
  public async getOneHandler(req: Request, res: Response) {
    const service = new TasksService();
    const result = await service.findOne(req.params.id as string);
    res.status(result.statusCode as number).json(result);
  }
  public async updateHandler(req: Request, res: Response) {
    const task = req.body;
    const service = new TasksService();
    const result = await service.update(req.params.id as string, task);
    res.status(result.statusCode as number).json(result);
  }
  public async deleteHandler(req: Request, res: Response) {
    const service = new TasksService();
    const result = await service.delete(req.params.id as string);
    res.status(result.statusCode as number).json(result);
  }
}
