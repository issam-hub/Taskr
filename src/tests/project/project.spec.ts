import * as chai from "chai";
import { default as chaiHttp, request } from "chai-http";
import { describe, it, afterEach, beforeEach } from "mocha";
import sinon from "sinon";
import { app } from "../common/utility.spec.js";
import { ProjectsService } from "../../components/projects/service.js";
import { UsersUtil } from "../../components/users/controller.js";
import { RolesUtil } from "../../components/roles/controller.js";
import { NotificationUtils } from "../../utils/notification_utils.js";
import { CacheUtil } from "../../utils/cache_utils.js";
import jwt from "jsonwebtoken";

chai.use(chaiHttp);
const expect = chai.expect;

describe("Projects API", () => {
  let verifyStub: sinon.SinonStub;
  let getUserStub: sinon.SinonStub;
  let getRightsStub: sinon.SinonStub;

  beforeEach(() => {
    // Stub JWT verify to bypass authentication token validation
    verifyStub = sinon
      .stub(jwt, "verify")
      .callsFake((token: any, secret: any, callback?: any) => {
        const decoded = {
          user_id: "test-user-id",
          username: "testuser",
          email: "test@example.com",
        };
        if (typeof callback === "function") {
          callback(null, decoded);
        }
        return decoded;
      });

    // Mock UsersUtil.getUserFromUsername to return a dummy user with a role
    getUserStub = sinon.stub(UsersUtil, "getUserFromUsername").resolves({
      user_id: "test-user-id",
      username: "testuser",
      role_id: "test-role-id",
    } as any);

    // Mock RolesUtil.getAllRightsFromRole to return a dummy rights array
    // We provide some common permissions to ensure authorization passes
    getRightsStub = sinon
      .stub(RolesUtil, "getAllRightsFromRole")
      .resolves([
        "add_project",
        "get_all_projects",
        "delete_project",
        "edit_project",
        "get_details_project",
      ]);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("List projects", () => {
    it("should return array of projects with status code 200", (done) => {
      const findAllStub = sinon
        .stub(ProjectsService.prototype, "findAll")
        .resolves({
          statusCode: 200,
          status: "success",
          data: [
            {
              project_id: "1",
              name: "Project 1",
              description: "Test description",
              user_ids: ["u1", "u2"],
              start_time: new Date(),
              end_time: new Date(),
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
        });

      const getUsernamesStub = sinon
        .stub(UsersUtil, "getUsernamesByID")
        .resolves([
          { user_id: "u1", username: "user1" },
          { user_id: "u2", username: "user2" },
        ]);

      request
        .execute(app)
        .get("/api/projects")
        .set("Authorization", "Bearer dummy-token")
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.data).to.be.an("array");
          expect(res.body.data[0]).to.have.property("users");
          expect(findAllStub.calledOnce).to.be.true;
          expect(getUsernamesStub.calledOnce).to.be.true;
          done();
        });
    });

    it("should handle missing data gracefully and return 200", (done) => {
      const findAllStub = sinon
        .stub(ProjectsService.prototype, "findAll")
        .resolves({
          statusCode: 200,
          status: "success",
          data: [],
        });

      // Not expected to be called since data is empty array (or behaves similarly)
      const getUsernamesStub = sinon
        .stub(UsersUtil, "getUsernamesByID")
        .resolves([]);

      request
        .execute(app)
        .get("/api/projects")
        .set("Authorization", "Bearer dummy-token")
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.data).to.be.an("array");
          expect(findAllStub.calledOnce).to.be.true;
          done();
        });
    });
  });

  describe("ADD project", () => {
    it("should successfully add a project and return 201", (done) => {
      const checkValidUserIDsStub = sinon
        .stub(UsersUtil, "checkValidUserIDs")
        .resolves(true);
      const createStub = sinon
        .stub(ProjectsService.prototype, "create")
        .resolves({
          statusCode: 201,
          status: "success",
          data: {
            project_id: "p1",
            name: "New Project",
            description: "Test project",
            user_ids: ["u1"],
            start_time: new Date("2099-01-01 10:00:00"),
            end_time: new Date("2099-01-01 12:00:00"),
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
      const notificationStub = sinon.stub(NotificationUtils, "send").resolves();

      request
        .execute(app)
        .post("/api/projects")
        .set("Authorization", "Bearer dummy-token")
        .send({
          name: "New Project",
          description: "Test project",
          user_ids: ["u1"],
          start_time: "2099-01-01 10:00:00",
          end_time: "2099-01-01 12:00:00",
        })
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body.status).to.equal("success");
          expect(checkValidUserIDsStub.calledOnce).to.be.true;
          expect(createStub.calledOnce).to.be.true;
          expect(notificationStub.calledOnce).to.be.true;
          done();
        });
    });

    it("should return 400 when invalid user_ids are provided", (done) => {
      const checkValidUserIDsStub = sinon
        .stub(UsersUtil, "checkValidUserIDs")
        .resolves(false);
      const createStub = sinon.stub(ProjectsService.prototype, "create");
      const notificationStub = sinon.stub(NotificationUtils, "send");

      request
        .execute(app)
        .post("/api/projects")
        .set("Authorization", "Bearer dummy-token")
        .send({
          name: "New Project",
          description: "Test project",
          user_ids: ["invalid-u2"],
          start_time: "2099-01-01 10:00:00",
          end_time: "2099-01-01 12:00:00",
        })
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(checkValidUserIDsStub.calledOnce).to.be.true;
          expect(createStub.called).to.be.false;
          expect(notificationStub.called).to.be.false;
          done();
        });
    });
  });
  describe("GET one project", () => {
    it("should successfully return the project with status code 200 (cache miss)", (done) => {
      const getCacheStub = sinon.stub(CacheUtil, "get").resolves(null);
      const setCacheStub = sinon.stub(CacheUtil, "set").resolves();

      const getOneStub = sinon
        .stub(ProjectsService.prototype, "findOne")
        .resolves({
          statusCode: 200,
          status: "success",
          data: {
            project_id: "1",
            name: "Project 1",
            description: "Test description",
            start_time: new Date(),
            end_time: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
          },
        } as any & {
          users: [
            { user_id: "u1"; username: "user1" },
            { user_id: "u2"; username: "user2" },
          ];
        });

      const getUsernamesStub = sinon
        .stub(UsersUtil, "getUsernamesByID")
        .resolves([
          { user_id: "u1", username: "user1" },
          { user_id: "u2", username: "user2" },
        ]);

      request
        .execute(app)
        .get("/api/projects/1")
        .set("Authorization", "Bearer dummy-token")
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.data).has.property("project_id").equals("1");
          expect(getCacheStub.calledOnce).to.be.true;
          expect(getOneStub.calledOnce).to.be.true;
          expect(setCacheStub.calledOnce).to.be.true;
          expect(getUsernamesStub.calledOnce).to.be.true;
          done();
        });
    });
    it("should successfully return the project with status code 200 (cache hit)", (done) => {
      const getCacheStub = sinon.stub(CacheUtil, "get").resolves({
        project_id: "1",
        name: "Project 1",
        description: "Test description",
        user_ids: ["u1", "u2"],
        start_time: new Date(),
        end_time: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      });

      request
        .execute(app)
        .get("/api/projects/1")
        .set("Authorization", "Bearer dummy-token")
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(getCacheStub.calledOnce).to.be.true;
          expect(res.body.data).has.property("project_id").equals("1");
          done();
        });
    });
    it("should return 404 when invalid project id is provided", (done) => {
      const getOneStub = sinon
        .stub(ProjectsService.prototype, "findOne")
        .resolves({ statusCode: 404, status: "error", message: "not found" });

      request
        .execute(app)
        .delete(`/api/projects/99`)
        .set("Authorization", "Bearer dummy-token")
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(getOneStub.calledOnce).to.be.true;
          done();
        });
    });
  });

  describe("DELETE project", () => {
    it("should successfully delete project with status code 200", (done) => {
      const deleteStub = sinon
        .stub(ProjectsService.prototype, "delete")
        .resolves({
          statusCode: 200,
          status: "success",
        });

      request
        .execute(app)
        .delete(`/api/projects/1`)
        .set("Authorization", "Bearer dummy-token")
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(deleteStub.calledOnce).to.be.true;
          done();
        });
    });
    it("should return status code 404 when project not found", (done) => {
      const deleteStub = sinon
        .stub(ProjectsService.prototype, "delete")
        .resolves({ statusCode: 404, status: "error", message: "not found" });

      request
        .execute(app)
        .delete(`/api/projects/1`)
        .set("Authorization", "Bearer dummy-token")
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(deleteStub.calledOnce).to.be.true;
          done();
        });
    });
  });
  describe("UPDATE project", () => {
    it("should successfully update the project with status code 200", (done) => {
      const updateStub = sinon
        .stub(ProjectsService.prototype, "update")
        .resolves({
          statusCode: 200,
          status: "success",
          data: {
            project_id: "1",
            name: "New project name",
            description: "Test description",
            user_ids: ["u1", "u2"],
            start_time: new Date(),
            end_time: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
          },
        });

      request
        .execute(app)
        .patch("/api/projects/1")
        .set("Authorization", "Bearer dummy-token")
        .send({ name: "New project name" })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.status).to.equal("success");
          expect(updateStub.calledOnce).to.be.true;
          done();
        });
    });

    it("should return 400 when invalid data are provided", (done) => {
      const updateStub = sinon
        .stub(ProjectsService.prototype, "update")
        .resolves({
          statusCode: 400,
          status: "error",
          message: "Invalid data",
        });

      request
        .execute(app)
        .patch("/api/projects/1")
        .set("Authorization", "Bearer dummy-token")
        .send({ name: "" })
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body.status).to.equal("error");
          expect(res.body.message).to.equal("Invalid data");
          expect(updateStub.calledOnce).to.be.true;
          done();
        });
    });
  });
});
