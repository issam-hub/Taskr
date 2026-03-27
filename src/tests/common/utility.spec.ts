import * as chai from "chai";
import chaiHttp from "chai-http";
import { ConnectDatabase } from "../../utils/db_utils.js";
import { ExpressServer } from "../../express_server.js";
import type { Express } from "express";
import { CacheUtil } from "../../utils/cache_utils.js";

chai.use(chaiHttp);

import { before, describe, it } from "mocha";
let app: Express;
let expressServer: ExpressServer;
before(async () => {
  const dbUtil = new ConnectDatabase();
  await dbUtil.connect();
  new CacheUtil();
  expressServer = new ExpressServer();
  app = expressServer.app;
});

after((done) => {
  expressServer.closeServer();
  done();
  process.exit(0);
});

export { app };
