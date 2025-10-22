/*
  server.js - Node + Express minimal backend for the Retro Inbox demo
  ---------------------------------------------------------------
  - Node 18+ (ES modules)
  - Endpoints:
      POST   /api/messages       -> multipart/form-data or application/json (text) (public)
      GET    /api/messages       -> list messages (public read)
      POST   /api/messages/:id/read  -> mark as read (requires OWNER_TOKEN)
      POST   /api/profile        -> save profile (requires OWNER_TOKEN)
      GET    /api/profile        -> get profile
  - Files uploaded are stored under ./uploads and served at /uploads/
  - Simple JSON "DB" persisted to ./db.json
  - Owner authentication: uses env var OWNER_TOKEN (simple shared-secret).

  USAGE (local dev):
    1) mkdir retro-server && cd retro-server
    2) save this file as server.js
    3) create package.json (see snippet below) or run `npm init -y` and edit
    4) npm install express multer cors
    5) create folders: mkdir uploads
    6) export OWNER_TOKEN=owner123  (or set in Windows via set)
    7) node server.js

  Notes: This example is intentionally minimal for demonstration. In production add
  - real DB (Postgres, Mongo, etc.)
  - authentication (JWT, sessions), rate-limiting, input validation
  - HTTPS / reverse proxy
*/

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Cargar variables de entorno desde .env en la raíz del proyecto
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const PORT = process.env.PORT || 3000;
const OWNER_TOKEN = process.env.OWNER_TOKEN || 'owner123';
const DB_FILE = path.join(__dirname, 'db.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const PROFILE_DIR = path.join(__dirname, 'profile');
const PROFILE_FILE = path.join(PROFILE_DIR, 'owner.json');

// ensure folders
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(PROFILE_DIR)) fs.mkdirSync(PROFILE_DIR, { recursive: true });

// read/write JSON db helpers
function readDB() {
  try {
    const raw = fs.readFileSync(DB_FILE, { encoding: 'utf8' });
    return JSON.parse(raw);
  } catch (e) {
    return { messages: [], profile: null };
  }
}
function writeDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// read/write profile helpers
function readProfile() {
  try {
    const raw = fs.readFileSync(PROFILE_FILE, { encoding: 'utf8' });
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}
function writeProfile(profile) {
  fs.writeFileSync(PROFILE_FILE, JSON.stringify(profile, null, 2));
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for base64 images
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // serve static files from public/
app.use('/uploads', express.static(UPLOADS_DIR)); // serve uploaded files

const upload = multer({ dest: UPLOADS_DIR });

// helper to generate id
function newid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

// Public: post message (optionally with drawing file)
app.post('/api/messages', upload.single('drawing'), (req, res) => {
  try {
    const db = readDB();
    const id = newid();
    const text = (req.body && req.body.text) ? String(req.body.text) : '';

    const item = {
      id,
      text,
      ts: Date.now(),
      read: false,
      drawingUrl: null
    };

    if (req.file) {
      // preserve extension if possible
      const original = req.file.originalname || '';
      const ext = path.extname(original) || path.extname(req.file.path) || '.png';
      const destName = id + ext;
      const destPath = path.join(UPLOADS_DIR, destName);
      fs.renameSync(req.file.path, destPath);
      item.drawingUrl = '/uploads/' + destName;
    }

    db.messages.push(item);
    writeDB(db);

    // simple response
    res.json({ ok: true, id });
  } catch (err) {
    console.error('POST /api/messages error', err);
    res.status(500).json({ ok: false, error: 'server error' });
  }
});

// Public: list messages
app.get('/api/messages', (req, res) => {
  const db = readDB();
  res.json(db.messages);
});

// Owner-only: mark message read
app.post('/api/messages/:id/read', (req, res) => {
  const token = req.headers['x-owner-token'] || req.query.owner_token || '';
  if (token !== OWNER_TOKEN) return res.status(403).json({ ok: false, error: 'forbidden' });

  const db = readDB();
  const it = db.messages.find(m => m.id === req.params.id);
  if (!it) return res.status(404).json({ ok: false, error: 'not found' });
  it.read = true;
  writeDB(db);
  res.json({ ok: true });
});

// Owner-only: save profile
app.post('/api/profile', (req, res) => {
  const token = req.headers['x-owner-token'] || req.query.owner_token || '';
  if (token !== OWNER_TOKEN) return res.status(403).json({ ok: false, error: 'forbidden' });

  try {
    writeProfile(req.body);
    res.json({ ok: true });
  } catch (err) {
    console.error('Error saving profile:', err);
    res.status(500).json({ ok: false, error: 'server error' });
  }
});

// Public: get profile
app.get('/api/profile', (req, res) => {
  try {
    const profile = readProfile();
    res.json(profile || null);
  } catch (err) {
    console.error('Error reading profile:', err);
    res.json(null);
  }
});

// Public: get config (returns owner token for client-side validation)
app.get('/api/config', (req, res) => {
  res.json({
    ownerToken: OWNER_TOKEN
  });
});

// Optional: delete message (owner-only) - not used by default UI, but provided
app.delete('/api/messages/:id', (req, res) => {
  const token = req.headers['x-owner-token'] || req.query.owner_token || '';
  if (token !== OWNER_TOKEN) return res.status(403).json({ ok: false, error: 'forbidden' });

  const db = readDB();
  const idx = db.messages.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ ok: false, error: 'not found' });

  // optionally unlink drawing file
  const item = db.messages[idx];
  if (item.drawingUrl) {
    const p = path.join('.', item.drawingUrl.replace(/^\//, ''));
    try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch (e) { console.warn('could not unlink', p); }
  }

  db.messages.splice(idx, 1);
  writeDB(db);
  res.json({ ok: true });
});

// Health
app.get('/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

app.listen(PORT, () => {
  console.log(`🚀 Retro Inbox running at http://localhost:${PORT}`);
  console.log(`🔑 Owner token: ${OWNER_TOKEN}`);
});
/*
  package.json suggested:
  {
    "name": "retro-inbox-server",
    "version": "1.0.0",
    "type": "module",
    "scripts": {
      "start": "node server.js",
      "dev": "nodemon server.js"
    },
    "dependencies": {
      "cors": "^2.8.5",
      "express": "^4.18.2",
      "multer": "^1.4.5"
    }
  }

  Tips:
  - Run `npm install` with the deps above.
  - Create uploads and ensure write permissions.
  - Set OWNER_TOKEN env var before running (e.g. OWNER_TOKEN="mi_secret" node server.js)
  - For production, put behind a reverse proxy and enable HTTPS.
*/
