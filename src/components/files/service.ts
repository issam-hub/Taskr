import { ConnectDatabase } from "../../utils/db_utils.js";
import { BaseService } from "../../utils/base_service.js";
import { Files } from "./entity.js";
import type { Repository } from "typeorm";

export class FilesService extends BaseService<Files> {
  constructor() {
    const dbInstance = new ConnectDatabase();
    const filesRepo: Repository<Files> = dbInstance.getRepo(
      Files,
    ) as Repository<Files>;

    super(filesRepo);
  }
}
