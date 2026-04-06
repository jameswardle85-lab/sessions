const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 5000;

// -------------------- MIDDLEWARE --------------------
app.use(cors());
app.use(express.json());

// -------------------- DATA FILE --------------------
const DATA_FILE = path.join(__dirname, "sessions.json");

function loadSessions() {
  try {
    const data = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(data);
  } catch {
    return { gym: [], swim: [] };
  }
}

function saveSessions(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

let sessions = loadSessions();

// -------------------- UTILS --------------------
function genId() {
  return Date.now() + Math.floor(Math.random() * 1000000);
}

// -------------------- GENERIC COLLECTION ROUTES --------------------
function registerCollectionRoutes(collectionName) {
  // GET all sessions
  app.get(`/${collectionName}-sessions`, (req, res) => {
    res.json(sessions[collectionName] || []);
  });

  // POST (create or update multiple)
app.post(`/${collectionName}-sessions`, (req, res) => {
  console.log("BODY:", req.body); // 👈 raw payload from frontend

  const incoming = req.body.sessions || req.body[collectionName] || [];

  console.log("INCOMING:", incoming); // 👈 what your API actually uses

  if (!Array.isArray(incoming) || incoming.length === 0) {
    return res
      .status(400)
      .json({ error: `Expected array of ${collectionName} sessions` });
  }

  if (!sessions[collectionName]) sessions[collectionName] = [];

  incoming.forEach((item) => {
    if (!item.id || typeof item.id !== "number") item.id = genId();

    const existingIndex = sessions[collectionName].findIndex(
      (e) => e.id === item.id
    );

    if (existingIndex === -1) {
      sessions[collectionName].push({ ...item });
    } else {
      sessions[collectionName][existingIndex] = {
        ...sessions[collectionName][existingIndex],
        ...item,
      };
    }
  });

  saveSessions(sessions);
  res.json({ success: true, [collectionName]: sessions[collectionName] });
});

  // PUT (update single)
  app.put(`/${collectionName}-sessions/:id`, (req, res) => {
    const id = parseFloat(req.params.id);
    const updated = req.body || {};
    const idx = (sessions[collectionName] || []).findIndex((s) => s.id === id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });

    sessions[collectionName][idx] = {
      ...sessions[collectionName][idx],
      ...updated,
    };
    saveSessions(sessions);
    res.json({ success: true, [collectionName]: sessions[collectionName][idx] });
  });

  // DELETE
  app.delete(`/${collectionName}-sessions/:id`, (req, res) => {
    const id = parseFloat(req.params.id);
    const beforeCount = sessions[collectionName].length;
    sessions[collectionName] = sessions[collectionName].filter(
      (s) => s.id !== id
    );
    const afterCount = sessions[collectionName].length;

    if (beforeCount === afterCount) {
      return res.status(404).json({ error: "Not found" });
    }

    saveSessions(sessions);
    res.json({ success: true });
  });
}

// -------------------- REGISTER COLLECTIONS --------------------
if (!sessions.gym) sessions.gym = [];
if (!sessions.swim) sessions.swim = [];
registerCollectionRoutes("gym");
registerCollectionRoutes("swim");

// -------------------- WEEK START DATE --------------------
app.get("/week-start-date", (req, res) => {
  res.json({ weekStartDate: sessions.weekStartDate || "" });
});

app.put("/week-start-date", (req, res) => {
  const { weekStartDate } = req.body;
  if (!weekStartDate)
    return res.status(400).json({ error: "weekStartDate is required" });

  sessions.weekStartDate = weekStartDate;
  saveSessions(sessions);

  res.json({ success: true, weekStartDate });
});

// -------------------- TEST --------------------
app.get("/test", (req, res) => res.send("Server is alive"));

// -------------------- START SERVER --------------------
app.listen(PORT, () => console.log(`✅ Server running on ${PORT}`));
