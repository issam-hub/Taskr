import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { SERVER_CONST } from "./common.js";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

let io: Server;

export const initSocket = async (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  try {
    const pubClient = createClient({ url: process.env.REDIS_URL as string });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    console.log("Socket.io Redis adapter connected");
  } catch (err) {
    console.error("Socket.io Redis adapter failed to connect:", err);
  }

  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;

    if (!token) {
      return next(new Error("missing authorization token"));
    }

    try {
      const decoded = jwt.verify(token, SERVER_CONST.JWTSECRET);
      socket.data.userId = decoded["user_id"];
      socket.data.username = decoded["username"];
      next();
    } catch (error) {
      return next(new Error("invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;

    socket.join(userId);

    console.log(
      `user ${socket.data.username} connected (socket: ${socket.id}, worker: ${process.pid})`,
    );

    socket.on("disconnect", () => {
      console.log(
        `user ${socket.data.username} disconnected (socket: ${socket.id})`,
      );
    });
  });

  console.log("Socket.io initialized on worker", process.pid);
};

export const emitToUser = (
  userId: string,
  payload: { event: string; data: any },
) => {
  if (!io) {
    console.error("emitToUser called before Socket.io was initialized");
    return false;
  }

  io.to(userId).emit(payload.event, payload.data);

  console.log(
    `emitted "${payload.event}" to room/user ${userId} from worker ${process.pid}`,
  );
  return true;
};

export const getIO = () => io;
