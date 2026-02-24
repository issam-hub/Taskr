import { loadEnvFile } from "process";
import { DataSource, Repository } from "typeorm";
import { Roles } from "../components/roles/entity.js";
import { Users } from "../components/users/entity.js";
import { Projects } from "../components/projects/entity.js";
import { Comments } from "../components/comments/entity.js";
import { Tasks } from "../components/tasks/entity.js";

export class ConnectDatabase {
  private static connection: DataSource | null = null;
  private repos: Record<string, Repository<any>> = {};
  private static instance: ConnectDatabase;

  constructor() {
    this.connect();
  }

  public static async getInstance(): Promise<ConnectDatabase> {
    if (!ConnectDatabase.instance) {
      ConnectDatabase.instance = new ConnectDatabase();
      await ConnectDatabase.instance.connect();
    }
    return ConnectDatabase.instance;
  }

  private async connect() {
    try {
      if (ConnectDatabase.connection) {
        return ConnectDatabase.connection;
      } else {
        loadEnvFile();
        const { HOST, DBPORT, USERNAME, PASSWORD, DBNAME } = process.env;
        const appDataSource = new DataSource({
          type: "postgres",
          host: HOST as string,
          port: DBPORT as unknown as number,
          username: USERNAME as string,
          password: PASSWORD as string,
          database: DBNAME as string,
          entities: [Roles, Users, Projects, Comments, Tasks],
          synchronize: true,
          logging: false,
        });

        await appDataSource.initialize();
        ConnectDatabase.connection = appDataSource;
        console.log("connected to the database");
        return ConnectDatabase.connection;
      }
    } catch (err) {
      console.error("error connecting to database: ", err);
    }
  }

  public getRepo(entity) {
    try {
      if (ConnectDatabase.connection) {
        const entityName = entity.name;
        if (!this.repos[entityName]) {
          this.repos[entityName] =
            ConnectDatabase.connection.getRepository(entity);
        }
        return this.repos[entityName];
      }
      return null;
    } catch (err: any) {
      console.error(`error while getRepository: ${err.message}`);
    }
  }
}
