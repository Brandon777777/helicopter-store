// ============================================================
// SERVER.JS - Backend principal de Helicopter Store
// Stack: Node.js + Express + PostgreSQL
// ============================================================

require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Conexión a PostgreSQL ────────────────────────────────────
const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 5432,
  database: process.env.DB_NAME     || 'helicopter_store',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

// Verificar conexión al iniciar
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error conectando a PostgreSQL:', err.message);
  } else {
    console.log('✅ Conectado a PostgreSQL correctamente');
    release();
    initDB(); // Inicializar tablas y seed data
  }
});

// ─── Inicializar Base de Datos ────────────────────────────────
async function initDB() {
  try {
    // Crear tabla si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS helicopteros (
        id        SERIAL PRIMARY KEY,
        marca     VARCHAR(100) NOT NULL,
        modelo    VARCHAR(100) NOT NULL,
        anio      INTEGER NOT NULL,
        precio    NUMERIC(15, 2) NOT NULL,
        imagen    TEXT,
        disponible BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Tabla helicopteros lista');


  } catch (err) {
    console.error('❌ Error inicializando DB:', err.message);
  }
}

// ─── RUTAS API REST ───────────────────────────────────────────

// GET /helicopteros — Obtener todos
app.get('/helicopteros', async (req, res) => {
  try {
    console.log('📋 GET /helicopteros');
    const { rows } = await pool.query(
      'SELECT * FROM helicopteros ORDER BY id ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error('❌ Error GET /helicopteros:', err.message);
    res.status(500).json({ error: 'Error al obtener helicópteros' });
  }
});

// GET /helicopteros/:id — Obtener uno por ID
app.get('/helicopteros/:id', async (req, res) => {
  const { id } = req.params;
  try {
    console.log(`📋 GET /helicopteros/${id}`);
    const { rows } = await pool.query(
      'SELECT * FROM helicopteros WHERE id = $1', [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Helicóptero no encontrado' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`❌ Error GET /helicopteros/${id}:`, err.message);
    res.status(500).json({ error: 'Error al obtener helicóptero' });
  }
});

// POST /helicopteros — Crear nuevo
app.post('/helicopteros', async (req, res) => {
  const { marca, modelo, anio, precio, imagen, disponible } = req.body;

  // Validación básica
  if (!marca || !modelo || !anio || !precio) {
    return res.status(400).json({ error: 'Campos obligatorios: marca, modelo, anio, precio' });
  }

  try {
    console.log('➕ POST /helicopteros:', { marca, modelo });
    const { rows } = await pool.query(
      `INSERT INTO helicopteros (marca, modelo, anio, precio, imagen, disponible)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [marca, modelo, anio, precio, imagen || '', disponible ?? true]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('❌ Error POST /helicopteros:', err.message);
    res.status(500).json({ error: 'Error al crear helicóptero' });
  }
});

// PUT /helicopteros/:id — Actualizar
app.put('/helicopteros/:id', async (req, res) => {
  const { id } = req.params;
  const { marca, modelo, anio, precio, imagen, disponible } = req.body;

  if (!marca || !modelo || !anio || !precio) {
    return res.status(400).json({ error: 'Campos obligatorios: marca, modelo, anio, precio' });
  }

  try {
    console.log(`✏️ PUT /helicopteros/${id}`);
    const { rows } = await pool.query(
      `UPDATE helicopteros
       SET marca=$1, modelo=$2, anio=$3, precio=$4, imagen=$5, disponible=$6
       WHERE id=$7 RETURNING *`,
      [marca, modelo, anio, precio, imagen || '', disponible ?? true, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Helicóptero no encontrado' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`❌ Error PUT /helicopteros/${id}:`, err.message);
    res.status(500).json({ error: 'Error al actualizar helicóptero' });
  }
});

// DELETE /helicopteros/:id — Eliminar
app.delete('/helicopteros/:id', async (req, res) => {
  const { id } = req.params;
  try {
    console.log(`🗑️ DELETE /helicopteros/${id}`);
    const { rows } = await pool.query(
      'DELETE FROM helicopteros WHERE id=$1 RETURNING *', [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Helicóptero no encontrado' });
    }
    res.json({ mensaje: 'Helicóptero eliminado correctamente', eliminado: rows[0] });
  } catch (err) {
    console.error(`❌ Error DELETE /helicopteros/${id}:`, err.message);
    res.status(500).json({ error: 'Error al eliminar helicóptero' });
  }
});

// ─── Fallback: servir index.html para rutas no-API ────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Iniciar servidor ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚁 Helicopter Store corriendo en http://localhost:${PORT}`);
  console.log(`📡 API disponible en http://localhost:${PORT}/helicopteros`);
});