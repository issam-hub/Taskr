import type { Express } from "express";
import type { Router } from "express";
import { UserRoutes } from "../components/users/route.js";
import { RoleRoutes } from "../components/roles/route.js";
import { ProjectRoutes } from "../components/projects/route.js";
import { TaskRoutes } from "../components/tasks/route.js";
import { CommentRoutes } from "../components/comments/route.js";
import { FileRoutes } from "../components/files/route.js";

export class Routes {
  public router: Router;

  constructor(app: Express) {
    const routeClasses = [
      UserRoutes,
      RoleRoutes,
      ProjectRoutes,
      TaskRoutes,
      CommentRoutes,
      FileRoutes,
    ];

    for (const routeClass of routeClasses) {
      try {
        new routeClass(app);
        console.log(`router: ${routeClass.name} connected`);
      } catch (err) {
        console.log(`router: ${routeClass.name} failed`);
      }
    }
  }
}
