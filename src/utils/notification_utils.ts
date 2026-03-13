import { notificationQueue } from "./queue_utils.js";
import type { NotificationChannel } from "../components/notifications/entity.js";

export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  actionUrl?: string;
  channels: NotificationChannel[];
}

export class NotificationUtils {
  static async send(payload: NotificationPayload) {
    try {
      await notificationQueue.add(payload, {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
      });
      console.log(`queued notification job for user ${payload.userId}`);
    } catch (error) {
      console.error(
        `failed to enqueue notification for user ${payload.userId}`,
        error,
      );
    }
  }
}
