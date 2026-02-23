import type { Express } from "express";
import { CommentController } from "./controller.js";

export class CommentRoutes {
    private basePoint = '/api/comments';
    constructor(app: Express){
        const controller = new CommentController();

        app.route(this.basePoint)
        .post(controller.addHandler)
        .get(controller.getAllHandler)

        app.route(this.basePoint + "/:id")
        .delete(controller.deleteHandler)
        .patch(controller.updateHandler)
        .get(controller.getDetailsHandler)
    }
}