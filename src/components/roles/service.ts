import type { Repository } from "typeorm";
import { BaseService } from "../../utils/base_service.js";
import { ConnectDatabase } from "../../utils/db_utils.js";
import { Roles } from "./entity.js";

export class RolesService extends BaseService<Roles> {
  constructor() {
    const dbInstance = new ConnectDatabase();
    const roleRepo: Repository<Roles> = dbInstance.getRepo(
      Roles,
    ) as Repository<Roles>;

    super(roleRepo);
  }
}
