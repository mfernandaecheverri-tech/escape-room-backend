const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
app.use(express.json());
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Configuración de la conexión a Aiven MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'escape_room_db',
  port: process.env.DB_PORT || 3306,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// --- API AUTENTICACIÓN / USUARIOS ---
app.post('/api/auth/login', async (req, res) => {
  const { username } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ usuario: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/registro', async (req, res) => {
  const { username } = req.body;
  try {
    const email = `${username}@gmail.com`;
    const [result] = await pool.query(
      'INSERT INTO usuarios (username, email, proveedor_auth_id, proveedor_uid) VALUES (?, ?, 1, ?)',
      [username, email, `sub_${username}`]
    );
    res.json({ id: result.insertId, username });
  } catch (err) {
    res.status(400).json({ error: 'El usuario ya existe o hubo un problema al crearlo.' });
  }
});

// --- API JUEGOS Y ROLES ---
app.get('/api/juegos', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM juegos WHERE es_activo = TRUE');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/juegos/:id/roles', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM roles_juego WHERE juego_id = ?', [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API SALAS ---
app.post('/api/salas/crear', async (req, res) => {
  const { juego_id, anfitrion_id } = req.body;
  const codigo = 'LAB' + Math.floor(100 + Math.random() * 900);
  try {
    const [result] = await pool.query(
      'INSERT INTO salas (codigo_acceso, juego_id, anfitrion_id, estado) VALUES (?, ?, ?, "ESPERANDO")',
      [codigo, juego_id, anfitrion_id]
    );
    res.json({ id: result.insertId, codigo_acceso: codigo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/salas/unirse', async (req, res) => {
  const { codigo_acceso, usuario_id, rol_juego_id } = req.body;
  try {
    const [salas] = await pool.query('SELECT * FROM salas WHERE codigo_acceso = ?', [codigo_acceso]);
    if (salas.length === 0) return res.status(404).json({ error: 'Sala no encontrada' });
    
    const sala = salas[0];
    const [juegos] = await pool.query('SELECT min_jugadores FROM juegos WHERE id = ?', [sala.juego_id]);

    // Insertar jugador en la sala
    await pool.query(
      'INSERT INTO jugadores_sala (sala_id, usuario_id, rol_juego_id, esta_listo, esta_conectado) VALUES (?, ?, ?, TRUE, TRUE) ON DUPLICATE KEY UPDATE esta_conectado = TRUE',
      [sala.id, usuario_id, rol_juego_id]
    );

    res.json({ sala, min_jugadores: juegos[0]?.min_jugadores || 1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/salas/:id/jugadores', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT js.*, u.username, r.nombre_rol 
       FROM jugadores_sala js 
       JOIN usuarios u ON js.usuario_id = u.id 
       LEFT JOIN roles_juego r ON js.rol_juego_id = r.id 
       WHERE js.sala_id = ?`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/salas/:id/iniciar', async (req, res) => {
  try {
    await pool.query('UPDATE salas SET estado = "EN_PROGRESO" WHERE id = ?', [req.params.id]);
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API ACERTIJOS E INVENTARIO ---
app.get('/api/salas/:salaId/inventario/:usuarioId', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT inv.* FROM inventario_jugador inv 
       JOIN jugadores_sala js ON inv.jugador_sala_id = js.id 
       WHERE js.sala_id = ? AND js.usuario_id = ?`,
      [req.params.salaId, req.params.usuarioId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));