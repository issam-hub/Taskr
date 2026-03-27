import express from "express";
import { createServer } from "http";
import { loadEnvFile } from "process";
import { Routes } from "./routes/index.js";

export class ExpressServer {
  private static server;
  private static httpServer;
  public app;

  constructor() {
    try {
      loadEnvFile();
    } catch (error) {
      console.log("No .env file found");
    }

    const port = process.env.PORT ?? 3000;

    this.app = express();

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    this.app.get("/ping", (req, res) => {
      res.send("pong");
    });

    const routes = new Routes(this.app);

    if (routes) {
      console.log("server routes has been started");
    }

    ExpressServer.httpServer = createServer(this.app);

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
    });
  }
}
