import type { Repository } from "typeorm";
import { BaseService } from "../../utils/base_service.js";
import { ConnectDatabase } from "../../utils/db_utils.js";
import { Users } from "./entity.js";

export class UsersService extends BaseService<Users> {
  constructor() {
    const dbInstance = new ConnectDatabase();
    const userRepo: Repository<Users> = dbInstance.getRepo(
      Users,
    ) as Repository<Users>;

    super(userRepo);
  }
}
