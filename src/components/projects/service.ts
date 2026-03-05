import type { Repository } from "typeorm";
import { BaseService } from "../../utils/base_service.js";
import { Projects } from "./entity.js";
import { ConnectDatabase } from "../../utils/db_utils.js";

export class ProjectsService extends BaseService<Projects> {
  constructor() {
    const dbInstance = new ConnectDatabase();
    const projectsRepo: Repository<Projects> = dbInstance.getRepo(
      Projects,
    ) as Repository<Projects>;

    super(projectsRepo);
  }
}
