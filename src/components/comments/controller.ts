import type { Request, Response } from "express";
import { BaseController } from "../../utils/base_controller.js";
import { CommentsService } from "./service.js";
import { TasksUtil } from "../tasks/controller.js";
import { UsersUtil } from "../users/controller.js";

export class CommentsUtil {
  public static async checkValidCommentsIds(comments_ids: string[]) {
    const commentsService = new CommentsService();
    const comments = await commentsService.findByIds(comments_ids);
    return comments.data?.length === comments_ids.length;
  }
}

export class CommentController extends BaseController {
  public async addHandler(req: Request, res: Response) {
    try {
      const service = new CommentsService();
      const comment = req.body;

      if (!comment.task_id) {
        res.status(400).json({
          statusCode: 400,
          status: "error",
          message: "task_id is required",
        });
        return;
      }

      const isValidTask = await TasksUtil.checkValidTasksIds([
        comment.task_id as string,
      ]);
      if (!isValidTask) {
        res.status(400).json({
          statusCode: 400,
          status: "error",
          message: "invalid task_id",
        });
        return;
      }

      if (comment.user_id) {
        const isValidUser = await UsersUtil.checkValidUserIDs([
          comment.user_id as string,
        ]);

        if (!isValidUser) {
          res.status(400).json({
            statusCode: 400,
            status: "error",
            message: "invalid user_id",
          });
          return;
        }
      }

      const createdComment = await service.create(comment);
      res.status(201).json(createdComment);
    } catch (error: any) {
      console.error("error while creating comment: ", error.message);
      res.status(500).json({
        statusCode: 500,
        status: "error",
        message: "internal server error",
      });
    }
  }
  public async getAllHandler(req: Request, res: Response) {
    const service = new CommentsService();
    const result = await service.findAll(req.query);
    res.status(result.statusCode as number).json(result);
  }
  public async getOneHandler(req: Request, res: Response) {
    const service = new CommentsService();
    const result = await service.findOne(req.params.id as string);
    res.status(result.statusCode as number).json(result);
  }
  public async updateHandler(req: Request, res: Response) {
    const comment = req.body;
    const service = new CommentsService();
    const result = await service.update(req.params.id as string, comment);
    res.status(result.statusCode as number).json(result);
  }
  public async deleteHandler(req: Request, res: Response) {
    const service = new CommentsService();
    const result = await service.delete(req.params.id as string);
    res.status(result.statusCode as number).json(result);
  }
}
