import "express";

declare module "express" {
  interface Request {
    user?: {
      username?: string;
      email?: string;
      rights?: string[];
      user_id?: string;
    };
  }
}
