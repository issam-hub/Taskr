import Queue from "bull";
import { loadEnvFile } from "process";

loadEnvFile();

export const notificationQueue = new Queue(
  "notifications",
  process.env.REDIS_URL as string,
);

notificationQueue.on("error", (error) => {
  console.error("Bull Notification Queue Error:", error);
});

notificationQueue.on("failed", (job, err) => {
  console.error(`Job [${job.id}] failed with error:`, err.message);
});
