import request from "supertest";
import { app } from "../../server.js";
import testSequelize from "../../config/testDb.js";
import redisClient from "../../config/redisDb.js";
import { sequelize } from "../../config/db.js";

// Mock redis client methods to prevent ClientClosedError in tests
redisClient.set = async () => "OK";
redisClient.get = async () => null;
redisClient.del = async () => 1;
redisClient.connect = async () => {};

describe("Consistent Error Handling & Health Endpoints", () => {
  beforeEach(async () => {
    await testSequelize.sync({ force: true });
  });

  test("GET /api/health/server should return 200 and running status", async () => {
    const res = await request(app)
      .get("/api/health/server")
      .expect(200);

    expect(res.body).toMatchObject({
      ok: true,
      message: "Server is running",
    });
  });

  test("GET /api/health/db should return 200 when database is active", async () => {
    const res = await request(app)
      .get("/api/health/db")
      .expect(200);

    expect(res.text).toBe("Database active and running.");
  });

  test("GET /api/health/db should return 503 if database authenticate fails", async () => {
    // Force sequelize.authenticate to reject
    const originalAuthenticate = sequelize.authenticate;
    sequelize.authenticate = async () => {
      throw new Error("DB Connection Down");
    };

    const res = await request(app)
      .get("/api/health/db")
      .expect(503);

    expect(res.text).toBe("Database inactive and down.");

    // Restore original function
    sequelize.authenticate = originalAuthenticate;
  });

  test("POST /api/requests/seed/archive without auth should return 401 Unauthorized", async () => {
    const res = await request(app)
      .post("/api/requests/seed/archive")
      .expect(401);

    expect(res.body).toMatchObject({
      error: "Unauthorized",
    });
  });
});
