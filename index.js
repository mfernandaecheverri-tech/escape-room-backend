const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Servir archivos estáticos (HTML, CSS, JS)
app.use(express.static(__dirname));

// RUTA RAÍZ (Entrega la interfaz gráfica HTML)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ==========================================
// 1. RUTAS CRUD PARA JUEGOS
// ==========================================

// READ: Obtener todos los juegos activos
app.get('/api/juegos', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM juegos WHERE es_activo = TRUE');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE: Crear un nuevo juego
app.post('/api/juegos', async (req, res) => {
  const { titulo, descripcion, tiempo_limite_minutos, min_jugadores, max_jugadores } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO juegos (titulo, descripcion, tiempo_limite_minutos, min_jugadores, max_jugadores) VALUES (?, ?, ?, ?, ?)',
      [titulo, descripcion, tiempo_limite_minutos, min_jugadores, max_jugadores]
    );
    res.status(201).json({ mensaje: 'Juego creado exitosamente', id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE: Actualizar un juego existente
app.put('/api/juegos/:id', async (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion, tiempo_limite_minutos, min_jugadores, max_jugadores } = req.body;
  try {
    await db.query(
      'UPDATE juegos SET titulo = ?, descripcion = ?, tiempo_limite_minutos = ?, min_jugadores = ?, max_jugadores = ? WHERE id = ?',
      [titulo, descripcion, tiempo_limite_minutos, min_jugadores, max_jugadores, id]
    );
    res.json({ mensaje: 'Juego actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE: Soft Delete (Desactivar juego)
app.delete('/api/juegos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE juegos SET es_activo = FALSE WHERE id = ?', [id]);
    res.json({ mensaje: 'Juego desactivado exitosamente (Soft Delete)' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 2. RUTAS CRUD PARA ROLES_JUEGO
// ==========================================

// READ: Obtener todos los roles con el título del juego asociado
app.get('/api/roles-juego', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.*, j.titulo AS nombre_juego 
      FROM roles_juego r 
      JOIN juegos j ON r.juego_id = j.id
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE: Crear un nuevo rol de juego
app.post('/api/roles-juego', async (req, res) => {
  const { juego_id, nombre_rol, descripcion } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO roles_juego (juego_id, nombre_rol, descripcion) VALUES (?, ?, ?)',
      [juego_id, nombre_rol, descripcion]
    );
    res.status(201).json({ mensaje: 'Rol de juego creado exitosamente', id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE: Actualizar un rol de juego
app.put('/api/roles-juego/:id', async (req, res) => {
  const { id } = req.params;
  const { juego_id, nombre_rol, descripcion } = req.body;
  try {
    await db.query(
      'UPDATE roles_juego SET juego_id = ?, nombre_rol = ?, descripcion = ? WHERE id = ?',
      [juego_id, nombre_rol, descripcion, id]
    );
    res.json({ mensaje: 'Rol de juego actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE: Eliminar un rol de juego
app.delete('/api/roles-juego/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM roles_juego WHERE id = ?', [id]);
    res.json({ mensaje: 'Rol de juego eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});