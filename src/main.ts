import cluster from "cluster";
import { ExpressServer } from "./express_server.js";
import { ConnectDatabase } from "./utils/db_utils.js";


const server = new ExpressServer();

new ConnectDatabase();

process.on("uncaughtException", (error: Error) => {
  console.error(`uncaught exception in worker process ${process.pid}: `, error);

  server.closeServer();

  setTimeout(() => {
    cluster.fork();
    cluster.worker?.disconnect();
  }, 1000);

  process.on("SIGINT", () => {
    console.log("Received SIGINT signal");
    server.closeServer();
  });
  process.on("SIGTERM", () => {
    console.log("Received SIGTERM signal");
    server.closeServer();
  })
});