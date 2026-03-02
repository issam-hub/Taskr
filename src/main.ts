import cluster from "cluster";
import { ExpressServer } from "./express_server.js";
import { ConnectDatabase } from "./utils/db_utils.js";
import { DefaultUtils } from "./utils/default_utils.js";
import os from "os";
const numCPUs = os.cpus().length;
const workerCount = process.env.NODE_ENV === "production" ? numCPUs : 2;

const args = process.argv.slice(2);

if (cluster.isPrimary) {
  console.log("master process PID: ", process.pid);
  if (args.length > 0 && args[0] === "--init") {
    (async () => {
      await ConnectDatabase.getInstance();
      await DefaultUtils.addDefaultRole();
      await DefaultUtils.addDefaultUser();
      process.exit();
    })();
  } else {
    for (let i = 0; i < workerCount; i++) {
      cluster.fork();
    }
    cluster.on("exit", (worker, code, signal) => {
      console.log(
        `worker process ${worker.process.pid} exited with code ${code} and signal ${signal}`,
      );
      setTimeout(() => {
        cluster.fork();
      }, 1000);
    });
  }
} else {
  const server = new ExpressServer();

  new ConnectDatabase();

  process.on("uncaughtException", (error: Error) => {
    console.error(
      `uncaught exception in worker process ${process.pid}: `,
      error,
    );

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
    });
  });
}
