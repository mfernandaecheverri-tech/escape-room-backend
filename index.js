const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ==========================================
// 0. AUTENTICACIÓN (LOGIN Y REGISTRO)
// ==========================================
app.post('/api/auth/registro', async (req, res) => {
  const { username, email, proveedor_auth_id, proveedor_uid } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO usuarios (username, email, proveedor_auth_id, proveedor_uid) VALUES (?, ?, ?, ?)',
      [username, email || `${username}@escaperoom.com`, proveedor_auth_id || 1, proveedor_uid || username]
    );
    res.status(201).json({ mensaje: 'Usuario registrado', id: result.insertId, username });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  const { username } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE username = ?', [username]);
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ mensaje: 'Login exitoso', usuario: rows[0] });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ==========================================
// 1. JUEGOS
// ==========================================
app.get('/api/juegos', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM juegos WHERE es_activo = TRUE');
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/juegos', async (req, res) => {
  const { titulo, descripcion, tiempo_limite_minutos, min_jugadores, max_jugadores } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO juegos (titulo, descripcion, tiempo_limite_minutos, min_jugadores, max_jugadores) VALUES (?, ?, ?, ?, ?)',
      [titulo, descripcion, tiempo_limite_minutos, min_jugadores, max_jugadores]
    );
    res.status(201).json({ mensaje: 'Juego creado', id: result.insertId });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/juegos/:id', async (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion, tiempo_limite_minutos, min_jugadores, max_jugadores } = req.body;
  try {
    await db.query(
      'UPDATE juegos SET titulo = ?, descripcion = ?, tiempo_limite_minutos = ?, min_jugadores = ?, max_jugadores = ? WHERE id = ?',
      [titulo, descripcion, tiempo_limite_minutos, min_jugadores, max_jugadores, id]
    );
    res.json({ mensaje: 'Juego actualizado' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/juegos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE juegos SET es_activo = FALSE WHERE id = ?', [id]);
    res.json({ mensaje: 'Juego desactivado' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ==========================================
// 2. ROLES DE JUEGO
// ==========================================
app.get('/api/roles-juego', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.*, j.titulo AS nombre_juego 
      FROM roles_juego r 
      JOIN juegos j ON r.juego_id = j.id
    `);
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/roles-juego', async (req, res) => {
  const { juego_id, nombre_rol, descripcion } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO roles_juego (juego_id, nombre_rol, descripcion) VALUES (?, ?, ?)',
      [juego_id, nombre_rol, descripcion]
    );
    res.status(201).json({ mensaje: 'Rol creado', id: result.insertId });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/roles-juego/:id', async (req, res) => {
  const { id } = req.params;
  const { juego_id, nombre_rol, descripcion } = req.body;
  try {
    await db.query(
      'UPDATE roles_juego SET juego_id = ?, nombre_rol = ?, descripcion = ? WHERE id = ?',
      [juego_id, nombre_rol, descripcion, id]
    );
    res.json({ mensaje: 'Rol actualizado' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/roles-juego/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM roles_juego WHERE id = ?', [id]);
    res.json({ mensaje: 'Rol eliminado' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ==========================================
// 3. ETAPAS
// ==========================================
app.get('/api/etapas', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT e.*, j.titulo AS nombre_juego 
      FROM etapas e 
      JOIN juegos j ON e.juego_id = j.id
      ORDER BY e.juego_id, e.numero_etapa
    `);
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/etapas', async (req, res) => {
  const { juego_id, numero_etapa, titulo_etapa, descripcion } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO etapas (juego_id, numero_etapa, titulo_etapa, descripcion) VALUES (?, ?, ?, ?)',
      [juego_id, numero_etapa, titulo_etapa, descripcion]
    );
    res.status(201).json({ mensaje: 'Etapa creada', id: result.insertId });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/etapas/:id', async (req, res) => {
  const { id } = req.params;
  const { juego_id, numero_etapa, titulo_etapa, descripcion } = req.body;
  try {
    await db.query(
      'UPDATE etapas SET juego_id = ?, numero_etapa = ?, titulo_etapa = ?, descripcion = ? WHERE id = ?',
      [juego_id, numero_etapa, titulo_etapa, descripcion, id]
    );
    res.json({ mensaje: 'Etapa actualizada' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/etapas/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM etapas WHERE id = ?', [id]);
    res.json({ mensaje: 'Etapa eliminada' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ==========================================
// 4. ACERTIJOS
// ==========================================
app.get('/api/acertijos', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.*, e.titulo_etapa, r.nombre_rol 
      FROM acertijos a
      JOIN etapas e ON a.etapa_id = e.id
      LEFT JOIN roles_juego r ON a.rol_juego_id = r.id
    `);
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/acertijos', async (req, res) => {
  const { etapa_id, rol_juego_id, pista_texto, respuesta_codigo, puntos_otorgados } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO acertijos (etapa_id, rol_juego_id, pista_texto, respuesta_codigo, puntos_otorgados) VALUES (?, ?, ?, ?, ?)',
      [etapa_id, rol_juego_id || null, pista_texto, respuesta_codigo, puntos_otorgados]
    );
    res.status(201).json({ mensaje: 'Acertijo creado', id: result.insertId });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/acertijos/:id', async (req, res) => {
  const { id } = req.params;
  const { etapa_id, rol_juego_id, pista_texto, respuesta_codigo, puntos_otorgados } = req.body;
  try {
    await db.query(
      'UPDATE acertijos SET etapa_id = ?, rol_juego_id = ?, pista_texto = ?, respuesta_codigo = ?, puntos_otorgados = ? WHERE id = ?',
      [etapa_id, rol_juego_id || null, pista_texto, respuesta_codigo, puntos_otorgados, id]
    );
    res.json({ mensaje: 'Acertijo actualizado' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/acertijos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM acertijos WHERE id = ?', [id]);
    res.json({ mensaje: 'Acertijo eliminado' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ==========================================
// 5. SALAS Y LOBBY DE ESPERA MULTI-JUGADOR
// ==========================================
app.get('/api/salas', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.*, j.titulo AS nombre_juego, u.username AS anfitrion 
      FROM salas s
      JOIN juegos j ON s.juego_id = j.id
      JOIN usuarios u ON s.anfitrion_id = u.id
    `);
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Crear nueva sala en estado EN_ESPERA
app.post('/api/salas/crear', async (req, res) => {
  const { juego_id, anfitrion_id } = req.body;
  const codigo_acceso = Math.random().toString(36).substring(2, 8).toUpperCase();
  try {
    const [result] = await db.query(
      'INSERT INTO salas (codigo_acceso, juego_id, anfitrion_id, estado) VALUES (?, ?, ?, "EN_ESPERA")',
      [codigo_acceso, juego_id, anfitrion_id]
    );
    res.status(201).json({ mensaje: 'Sala creada', sala_id: result.insertId, codigo_acceso });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Unirse a una sala respetando límite máximo
app.post('/api/salas/unirse', async (req, res) => {
  const { codigo_acceso, usuario_id, rol_juego_id } = req.body;
  try {
    const [salas] = await db.query('SELECT * FROM salas WHERE codigo_acceso = ?', [codigo_acceso]);
    if (salas.length === 0) return res.status(404).json({ error: 'La sala no existe' });
    const sala = salas[0];

    if (sala.estado !== 'EN_ESPERA') return res.status(400).json({ error: 'La sala ya está en juego o finalizada' });

    const [juego] = await db.query('SELECT * FROM juegos WHERE id = ?', [sala.juego_id]);
    const [jugadores] = await db.query('SELECT * FROM jugadores_sala WHERE sala_id = ?', [sala.id]);

    if (jugadores.length >= juego[0].max_jugadores) {
      return res.status(400).json({ error: 'La sala alcanzó el límite máximo de jugadores' });
    }

    await db.query(
      'INSERT INTO jugadores_sala (sala_id, usuario_id, rol_juego_id, esta_listo) VALUES (?, ?, ?, FALSE)',
      [sala.id, usuario_id, rol_juego_id]
    );

    res.json({ mensaje: 'Unido a la sala con éxito', sala, min_jugadores: juego[0].min_jugadores });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Consultar jugadores conectados en la sala
app.get('/api/salas/:id/jugadores', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT js.*, u.username, r.nombre_rol 
      FROM jugadores_sala js
      JOIN usuarios u ON js.usuario_id = u.id
      JOIN roles_juego r ON js.rol_juego_id = r.id
      WHERE js.sala_id = ?
    `, [id]);
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Iniciar juego verificando el número mínimo de jugadores
app.put('/api/salas/:id/iniciar', async (req, res) => {
  const { id } = req.params;
  try {
    const [sala] = await db.query('SELECT * FROM salas WHERE id = ?', [id]);
    const [juego] = await db.query('SELECT * FROM juegos WHERE id = ?', [sala[0].juego_id]);
    const [jugadores] = await db.query('SELECT * FROM jugadores_sala WHERE sala_id = ?', [id]);

    if (jugadores.length < juego[0].min_jugadores) {
      return res.status(400).json({ 
        error: `Se necesitan mínimo ${juego[0].min_jugadores} jugadores para iniciar. Actuales: ${jugadores.length}` 
      });
    }

    await db.query('UPDATE salas SET estado = "EN_PROGRESO", fecha_inicio = NOW() WHERE id = ?', [id]);
    res.json({ mensaje: '¡El juego ha comenzado!' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/salas/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM salas WHERE id = ?', [id]);
    res.json({ mensaje: 'Sala eliminada' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ==========================================
// 6. HISTORIAL DE ACCIONES (LOGS DE ACCIONES)
// ==========================================
app.get('/api/historial/:sala_id', async (req, res) => {
  const { sala_id } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT * FROM historial_acciones WHERE sala_id = ? ORDER BY fecha_hora DESC',
      [sala_id]
    );
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/historial', async (req, res) => {
  const { sala_id, jugador_sala_id, accion_descripcion, es_exitoso } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO historial_acciones (sala_id, jugador_sala_id, accion_descripcion, es_exitoso) VALUES (?, ?, ?, ?)',
      [sala_id, jugador_sala_id || null, accion_descripcion, es_exitoso ?? true]
    );
    res.status(201).json({ mensaje: 'Acción registrada en el historial', id: result.insertId });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Servidor escuchando
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});