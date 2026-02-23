import type { Express } from "express";
import { ProjectController } from "./controller.js";

export class ProjectRoutes {
    private basePoint = '/api/projects';
    constructor(app: Express){
        const controller = new ProjectController();

        app.route(this.basePoint)
        .post(controller.addHandler)
        .get(controller.getAllHandler)

        app.route(this.basePoint + "/:id")
        .delete(controller.deleteHandler)
        .patch(controller.updateHandler)
        .get(controller.getDetailsHandler)
    }
}