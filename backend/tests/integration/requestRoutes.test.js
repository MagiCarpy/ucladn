import request from "supertest";
import { app } from "../../server.js";
import testSequelize from "../../config/testDb.js";
import redisClient from "../../config/redisDb.js";

// Mock redis client methods to prevent ClientClosedError in tests
redisClient.set = async () => "OK";
redisClient.get = async () => null;
redisClient.del = async () => 1;
redisClient.connect = async () => {};
import crypto from "crypto";

import { User } from "../../models/user.model.js";
import { Request } from "../../models/request.model.js";
import { ArchivedRequest } from "../../models/archivedRequest.model.js";

// just giving ourselves two users to work with
const uid1 = crypto.randomUUID();
const uid2 = crypto.randomUUID();

// fresh DB before every test
beforeEach(
  async () => {
  await testSequelize.sync({ force: true });
  await User.create({
    id: uid1,
    username: "req",
    email: "req@g.com",
    password: "Aa1!aaaaaa",
  });
  await User.create({
    id: uid2,
    username: "helper",
    email: "helper@g.com",
    password: "Aa1!aaaaaa",
  });
});

// shut down connection after all tests
afterAll(async () => {
  await testSequelize.close();
});

// helper function for quick logins
function login(email) {
  return request(app).post("/api/user/login").send({
    email,
    password: "Aa1!aaaaaa",
  });
}

async function getTestCookies() {
  const requesterLogin = await login("req@g.com");
  const helperLogin = await login("helper@g.com");

  return {
    requesterId: uid1,
    helperId: uid2,
    requesterCookie: requesterLogin.headers["set-cookie"],
    helperCookie: helperLogin.headers["set-cookie"],
  };
}

async function seedAndLogin() {
  return await getTestCookies();
}


// make sure users can actually create requests when logged in

describe("POST /api/requests", () => {
  test("HTTP 201 — creates request successfully", async () => {
    const loginRes = await login("req@g.com");
    const cookie = loginRes.headers["set-cookie"];
    const payload = {
      item: "Milk",
      pickupLocation: "A",
      dropoffLocation: "B",
      pickupLat: 1,
      pickupLng: 2,
      dropoffLat: 3,
      dropoffLng: 4,
    };
    const res = await request(app)
      .post("/api/requests")
      .set("Cookie", cookie)
      .send(payload);
    expect(res.status).toBe(201);
    expect(res.body.request.item).toBe("Milk");
  });
  test("HTTP 400 — missing fields", async () => {
    const loginRes = await login("req@g.com");
    const cookie = loginRes.headers["set-cookie"];
    const res = await request(app)
      .post("/api/requests")
      .set("Cookie", cookie)
      .send({ item: "" });
    expect(res.status).toBe(400);
  });
  test("HTTP 401 — not logged in", async () => {
    const res = await request(app).post("/api/requests").send({});
    expect(res.status).toBe(401);
  });
});

// fetch the full list of open requests

describe("GET /api/requests", () => {
  test("HTTP 200 — returns array", async () => {
    const res = await request(app).get("/api/requests");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.requests)).toBe(true);
  });
});

// pull a specific request by ID

describe("GET /api/requests/:id", () => {
  test("HTTP 200 — found", async () => {
    const requestId = crypto.randomUUID();
    await Request.create({
      id: requestId,
      userId: uid1,
      item: "Bananas",
      pickupLocation: "X",
      dropoffLocation: "Y",
    });
    const res = await request(app).get(`/api/requests/${requestId}`);
    expect(res.status).toBe(200);
    expect(res.body.request.item).toBe("Bananas");
  });
  test("HTTP 404 — missing", async () => {
    const missing = crypto.randomUUID();
    const res = await request(app).get(`/api/requests/${missing}`);
    expect(res.status).toBe(404);
  });
});

// let a helper accept someone else’s request

describe("POST /api/requests/:id/accept", () => {
  test("HTTP 200 — helper accepts request", async () => {
    const requestId = crypto.randomUUID();
    await Request.create({
      id: requestId,
      userId: uid1,
      item: "Pizza",
      pickupLocation: "Dorm",
      dropoffLocation: "Library",
    });
    const loginRes = await login("helper@g.com");
    const cookie = loginRes.headers["set-cookie"];
    const res = await request(app)
      .post(`/api/requests/${requestId}/accept`)
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.request.status).toBe("accepted");
    expect(res.body.request.helperId).toBe(uid2);
  });
  test("HTTP 400 — cannot accept your own request", async () => {
    const requestId = crypto.randomUUID();
    await Request.create({
      id: requestId,
      userId: uid1,
      item: "Pizza",
      pickupLocation: "Dorm",
      dropoffLocation: "Library",
    });
    const loginRes = await login("req@g.com");
    const cookie = loginRes.headers["set-cookie"];
    const res = await request(app)
      .post(`/api/requests/${requestId}/accept`)
      .set("Cookie", cookie);

    expect(res.status).toBe(400);
  });
});

