import { v4 } from "uuid";
import { RolesService } from "../components/roles/service.js";
import { RolesUtil } from "../components/roles/controller.js";
import type { Roles } from "../components/roles/entity.js";

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
}
