import request from "supertest";
import fs from "fs";
import { User } from "../../models/user.model.js";
import { app } from "../../server.js";
import { PUBLIC_PATH } from "../../config/paths.js";
import testSequelize from "../../config/testDb.js";
import redisClient from "../../config/redisDb.js";

// Mock redis client methods to prevent ClientClosedError in tests
redisClient.set = async () => "OK";
redisClient.get = async () => null;
redisClient.del = async () => 1;
redisClient.connect = async () => {};

// Recreate tables and add data
beforeEach(async () => {
  await testSequelize.sync({ force: true });

  // valid user
  await User.create({
    id: "d854dd15-b02a-4cf2-872a-da0e9a8f0d51",
    username: "test",
    email: "test@g.com",
    password: "Password18!",
  });
});

afterAll(async () => {
  // Delete all uploadPfp files
  const filenames = fs.readdirSync(PUBLIC_PATH);

  filenames.forEach((file) => {
    if (file.startsWith("test.")) {
      fs.unlinkSync(`${PUBLIC_PATH}/${file}`);
    }
  });

  await testSequelize.close();
  // FIXME: move all deletion of uploaded test files up here if needed.
});

// Register Tests

describe("POST /api/user/register", () => {
  test("HTTP 400 when validation error on signup.", async () => {
    const user = {
      username: "newTest",
      email: "newTest@g.com",
      password: "password",
    };
    const res = await request(app)
      .post("/api/user/register")
      .send(user)
      .set("Accept", "application/json");

    expect(res.status).toBe(400);
  });
});

describe("POST /api/user/register", () => {
  test("HTTP 200 when valid signup.", async () => {
    const user = {
      username: "newTest",
      email: "newTest@g.com",
      password: "Password10!",
    };
    const res = await request(app)
      .post("/api/user/register")
      .send(user)
      .set("Accept", "application/json");

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      username: "newTest",
      email: "newTest@g.com",
    });
  });
});

// Login Tests
describe("POST /api/user/login", () => {
  test("HTTP 200 and session set for valid login.", async () => {
    const res = await request(app).post("/api/user/login").send({
      email: "test@g.com",
      password: "Password18!",
    });

    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"]).toBeDefined();
  });
});

describe("GET /api/user/auth (session_auth)", () => {
  test("HTTP 200 and user data set.", async () => {
    // login user to set session
    const loginRes = await request(app).post("/api/user/login").send({
      email: "test@g.com",
      password: "Password18!",
    });

    // auth endpoint with session
    const cookie = loginRes.headers["set-cookie"];

    const res = await request(app)
      .post("/api/user/auth")
      .set("Cookie", cookie)
      .set("Accept", "application/json");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("user");
    expect(res.body.user).toMatchObject({
      userId: "d854dd15-b02a-4cf2-872a-da0e9a8f0d51",
      username: "test",
      email: "test@g.com",
      profileImg: expect.any(String),
    });
  });
});

describe("GET /api/user/:id", () => {
  test("HTTP 200 when user exists.", async () => {
    const res = await request(app).get(
      "/api/user/d854dd15-b02a-4cf2-872a-da0e9a8f0d51"
    );

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      userId: "d854dd15-b02a-4cf2-872a-da0e9a8f0d51",
      username: "test",
      email: "test@g.com",
    });
  });
});

describe("POST /api/user/uploadPfp", () => {
  test("HTTP 200 if valid pfp photo upload.", async () => {
    const agent = request.agent(app);

    // login user to set session
    const loginRes = await agent.post("/api/user/login").send({
      email: "test@g.com",
      password: "Password18!",
    });

    const imgFilePath = PUBLIC_PATH + "/default.jpg";
    const fileBuffer = fs.readFileSync(imgFilePath);

    const res = await agent
      .post("/api/user/uploadPfp")
      .attach("pfp", fileBuffer, "test-image.jpg")
      .expect(201);

    expect(res.body).toMatchObject({
      message: "Profile picture uploaded",
      imageUrl: expect.stringContaining(".jpg"),
    });

    const uploadedImgPath = `${PUBLIC_PATH}/${res.body.imageUrl}`;

    const updatedUser = await User.findByPk(
      "d854dd15-b02a-4cf2-872a-da0e9a8f0d51"
    );

    expect(updatedUser?.image).not.toBe("default.jpg");
    expect(updatedUser?.image).toBe(res.body.imageUrl);

    // prepend file with "test.{filename}" for easy cleanup
    const imgTestName = `test.${res.body.imageUrl}`;
    fs.renameSync(
      `${PUBLIC_PATH}/${res.body.imageUrl}`,
      `${PUBLIC_PATH}/${imgTestName}`
    );
  });
});
