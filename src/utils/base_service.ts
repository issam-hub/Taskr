import type {
  DeepPartial,
  ObjectLiteral,
  Repository,
  FindOneOptions,
} from "typeorm";

export type UpdateDataKeys<T> = keyof T & keyof DeepPartial<T>;

export interface ApiResponse<T> {
  status: "success" | "error";
  message?: string;
  data?: T;
  statusCode?: number;
}

export class BaseService<T extends ObjectLiteral> {
  constructor(private readonly repo: Repository<T>) {}

  async create(entity: DeepPartial<T>): Promise<ApiResponse<T>> {
    try {
      const createdEntity = this.repo.create(entity);

      const saveEntity = await this.repo.save(createdEntity);

      return {
        statusCode: 201,
        status: "success",
        data: saveEntity,
      };
    } catch (err: any) {
      if (err.code === "23505") {
        return { statusCode: 409, status: "error", message: err.detail };
      } else {
        return { statusCode: 500, status: "error", message: err.message };
      }
    }
  }

  async update(
    id: string,
    updateData: DeepPartial<T>,
  ): Promise<ApiResponse<T>> {
    try {
      const isExist = await this.findOne(id);
      if (isExist.statusCode === 404) {
        return isExist;
      }

      const pk: string | undefined =
        this.repo.metadata.primaryColumns[0]?.propertyName;

      const result = await this.repo
        .createQueryBuilder()
        .update()
        .set(updateData as any)
        .where({ [pk as string]: id })
        .returning("*")
        .execute();

      if (result.affected && result.affected > 0) {
        return { statusCode: 200, status: "success", data: result.raw[0] };
      } else {
        return {
          statusCode: 400,
          status: "error",
          message: "Invalid Data",
        };
      }
    } catch (err: any) {
      if (err.code === "23505") {
        return { statusCode: 409, status: "error", message: err.detail };
      } else {
        return { statusCode: 500, status: "error", message: err.message };
      }
    }
  }

  async findOne(id: string): Promise<ApiResponse<T>> {
    try {
      const pk: string | undefined =
        this.repo.metadata.primaryColumns[0]?.propertyName;

      const data = await this.repo.findOneBy({ [pk as string]: id } as any);
      if (data) {
        return { statusCode: 200, status: "success", data: data };
      } else {
        return { statusCode: 404, status: "error", message: "not found" };
      }
    } catch (err: any) {
      return { statusCode: 500, status: "error", message: err.message };
    }
  }

  async findAll(queryParams: object): Promise<ApiResponse<T[]>> {
    try {
      let data: T[] = [];
      if (Object.keys(queryParams).length > 0) {
        const query = this.repo.createQueryBuilder();
        for (const field in queryParams) {
          if (Object.hasOwn(queryParams, field)) {
            const value = queryParams[field];
            query.andWhere(`${field} = ${value}`);
          }
        }
        data = await query.getMany();
      } else {
        data = await this.repo.find();
      }
      return { statusCode: 200, status: "success", data: data };
    } catch (err: any) {
      return { statusCode: 500, status: "error", message: err.message };
    }
  }

  async delete(id: string): Promise<ApiResponse<T>> {
    try {
      const isExist = await this.findOne(id);
      if (isExist.statusCode === 404) {
        return isExist;
      }

      await this.repo.delete(id);

      return { statusCode: 200, status: "success" };
    } catch (error: any) {
      return { statusCode: 500, status: "error", message: error.message };
    }
  }

  async findByIds(ids: string[]): Promise<ApiResponse<T[]>> {
    try {
      const primaryKey: string | undefined =
        this.repo.metadata.primaryColumns[0]?.propertyName;

      // Query the database to retrieve records with the specified IDs
      const data = await this.repo
        .createQueryBuilder()
        .where(`${primaryKey as string} IN (:...ids)`, { ids: ids })
        .getMany();

      // Return success response with the retrieved data
      return { statusCode: 200, status: "success", data: data };
    } catch (err: any) {
      // Return error response if an exception occurs
      return {
        statusCode: 500,
        status: "error",
        data: [],
        message: err.message,
      };
    }
  }

  async customQuery(query: string): Promise<T[]> {
    try {
      const data = await this.repo.createQueryBuilder().where(query).getMany();

      return data;
    } catch (error) {
      console.error(`Error while executing custom query: ${query}`, error);
      return [];
    }
  }
}
