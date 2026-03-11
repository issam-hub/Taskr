import type { Request, Response } from "express";
import { deleteFile, overrideFile, uploadFile } from "../../utils/multer.js";
import { Files } from "./entity.js";
import { FilesService } from "./service.js";
import { TasksUtil } from "../tasks/controller.js";
import { CommentsUtil } from "../comments/controller.js";

export class FileUtils {
  public static getPublicId(secure_url: string): string {
    const match = secure_url.match(/\/upload\/v\d+\/(.+)\.[a-zA-Z0-9]+$/);
    return match ? (match[1] as string) : "";
  }
}

export class FileController {
  public addHandler(resource: "task" | "comment") {
    return async (req: Request, res: Response) => {
      try {
        const idField = resource === "task" ? "task_id" : "comment_id";
        const resourceId = req.body[idField];
        if (!resourceId) {
          res.status(400).json({
            statusCode: 400,
            status: "error",
            message: `${idField} is required`,
          });
          return;
        }

        if (resource === "task") {
          const isValidTask = await TasksUtil.checkValidTasksIds([
            resourceId as string,
          ]);
          if (!isValidTask) {
            res.status(400).json({
              statusCode: 400,
              status: "error",
              message: "invalid task_id",
            });
            return;
          }
        } else if (resource === "comment") {
          const isValidComment = await CommentsUtil.checkValidCommentsIds([
            resourceId as string,
          ]);
          if (!isValidComment) {
            res.status(400).json({
              statusCode: 400,
              status: "error",
              message: "invalid comment_id",
            });
            return;
          }
        }

        const uploadedFile = await uploadFile(req);
        const service = new FilesService();
        const fileData = new Files();
        fileData.file_name = uploadedFile.filename;
        fileData.mime_type = uploadedFile.meme_type;
        fileData.url = uploadedFile.url;
        fileData.created_by = req?.user?.user_id ?? "";
        if (resource === "task") {
          fileData.task_id = resourceId;
        } else if (resource === "comment") {
          fileData.comment_id = resourceId;
        }
        const createdFile = await service.create(fileData);
        res.status(201).json(createdFile);
      } catch (error: any) {
        res
          .status(400)
          .json({ statusCode: 400, status: "error", error: error.message });
      }
    };
  }
  public getAllHandler(resource: "task" | "comment") {
    return async (req: Request, res: Response) => {
      const service = new FilesService();
      const idField = resource === "task" ? "task_id" : "comment_id";
      const resourceId = req.params[idField];
      const result = await service.customQuery(
        `${idField} = '${resourceId}'`,
      );
      if (!result) {
        res
          .status(400)
          .json({ statusCode: 400, status: "error", message: "files not found" });
        return;
      }
      res.status(200).json({ statusCode: 200, status: "success", data: result });
    };
  }
  public async getOneHandler(req: Request, res: Response) {
    try {
      const service = new FilesService();
      const result = await service.findOne(req.params.id as string);
      if (!result.data?.url) {
        res.status(404).json({
          statusCode: 404,
          status: "error",
          message: "File URL not found",
        });
        return;
      }
      res.redirect(result.data.url as string);
    } catch (error: any) {
      res
        .status(400)
        .json({ statusCode: 400, status: "error", message: error.message });
    }
  }
  public async updateHandler(req: Request, res: Response) {
    try {
      const service = new FilesService();
      const { id } = req.params;

      const result = await service.findOne(id as string);
      if (!result.data) {
        res.status(404).json({
          statusCode: 404,
          status: "error",
          message: "file not found",
        });
        return;
      }

      const public_id = FileUtils.getPublicId(result.data?.url as string);

      if (!public_id) {
        res.status(500).json({
          statusCode: 500,
          status: "error",
          message: "error while getting the file's public ID",
        });
      }

      const overridedFile = await overrideFile(req, public_id);

      const fileData = new Files();
      fileData.file_name = overridedFile.filename;
      fileData.mime_type = overridedFile.meme_type;
      fileData.url = overridedFile.url;
      fileData.created_by = req?.user?.user_id ?? "";
      fileData.task_id = result.data?.task_id as string;
      fileData.comment_id = result.data?.comment_id as string;
      const updatedFile = await service.update(id as string, fileData);
      res.status(200).json(updatedFile);
    } catch (error: any) {
      res
        .status(400)
        .json({ statusCode: 400, status: "error", error: error.message });
    }
  }
  public async deleteHandler(req: Request, res: Response) {
    try {
      const service = new FilesService();
      const { id } = req.params;

      const result = await service.findOne(id as string);
      if (!result.data) {
        res.status(404).json({
          statusCode: 404,
          status: "error",
          message: "file not found",
        });
        return;
      }

      const public_id = FileUtils.getPublicId(result.data?.url as string);

      if (!public_id) {
        res.status(500).json({
          statusCode: 500,
          status: "error",
          message: "error while getting the file's public ID",
        });
        return;
      }

      const deletedFile = await deleteFile(public_id);
      if (!deletedFile.result) {
        res.status(500).json({
          statusCode: 500,
          status: "error",
          message: "error while deleting the file",
        });
      }

      const resultt = await service.delete(req.params.id as string);
      res.status(result.statusCode as number).json(resultt);
    } catch (error: any) {
      res
        .status(400)
        .json({ statusCode: 400, status: "error", error: error.message });
    }
  }
}