// when helper cancels a delivery, request should reopen cleanly

describe("POST /api/requests/:id/cancel", () => {
  test("HTTP 200 — helper cancels and reopens", async () => {
    const requestId = crypto.randomUUID();
    await Request.create({
      id: requestId,
      userId: uid1,
      helperId: uid2,
      status: "accepted",
      item: "Book",
      pickupLocation: "Dorm",
      dropoffLocation: "Gym",
    });
    const loginRes = await login("helper@g.com");
    const cookie = loginRes.headers["set-cookie"];
    const res = await request(app)
      .post(`/api/requests/${requestId}/cancel-delivery`)
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.request.status).toBe("open");
    expect(res.body.request.helperId).toBe(null);
  });
});

// requester confirms delivery was successful, should archive + remove active request

describe("POST /api/requests/:id/confirm", () => {
  test("HTTP 200 — receiver confirms received", async () => {
    const requestId = crypto.randomUUID();
    await Request.create({
      id: requestId,
      userId: uid1,
      helperId: uid2,
      status: "completed",
      item: "Gum",
      pickupLocation: "A",
      dropoffLocation: "B",
      deliveryPhotoUrl: "/uploads/test.jpg",
    });
    const loginRes = await login("req@g.com");
    const cookie = loginRes.headers["set-cookie"];
    const res = await request(app)
      .post(`/api/requests/${requestId}/confirm-received`)
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    const archived = await ArchivedRequest.findOne();
    expect(archived).not.toBeNull();
    const active = await Request.findByPk(requestId);
    expect(active).toBeNull();
  });

  test("HTTP 200 — receiver says NOT received (reopens)", async () => {
    const requestId = crypto.randomUUID();
    await Request.create({
      id: requestId,
      userId: uid1,
      helperId: uid2,
      status: "completed",
      item: "Soda",
      pickupLocation: "A",
      dropoffLocation: "B",
      deliveryPhotoUrl: "/p.jpg",
    });
    const loginRes = await login("req@g.com");
    const cookie = loginRes.headers["set-cookie"];
    const res = await request(app)
      .post(`/api/requests/${requestId}/confirm-not-received`)
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.request.status).toBe("open");
    expect(res.body.request.helperId).toBe(null);
  });
});

// requester removes their own request entirely

describe("DELETE /api/requests/:id", () => {
  test("HTTP 200 — deletes user’s own request", async () => {
    const requestId = crypto.randomUUID();
    await Request.create({
      id: requestId,
      userId: uid1,
      item: "Phone",
      pickupLocation: "X",
      dropoffLocation: "Y",
    });
    const loginRes = await login("req@g.com");
    const cookie = loginRes.headers["set-cookie"];
    const res = await request(app)
      .delete(`/api/requests/${requestId}`)
      .set("Cookie", cookie);

    expect(res.status).toBe(200);

    const check = await Request.findByPk(requestId);
    expect(check).toBeNull();
  });
});

// trying to accept a request that's already accepted should fail
test("HTTP 400 — can't accept a non-open request", async () => {
  const { requesterCookie, helperCookie, requesterId, helperId } = await seedAndLogin();

  const reqid = crypto.randomUUID();
  await Request.create({
    id: reqid,
    userId: requesterId,
    helperId: helperId,
    status: "accepted",
    item: "Water",
    pickupLocation: "Dorm",
    dropoffLocation: "Gym",
  });

  const res = await request(app)
    .post(`/api/requests/${reqid}/accept`)
    .set("Cookie", helperCookie);

  expect(res.status).toBe(400);
});

// requester shouldn't be able to cancel — only the helper can back out
test("HTTP 403 — requester can't cancel delivery", async () => {
  const { requesterCookie, helperCookie, requesterId, helperId } = await seedAndLogin();

  const reqid = crypto.randomUUID();
  await Request.create({
    id: reqid,
    userId: requesterId,
    helperId: helperId,
    status: "accepted",
    item: "Laptop",
    pickupLocation: "Library",
    dropoffLocation: "Cafe",
  });

  const res = await request(app)
    .post(`/api/requests/${reqid}/cancel-delivery`)
    .set("Cookie", requesterCookie);

  expect(res.status).toBe(403);
});

