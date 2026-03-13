import { loadEnvFile } from "process";
import * as redis from "redis";

loadEnvFile();

export class CacheUtil {
  private static client = redis.createClient({
    url: process.env.REDIS_URL as string,
  });
  constructor() {
    CacheUtil.client.connect();
  }
  public static async get(cacheName: string, key: string) {
    try {
      const data = await CacheUtil.client.json.get(`${cacheName}:${key}`);
      return data;
    } catch (err: any) {
      console.error("error getting cache: ", err);
      return null;
    }
  }
  public static async set(cacheName: string, key: string, value) {
    try {
      await CacheUtil.client.json.set(`${cacheName}:${key}`, ".", value);
    } catch (err: any) {
      console.error("error setting cache: ", err);
    }
  }
  public static async remove(cacheName: string, key: string) {
    try {
      await CacheUtil.client.del(`${cacheName}:${key}`);
    } catch (err) {
      console.error(`error deleting cache: ${err}`);
    }
  }
}
