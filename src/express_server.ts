import express from "express";
import { createServer } from "http";
import { loadEnvFile } from "process";
import { Routes } from "./routes/index.js";

export class ExpressServer {
  private static server;
  private static httpServer;

  constructor() {
    try {
      loadEnvFile();
    } catch (error) {
      console.log("No .env file found");
    }

    const port = process.env.PORT ?? 3000;

    const app = express();

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.get("/ping", (req, res) => {
      res.send("pong");
    });

    const routes = new Routes(app);

    if (routes) {
      console.log("server routes has been started");
    }

    ExpressServer.httpServer = createServer(app);

    ExpressServer.httpServer.listen(port, () => {
      console.log(`server running on port :${port} with pid ${process.pid}`);
    });

    ExpressServer.server = ExpressServer.httpServer;
  }

  public static getHttpServer() {
    return ExpressServer.httpServer;
  }

  public closeServer(): void {
    ExpressServer.server.close(() => {
      console.log(`server closed`);
      process.exit(0);
    });
  }
}
