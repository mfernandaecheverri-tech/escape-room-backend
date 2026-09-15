const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Servir el archivo index.html y archivos estáticos
app.use(express.static(__dirname));

// 1. RUTA RAÍZ (Entrega la interfaz gráfica HTML)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 2. READ: Obtener todos los juegos
app.get('/api/juegos', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM juegos WHERE es_activo = TRUE');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. CREATE: Crear un nuevo juego
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

// 4. UPDATE: Actualizar un juego existente
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

// 5. DELETE: Soft Delete (Desactivar juego)
app.delete('/api/juegos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE juegos SET es_activo = FALSE WHERE id = ?', [id]);
    res.json({ mensaje: 'Juego desactivado exitosamente (Soft Delete)' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});