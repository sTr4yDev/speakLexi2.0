// ==========================================================
// server.js - SpeakLexi Backend
// ==========================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Importar rutas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const lessonRoutes = require('./routes/lessons');
const progressRoutes = require('./routes/progress');

const app = express();

// ==========================================================
// MIDDLEWARES
// ==========================================================

// Seguridad
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // máximo 100 peticiones por ventana
  message: {
    error: 'Demasiadas peticiones desde esta IP, intenta más tarde.'
  }
});
app.use(limiter);

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '16mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================================================
// RUTAS
// ==========================================================

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/progress', progressRoutes);

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'SpeakLexi API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Ruta por defecto
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bienvenido a SpeakLexi API',
    version: '1.0.0',
    documentation: '/api/docs'
  });
});

// ==========================================================
// MANEJO DE ERRORES
// ==========================================================

// 404 - Ruta no encontrada
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Manejo de errores global
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'JSON malformado en el cuerpo de la petición'
    });
  }
  
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Algo salió mal'
  });
});

// ==========================================================
// INICIAR SERVIDOR
// ==========================================================

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';

app.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor SpeakLexi ejecutándose en http://${HOST}:${PORT}`);
  console.log(`📊 Entorno: ${process.env.NODE_ENV}`);
  console.log(`🌐 CORS habilitado para: ${process.env.CORS_ORIGIN}`);
});