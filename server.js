const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// File where we'll persist data
const DATA_FILE = path.join(__dirname, "sessions.json");

// Load sessions from file
function loadSessions() {
  if (fs.existsSync(DATA_FILE)) {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  }
  return { swim: [], gym: [] };
}

// Save sessions to file
function saveSessions(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ✅ GET swim sessions
app.get("/swim-sessions", (req, res) => {
  const data = loadSessions();
  res.json({ swim: data.swim });
});

// ✅ POST swim sessions
app.post("/swim-sessions", (req, res) => {
  const data = loadSessions();
  data.swim = req.body.swim || [];
  saveSessions(data);
  res.json({ success: true });
});

// ✅ GET gym sessions
app.get("/gym-sessions", (req, res) => {
  const data = loadSessions();
  res.json({ gym: data.gym });
});

// ✅ POST gym sessions
app.post("/gym-sessions", (req, res) => {
  const data = loadSessions();
  data.gym = req.body.gym || [];
  saveSessions(data);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
