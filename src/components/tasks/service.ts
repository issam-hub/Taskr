import type { Repository } from "typeorm";
import { BaseService, type ApiResponse } from "../../utils/base_service.js";
import { ConnectDatabase } from "../../utils/db_utils.js";
import { Tasks } from "./entity.js";

export class TasksService extends BaseService<Tasks> {
  private tasksRepo: Repository<Tasks> | null = null;
  constructor() {
    const dbInstance = new ConnectDatabase();
    let tasksRepo: Repository<Tasks> = dbInstance.getRepo(
      Tasks,
    ) as Repository<Tasks>;
    super(tasksRepo);

    this.tasksRepo = tasksRepo;
  }
  override async findAll(queryParams: Object): Promise<ApiResponse<Tasks[]>> {
    const queryBuilder = this.tasksRepo
      ?.createQueryBuilder("task")
      .leftJoin("task.project_id", "project")
      .leftJoin("task.user_id", "user")
      .addSelect([
        "task.*",
        "task.project_id as project",
        "project.project_id",
        "project.name",
        "user.user_id",
        "user.username",
        "user.email",
      ]);

    if (queryParams["username"]) {
      queryBuilder?.andWhere(`user.username ILIKE :userName`, {
        userName: `%${queryParams["username"]}%`,
      });
    }
    if (queryParams["projectname"]) {
      queryBuilder?.andWhere("project.name ILIKE :projectName", {
        projectName: `%${queryParams["projectname"]}%`,
      });
    }

    if (queryParams["project_id"]) {
      queryBuilder?.andWhere("task.project_id = :projectId", {
        projectId: queryParams["project_id"],
      });
    }

    const data = await queryBuilder?.getMany();
    data?.forEach((item) => {
      item["projectDetails"] = item.project_id;
      item["userDetails"] = item.user_id;
      delete (item as any).project_id;
      delete (item as any).user_id;
    });
    return { statusCode: 200, status: "success", data: data as Tasks[] };
  }
  override async findOne(id: string): Promise<ApiResponse<Tasks>> {
    try {
      const pk: string | undefined =
        this.tasksRepo?.metadata.primaryColumns[0]?.propertyName;

      const data = await this.tasksRepo
        ?.createQueryBuilder("task")
        .leftJoin("task.project_id", "project")
        .leftJoin("task.user_id", "user")
        .addSelect([
          "task.*",
          "task.project_id as project",
          "project.project_id",
          "project.name",
          "user.user_id",
          "user.username",
          "user.email",
        ])
        .where({ [pk as string]: id })
        .getOne();

      if (data) {
        data["projectDetails"] = data.project_id;
        data["userDetails"] = data.user_id;
        delete (data as any).project_id;
        delete (data as any).user_id;
        return { statusCode: 200, status: "success", data: data };
      } else {
        return { statusCode: 404, status: "error", message: "not found" };
      }
    } catch (error: any) {
      return { statusCode: 500, status: "error", message: error.message };
    }
  }
}