// helper shouldn't be able to confirm delivery — that's the receiver's job
test("HTTP 403 — helper can't confirm received", async () => {
  const { requesterCookie, helperCookie, requesterId, helperId } = await seedAndLogin();

  const reqid = crypto.randomUUID();
  await Request.create({
    id: reqid,
    userId: requesterId,
    helperId,
    status: "completed",
    item: "Food",
    pickupLocation: "Store",
    dropoffLocation: "Dorm",
    deliveryPhotoUrl: "photo.jpg"
  });

  const res = await request(app)
    .post(`/api/requests/${reqid}/confirm-received`)
    .set("Cookie", helperCookie);

  expect(res.status).toBe(403);
});

// canceling should reset deliveryPhotoUrl back to null
test("HTTP 200 — canceling wipes delivery photo", async () => {
  const { helperCookie, requesterId, helperId } = await seedAndLogin();

  const reqid = crypto.randomUUID();
  await Request.create({
    id: reqid,
    userId: requesterId,
    helperId,
    status: "accepted",
    item: "Groceries",
    pickupLocation: "Market",
    dropoffLocation: "Dorm",
    deliveryPhotoUrl: "proof.png"
  });

  const res = await request(app)
    .post(`/api/requests/${reqid}/cancel-delivery`)
    .set("Cookie", helperCookie);

  expect(res.status).toBe(200);
  expect(res.body.request.deliveryPhotoUrl).toBe(null);
});

// confirming received should archive the full request details
test("HTTP 200 — confirm received stores full archive", async () => {
  const { requesterCookie, requesterId, helperId } = await seedAndLogin();

  const reqid = crypto.randomUUID();
  await Request.create({
    id: reqid,
    userId: requesterId,
    helperId,
    status: "completed",
    item: "Package",
    pickupLocation: "Dorm",
    dropoffLocation: "Mailroom",
    deliveryPhotoUrl: "photo.jpg"
  });

  const res = await request(app)
    .post(`/api/requests/${reqid}/confirm-received`)
    .set("Cookie", requesterCookie);

  expect(res.status).toBe(200);

  const archived = await ArchivedRequest.findOne({ where: { originalRequestId: reqid } });
  expect(archived).not.toBeNull();
  expect(archived.item).toBe("Package");
  expect(archived.helperId).toBe(helperId);
});

describe("GET /api/requests/:id/photo", () => {
  test("HTTP 200 — returns default.jpg if request has no photo", async () => {
    const { requesterCookie, requesterId, helperId } = await seedAndLogin();
    const reqid = crypto.randomUUID();
    await Request.create({
      id: reqid,
      userId: requesterId,
      helperId,
      status: "accepted",
      item: "Water",
      pickupLocation: "Dorm",
      dropoffLocation: "Gym",
    });

    const res = await request(app)
      .get(`/api/requests/${reqid}/photo`)
      .set("Cookie", requesterCookie);

    expect(res.status).toBe(200);
    // Since it falls back to default.jpg, let's check headers
    expect(res.headers["content-type"]).toContain("image/jpeg");
  });

  test("HTTP 200 — returns default.jpg if photo file does not exist on disk", async () => {
    const { requesterCookie, requesterId, helperId } = await seedAndLogin();
    const reqid = crypto.randomUUID();
    await Request.create({
      id: reqid,
      userId: requesterId,
      helperId,
      status: "accepted",
      item: "Water",
      pickupLocation: "Dorm",
      dropoffLocation: "Gym",
      deliveryPhotoUrl: "non-existent-photo.jpg",
    });

    const res = await request(app)
      .get(`/api/requests/${reqid}/photo`)
      .set("Cookie", requesterCookie);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("image/jpeg");
  });

  test("HTTP 403 — unauthorized user cannot view the photo", async () => {
    const { requesterId, helperId } = await seedAndLogin();
    const reqid = crypto.randomUUID();
    await Request.create({
      id: reqid,
      userId: requesterId,
      helperId,
      status: "accepted",
      item: "Water",
      pickupLocation: "Dorm",
      dropoffLocation: "Gym",
    });

    // Make request without auth cookie or with third user
    const res = await request(app)
      .get(`/api/requests/${reqid}/photo`);

    expect(res.status).toBe(401);
  });

  test("HTTP 200 — returns default.jpg if request does not exist in the database", async () => {
    const { requesterCookie } = await seedAndLogin();
    const reqid = crypto.randomUUID();

    const res = await request(app)
      .get(`/api/requests/${reqid}/photo`)
      .set("Cookie", requesterCookie);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("image/jpeg");
  });
});