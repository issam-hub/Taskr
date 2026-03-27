import * as chai from "chai";
import { default as chaiHttp, request } from "chai-http";

chai.use(chaiHttp);

import { describe, it } from "mocha";
const expect = chai.expect;
import { app } from "../common/utility.spec.js";
let authToken, testUserID;

describe("login API", () => {
  it("should return a success message when login is successful", (done) => {
    request
      .execute(app)
      .post("/api/login")
      .send({ email: "default@example.com", password: "Password1234#" }) // this is a user that exists in my current db, so it's changable
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property("status").equal("success");
        authToken = res.body.data.accessToken;
        done();
      });
  });

  it("should return an error message when login fails", (done) => {
    request
      .execute(app)
      .post("/api/login")
      .send({ email: "default@example.com", password: "wrongPassword" })
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body)
          .to.have.property("message")
          .equal("password is invalid");
        done();
      });
  });
});

describe("GET list of users", () => {
  it("should return array with status code 200", (done) => {
    request
      .execute(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${authToken}`)
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.data).to.be.an("array");
        done();
      });
  });
});

describe("ADD user", () => {
  it("should return with status code 201", (done) => {
    request
      .execute(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        fullname: "test user",
        username: "testUser",
        email: "testuser@example.com",
        password: "Password1234#",
        role_id: "d2493f5b-e3b7-4c88-a944-69afc3af57d7", // this is a role that exists in my db, so it's changable
      })
      .end((err, res) => {
        expect(res).to.have.status(201);
        testUserID = res.body.data.user_id;
        done();
      });
  });
  it("should return with status code 409", (done) => {
    request
      .execute(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        fullname: "test user",
        username: "testUser",
        email: "testuser@example.com",
        password: "Password1234#",
        role_id: "d2493f5b-e3b7-4c88-a944-69afc3af57d7",
      })
      .end((err, res) => {
        expect(res).to.have.status(409);
        expect(res.body)
          .to.have.property("message")
          .equal("Key (username)=(testuser) already exists.");
        done();
      });
  });
});

describe("DELETE user", () => {
  it("should return with status code 200", (done) => {
    request
      .execute(app)
      .delete(`/api/users/${testUserID}`)
      .set("Authorization", `Bearer ${authToken}`)
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });
  it("should return with status code 404", (done) => {
    request
      .execute(app)
      .delete(`/api/users/${testUserID}`)
      .set("Authorization", `Bearer ${authToken}`)
      .end((err, res) => {
        expect(res).to.have.status(404);
        done();
      });
  });
});

export { authToken };
