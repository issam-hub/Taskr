import type { Express } from "express";
import { RoleController } from "./controller.js";

export class RoleRoutes {
    private basePoint = '/api/roles';
    constructor(app: Express){
        const controller = new RoleController();

        app.route(this.basePoint)
        .post(controller.addHandler)
        .get(controller.getAllHandler)

        app.route(this.basePoint + "/:id")
        .delete(controller.deleteHandler)
        .patch(controller.updateHandler)
        .get(controller.getDetailsHandler)
    }
}