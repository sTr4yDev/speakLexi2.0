// ==========================================================
// server.js - SpeakLexi Backend - COMPLETO
// ==========================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// ==========================================================
// IMPORTAR CONFIGURACIÓN DE BASE DE DATOS
// ==========================================================

const { initializeDatabase, testConnection } = require('./config/database');

// ==========================================================
// IMPORTAR RUTAS
// ==========================================================

const authRoutes = require('./routes/auth-routes');
const leccionRoutes = require('./routes/leccionRoutes');
const multimediaRoutes = require('./routes/multimediaRoutes');
const cursosRoutes = require('./routes/cursosRoutes');
const ejercicioRoutes = require('./routes/ejercicioRoutes'); 

const app = express();

// ==========================================================
// INICIALIZACIÓN DE BASE DE DATOS
// ==========================================================

const initializeApp = async () => {
  console.log('🔧 Inicializando aplicación SpeakLexi...');
  
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.log('⚠️  ADVERTENCIA: Base de datos no disponible');
    console.log('📝 El servidor arrancará pero las funciones de base de datos fallarán');
  } else {
    console.log('✅ Base de datos conectada correctamente');
  }

  console.log('✅ Aplicación inicializada correctamente');
};

// ==========================================================
// MIDDLEWARES
// ==========================================================

// Seguridad
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: {
    error: 'Demasiadas peticiones desde esta IP, intenta más tarde.'
  }
});
app.use(limiter);

// CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'CORS policy: Origen no permitido';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '16mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================================================
// RUTAS - TODAS REGISTRADAS
// ==========================================================

app.use('/api/auth', authRoutes);
app.use('/api/lecciones', leccionRoutes);
app.use('/api/multimedia', multimediaRoutes);
app.use('/api/cursos', cursosRoutes);
app.use('/api/ejercicios', ejercicioRoutes); // ← NUEVO

// ==========================================================
// RUTAS BÁSICAS DEL SISTEMA
// ==========================================================

app.get('/api/health', async (req, res) => {
  const dbStatus = await testConnection();
  
  res.json({ 
    status: 'OK', 
    message: 'SpeakLexi API funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: dbStatus ? 'connected' : 'disconnected',
      authentication: 'available',
      lessons: 'available',
      multimedia: 'available',
      courses: 'available',
      exercises: 'available', // ← NUEVO
      email: 'available'
    }
  });
});

app.get('/api/config', (req, res) => {
  res.json({
    appName: 'SpeakLexi',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    features: {
      auth: true,
      users: false,
      lessons: true,
      multimedia: true,
      courses: true,
      exercises: true, // ← NUEVO
      progress: false
    },
    endpoints: {
      auth: '/api/auth',
      lecciones: '/api/lecciones',
      multimedia: '/api/multimedia',
      cursos: '/api/cursos',
      ejercicios: '/api/ejercicios', // ← NUEVO
      health: '/api/health',
      config: '/api/config'
    }
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Bienvenido a SpeakLexi API',
    version: '1.0.0',
    description: 'Sistema de aprendizaje de idiomas',
    availableEndpoints: [
      'GET  /api/health - Estado del sistema',
      'GET  /api/config - Configuración',
      
      '--- AUTENTICACIÓN ---',
      'POST /api/auth/registro - Registro de usuario',
      'POST /api/auth/login - Inicio de sesión',
      'POST /api/auth/verificar - Verificación de email',
      
      '--- CURSOS ---',
      'GET  /api/cursos - Listar todos los cursos',
      'GET  /api/cursos/:id - Obtener curso específico',
      'POST /api/cursos - Crear nuevo curso',
      'GET  /api/cursos/:id/lecciones - Lecciones del curso',
      'POST /api/cursos/:id/inscribir - Inscribirse',
      
      '--- LECCIONES ---',
      'GET  /api/lecciones - Listar lecciones',
      'GET  /api/lecciones/:id - Obtener lección específica',
      'POST /api/lecciones - Crear nueva lección',
      'PUT  /api/lecciones/:id - Actualizar lección',
      
      '--- EJERCICIOS ---', 
      'GET  /api/ejercicios/leccion/:leccion_id - Ejercicios de lección',
      'POST /api/ejercicios - Crear ejercicio',
      'PUT  /api/ejercicios/:id - Actualizar ejercicio',
      'POST /api/ejercicios/:id/validar - Validar respuesta',
      
      '--- MULTIMEDIA ---',
      'GET  /api/multimedia/leccion/:leccionId - Multimedia de lección',
      'POST /api/multimedia/subir - Subir archivo',
      'DELETE /api/multimedia/:id - Eliminar archivo'
    ],
    documentation: 'Consulta la documentación para más detalles'
  });
});

// ==========================================================
// MANEJO DE ERRORES
// ==========================================================

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      '/api/health', 
      '/api/config', 
      '/api/auth/*',
      '/api/cursos/*',
      '/api/lecciones/*',
      '/api/multimedia/*',
      '/api/ejercicios/*' // ← NUEVO
    ],
    suggestion: 'Verifica la URL o consulta GET / para ver endpoints disponibles'
  });
});

app.use((error, req, res, next) => {
  console.error('❌ Error del servidor:', error);
  
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'JSON malformado en el cuerpo de la petición',
      suggestion: 'Verifica que tu JSON sea válido'
    });
  }
  
  if (error.code === 'ECONNREFUSED' || error.code === 'ER_ACCESS_DENIED_ERROR') {
    return res.status(503).json({
      error: 'Servicio de base de datos no disponible',
      message: 'Intenta nuevamente en unos momentos'
    });
  }
  
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Algo salió mal. Por favor, intenta nuevamente.'
  });
});

// ==========================================================
// INICIAR SERVIDOR
// ==========================================================

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';

initializeApp().then(() => {
  app.listen(PORT, HOST, () => {
    console.log('\n' + '='.repeat(50));
    console.log('🚀 Servidor SpeakLexi INICIADO CORRECTAMENTE');
    console.log('='.repeat(50));
    console.log(`📍 URL: http://${HOST}:${PORT}`);
    console.log(`📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔐 Autenticación: http://${HOST}:${PORT}/api/auth`);
    console.log(`📚 Cursos: http://${HOST}:${PORT}/api/cursos`);
    console.log(`📖 Lecciones: http://${HOST}:${PORT}/api/lecciones`);
    console.log(`🎯 Ejercicios: http://${HOST}:${PORT}/api/ejercicios`); // ← NUEVO
    console.log(`🎬 Multimedia: http://${HOST}:${PORT}/api/multimedia`);
    console.log(`❤️  Health: http://${HOST}:${PORT}/api/health`);
    console.log(`📝 Config: http://${HOST}:${PORT}/api/config`);
    console.log('='.repeat(50));
    console.log('✅ ¡Backend listo para recibir peticiones!');
    console.log('='.repeat(50) + '\n');
  });
}).catch(error => {
  console.error('❌ Error fatal inicializando la aplicación:', error);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n🔻 Recibida señal de cierre (SIGINT)');
  console.log('👋 Cerrando servidor SpeakLexi...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🔻 Recibida señal de terminación (SIGTERM)');
  console.log('👋 Cerrando servidor SpeakLexi...');
  process.exit(0);
});

module.exports = app;