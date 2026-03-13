import type { Job } from "bull";
import {
  Notifications,
  type NotificationChannel,
} from "../components/notifications/entity.js";
import { notificationQueue } from "../utils/queue_utils.js";
import { ConnectDatabase } from "../utils/db_utils.js";
import { emitToUser } from "../utils/socket_utils.js";

export interface NotificationJobData {
  userId: string;
  title: string;
  message: string;
  actionUrl?: string;
  channels: NotificationChannel[];
}

export const setupNotificationWorker = () => {
  notificationQueue.process(async (job: Job<NotificationJobData>) => {
    const { userId, title, message, actionUrl, channels } = job.data;

    try {
      if (channels.includes("IN_APP")) {
        const db = await ConnectDatabase.getInstance();
        const notificationRepo = db.getRepo(Notifications);

        if (notificationRepo) {
          const notification = notificationRepo.create({
            user_id: userId,
            title,
            message,
            action_url: actionUrl,
          });

          await notificationRepo.save(notification);
          console.log(`saved In-App notification for user ${userId}`);
        }
      }

      if (channels.includes("REALTIME")) {
        const sent = emitToUser(userId, {
          event: "new_notification",
          data: {
            title,
            message,
            actionUrl,
          },
        });
        if (!sent) {
          console.log(`user ${userId} is offline, skipped realtime push`);
        }
      }
    } catch (error) {
      console.error(`error processing notification job:`, error);
      throw error;
    }
  });

  console.log("Notification Worker Initialized");
};
