import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import * as db from './db.js';

// Cargar variables de entorno desde .env en la raíz del proyecto
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const PORT = process.env.PORT || 3000;
const OWNER_TOKEN = process.env.OWNER_TOKEN || 'owner123';
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const BUILD_VERSION = Date.now(); // Cache busting version

// ensure folders
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for base64 images
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Disable caching for static files to ensure updates are loaded
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  maxAge: 0,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

app.use('/uploads', express.static(UPLOADS_DIR)); // serve uploaded files

const upload = multer({ dest: UPLOADS_DIR });

// helper to generate id
function newid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

// Public: post message (optionally with drawing file)
app.post('/api/messages', upload.single('drawing'), async (req, res) => {
  try {
    const id = newid();
    const text = (req.body && req.body.text) ? String(req.body.text) : '';
    const nick = (req.body && req.body.nick) ? String(req.body.nick) : null;

    const item = {
      id,
      text,
      nick,
      ts: Date.now(),
      drawingUrl: null
    };

    if (req.file) {
      // Convert file to data URL and save in database
      const fileBuffer = fs.readFileSync(req.file.path);
      const mimeType = req.file.mimetype || 'image/png';
      const base64 = fileBuffer.toString('base64');
      item.drawingUrl = `data:${mimeType};base64,${base64}`;
      
      // Delete temporary file
      fs.unlinkSync(req.file.path);
    }

    await db.createMessage(item);

    // simple response
    res.json({ ok: true, id });
  } catch (err) {
    console.error('POST /api/messages error', err);
    res.status(500).json({ ok: false, error: 'server error' });
  }
});

// Public: list messages
app.get('/api/messages', async (req, res) => {
  try {
    const messages = await db.getAllMessages();
    res.json(messages);
  } catch (err) {
    console.error('GET /api/messages error', err);
    res.status(500).json({ ok: false, error: 'server error' });
  }
});

// Owner-only: mark message read
app.post('/api/messages/:id/read', async (req, res) => {
  const token = req.headers['x-owner-token'] || req.query.owner_token || '';
  if (token !== OWNER_TOKEN) return res.status(403).json({ ok: false, error: 'forbidden' });

  try {
    const message = await db.markMessageAsRead(req.params.id);
    if (!message) return res.status(404).json({ ok: false, error: 'not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('Error marking as read:', err);
    res.status(500).json({ ok: false, error: 'server error' });
  }
});

// Owner-only: save profile
app.post('/api/profile', async (req, res) => {
  const token = req.headers['x-owner-token'] || req.query.owner_token || '';
  if (token !== OWNER_TOKEN) return res.status(403).json({ ok: false, error: 'forbidden' });

  try {
    await db.updateProfile(req.body);
    res.json({ ok: true });
  } catch (err) {
    console.error('Error saving profile:', err);
    res.status(500).json({ ok: false, error: 'server error' });
  }
});

// Public: get profile
app.get('/api/profile', async (req, res) => {
  try {
    const profile = await db.getProfile();
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
app.delete('/api/messages/:id', async (req, res) => {
  const token = req.headers['x-owner-token'] || req.query.owner_token || '';
  if (token !== OWNER_TOKEN) return res.status(403).json({ ok: false, error: 'forbidden' });

  try {
    const message = await db.deleteMessage(req.params.id);
    if (!message) return res.status(404).json({ ok: false, error: 'not found' });

    // optionally unlink drawing file
    if (message.drawingUrl) {
      const p = path.join('.', message.drawingUrl.replace(/^\//, ''));
      try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch (e) { console.warn('could not unlink', p); }
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Error deleting message:', err);
    res.status(500).json({ ok: false, error: 'server error' });
  }
});

// Health
app.get('/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

// Serve index.html with injected version for cache busting
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  let html = fs.readFileSync(indexPath, 'utf8');
  
  // Replace version placeholders with build version
  html = html.replace(/\/css\/styles\.css\?v=[^"]+/g, `/css/styles.css?v=${BUILD_VERSION}`);
  html = html.replace(/\/js\/app\.js\?v=[^"]+/g, `/js/app.js?v=${BUILD_VERSION}`);
  
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(html);
});

// Inicializar DB y servidor
(async () => {
  try {
    await db.initDB();
    app.listen(PORT, () => {
      console.log(`🚀 Retro Inbox running at http://localhost:${PORT}`);
      console.log(`🔑 Owner token: ${OWNER_TOKEN}`);
      console.log(`💾 Database: PostgreSQL`);
    });
  } catch (err) {
    console.error('❌ Error starting server:', err);
    process.exit(1);
  }
})();
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
