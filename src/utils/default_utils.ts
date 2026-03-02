import { v4 } from "uuid";
import { RolesService } from "../components/roles/service.js";
import { RolesUtil } from "../components/roles/controller.js";
import type { Roles } from "../components/roles/entity.js";
import { ConnectDatabase } from "./db_utils.js";
import { UsersService } from "../components/users/service.js";
import type { Users } from "../components/users/entity.js";
import { loadEnvFile } from "process";
import { encryptString } from "./common.js";

export class DefaultUtils {
  private static superAdminRoleID: string;
  public static async addDefaultRole(): Promise<boolean> {
    try {
      const service = new RolesService();
      const rights = RolesUtil.getAllPerimissionsFromRights();
      const role: Roles = {
        role_id: v4(),
        name: "SuperAdmin",
        description: "admin with all permissions",
        rights,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const result = await service.create(role);
      console.log("created default super admin role");
      if (result.statusCode === 201) {
        this.superAdminRoleID = result.data?.role_id as string;
        return true;
      } else if (result.statusCode === 409) {
        const roles = await service.findAll({ name: "SuperAdmin" });
        if (roles.data && roles.data.length > 0) {
          this.superAdminRoleID = roles.data[0]?.role_id as string;
        }
      }
      return false;
    } catch (error: any) {
      console.error(`error while adding default role: ${error.message}`);
      return false;
    }
  }
  public static async addDefaultUser(): Promise<boolean> {
    try {
      await ConnectDatabase.getInstance();
      const service = new UsersService();

      loadEnvFile();

      const { DEFAULT_USER_EMAIL, DEFAULT_USER_PASSWORD } = process.env;

      const user: Users = {
        user_id: v4(),
        fullname: "Super Admin",
        username: "superadmin",
        email: DEFAULT_USER_EMAIL as string,
        password: await encryptString(DEFAULT_USER_PASSWORD as string),
        role_id: this.superAdminRoleID,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const result = await service.create(user);
      console.log("created default user");
      if (result.statusCode === 201) {
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("error while adding default role: ", error.message);
      return false;
    }
  }
}
