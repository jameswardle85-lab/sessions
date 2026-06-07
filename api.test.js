const BASE_URL = "http://localhost:5000";

// Helper to make requests
async function api(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res;
}

// -------------------- /test --------------------
test("GET /test - server is alive", async () => {
  const res = await api("GET", "/test");
  expect(res.status).toBe(200);
});

// -------------------- /gym-sessions --------------------
test("GET /gym-sessions - returns an array", async () => {
  const res = await api("GET", "/gym-sessions");
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(Array.isArray(data)).toBe(true);
});

test("POST /gym-sessions - creates a session", async () => {
  const res = await api("POST", "/gym-sessions", {
    sessions: [{ name: "Test session", type: "weights" }],
  });
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.success).toBe(true);
  expect(Array.isArray(data.gym)).toBe(true);
});

test("POST /gym-sessions - returns 400 with empty array", async () => {
  const res = await api("POST", "/gym-sessions", { sessions: [] });
  expect(res.status).toBe(400);
});

test("PUT /gym-sessions/:id - returns 404 for missing id", async () => {
  const res = await api("PUT", "/gym-sessions/999999999", { name: "Updated" });
  expect(res.status).toBe(404);
});

test("DELETE /gym-sessions/:id - returns 404 for missing id", async () => {
  const res = await api("DELETE", "/gym-sessions/999999999");
  expect(res.status).toBe(404);
});

// -------------------- /swim-sessions --------------------
test("GET /swim-sessions - returns an array", async () => {
  const res = await api("GET", "/swim-sessions");
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(Array.isArray(data)).toBe(true);
});

test("POST /swim-sessions - creates a session", async () => {
  const res = await api("POST", "/swim-sessions", {
    sessions: [{ name: "Test swim", distance: 1000 }],
  });
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.success).toBe(true);
  expect(Array.isArray(data.swim)).toBe(true);
});

// -------------------- /week-start-date --------------------
test("GET /week-start-date - returns weekStartDate field", async () => {
  const res = await api("GET", "/week-start-date");
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data).toHaveProperty("weekStartDate");
});

test("PUT /week-start-date - updates the date", async () => {
  const res = await api("PUT", "/week-start-date", {
    weekStartDate: "2024-01-01",
  });
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.success).toBe(true);
  expect(data.weekStartDate).toBe("2024-01-01");
});

test("PUT /week-start-date - returns 400 with no date", async () => {
  const res = await api("PUT", "/week-start-date", {});
  expect(res.status).toBe(400);
});