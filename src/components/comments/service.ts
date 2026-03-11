import type { Repository } from "typeorm";
import { BaseService, type ApiResponse } from "../../utils/base_service.js";
import { ConnectDatabase } from "../../utils/db_utils.js";
import { Comments } from "./entity.js";

export class CommentsService extends BaseService<Comments> {
  private commentsRepo: Repository<Comments> | null = null;
  constructor() {
    const dbInstance = new ConnectDatabase();
    let commentsRepo: Repository<Comments> = dbInstance.getRepo(
      Comments,
    ) as Repository<Comments>;
    super(commentsRepo);

    this.commentsRepo = commentsRepo;
  }
  override async findAll(queryParams: Object): Promise<ApiResponse<Comments[]>> {
    const queryBuilder = this.commentsRepo
      ?.createQueryBuilder("comment")
      .leftJoin("comment.user_id", "user")
      .leftJoin("comment.task_id", "task")
      .addSelect([
        "comment.*",
        "comment.user_id as user",
        "comment.task_id as task",
        "user.user_id",
        "user.username",
        "user.email",
        "task.task_id",
        "task.name",
      ]);

    if (queryParams["username"]) {
      queryBuilder?.andWhere(`user.username ILIKE :userName`, {
        userName: `%${queryParams["username"]}%`,
      });
    }

    if (queryParams["task_id"]) {
      queryBuilder?.andWhere("comment.task_id = :taskId", {
        taskId: queryParams["task_id"],
      });
    }

    const data = await queryBuilder?.getMany();
    data?.forEach((item) => {
      item["userDetails"] = item.user_id;
      item["taskDetails"] = item.task_id;
      delete (item as any).user_id;
      delete (item as any).task_id;
    });
    return { statusCode: 200, status: "success", data: data as Comments[] };
  }
  override async findOne(id: string): Promise<ApiResponse<Comments>> {
    try {
      const pk: string | undefined =
        this.commentsRepo?.metadata.primaryColumns[0]?.propertyName;

      const data = await this.commentsRepo
        ?.createQueryBuilder("comment")
        .leftJoin("comment.user_id", "user")
        .leftJoin("comment.task_id", "task")
        .addSelect([
          "comment.*",
          "comment.user_id as user",
          "comment.task_id as task",
          "user.user_id",
          "user.username",
          "user.email",
          "task.task_id",
          "task.name",
        ])
        .where({ [pk as string]: id })
        .getOne();

      if (data) {
        data["userDetails"] = data.user_id;
        data["taskDetails"] = data.task_id;
        delete (data as any).user_id;
        delete (data as any).task_id;
        return { statusCode: 200, status: "success", data: data };
      } else {
        return { statusCode: 404, status: "error", message: "not found" };
      }
    } catch (error: any) {
      return { statusCode: 500, status: "error", message: error.message };
    }
  }
}
