import pg from 'pg';
const { Pool } = pg;

// Conexión a PostgreSQL (Supabase) - Connection Pooler
// Formato: postgresql://postgres.PROJECT_REF:PASSWORD@REGION.pooler.supabase.com:6543/postgres
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Inicializar tablas
export async function initDB() {
  const client = await pool.connect();
  try {
    // Tabla de mensajes
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(50) PRIMARY KEY,
        text TEXT,
        nick VARCHAR(100),
        ts BIGINT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        drawing_url TEXT
      );
    `);

    // Tabla de perfil (solo un registro)
    await client.query(`
      CREATE TABLE IF NOT EXISTS profile (
        id INTEGER PRIMARY KEY DEFAULT 1,
        name VARCHAR(200),
        bio TEXT,
        web VARCHAR(500),
        avatar TEXT,
        CONSTRAINT single_profile CHECK (id = 1)
      );
    `);

    // Insertar perfil por defecto si no existe
    await client.query(`
      INSERT INTO profile (id, name, bio, web, avatar)
      VALUES (1, 'Owner', 'Envíame un mensaje anónimo', '', '')
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log('✅ Base de datos inicializada');
  } catch (err) {
    console.error('❌ Error inicializando base de datos:', err);
  } finally {
    client.release();
  }
}

// ========== MENSAJES ==========

export async function getAllMessages() {
  const result = await pool.query(
    'SELECT id, text, nick, ts, read, drawing_url as "drawingUrl" FROM messages ORDER BY ts DESC'
  );
  // Convert ts from string to number (PostgreSQL BIGINT returns as string)
  return result.rows.map(row => ({
    ...row,
    ts: parseInt(row.ts, 10)
  }));
}

export async function createMessage(message) {
  const { id, text, nick, ts, drawingUrl } = message;
  await pool.query(
    'INSERT INTO messages (id, text, nick, ts, read, drawing_url) VALUES ($1, $2, $3, $4, $5, $6)',
    [id, text || '', nick || null, ts, false, drawingUrl || null]
  );
  return message;
}

export async function markMessageAsRead(id) {
  const result = await pool.query(
    'UPDATE messages SET read = TRUE WHERE id = $1 RETURNING *',
    [id]
  );
  return result.rows[0];
}

export async function deleteMessage(id) {
  const result = await pool.query(
    'DELETE FROM messages WHERE id = $1 RETURNING *',
    [id]
  );
  return result.rows[0];
}

// ========== PERFIL ==========

export async function getProfile() {
  const result = await pool.query('SELECT name, bio, web, avatar FROM profile WHERE id = 1');
  return result.rows[0] || null;
}

export async function updateProfile(profile) {
  const { name, bio, web, avatar } = profile;
  const result = await pool.query(
    'UPDATE profile SET name = $1, bio = $2, web = $3, avatar = $4 WHERE id = 1 RETURNING *',
    [name, bio, web, avatar]
  );
  return result.rows[0];
}

export default pool;
