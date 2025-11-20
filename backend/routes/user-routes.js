// ==========================================================
// backend/routes/user-routes.js - MÓDULO DE GESTIÓN DE USUARIO
// ==========================================================

const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

// ==========================================================
// MIDDLEWARE PARA VALIDACIONES
// ==========================================================
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Datos de entrada inválidos',
      errores: errors.array()
    });
  }
  next();
};

// ==========================================================
// VALIDACIONES
// ==========================================================
const validacionesActualizarPerfil = [
  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  
  body('primer_apellido')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El primer apellido debe tener entre 2 y 50 caracteres'),
  
  body('segundo_apellido')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('El segundo apellido no debe exceder 50 caracteres'),
  
  body('telefono')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('El teléfono no debe exceder 20 caracteres'),
  
  handleValidationErrors
];

const validacionesCambiarPassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('La contraseña actual es requerida'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('La nueva contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
  
  handleValidationErrors
];

// ==========================================================
// RUTAS PROTEGIDAS
// ==========================================================

// Obtener perfil del usuario autenticado
router.get('/perfil', 
  authMiddleware.verificarToken, 
  userController.obtenerPerfil
);

// Actualizar perfil del usuario
router.put('/perfil', 
  authMiddleware.verificarToken,
  validacionesActualizarPerfil,
  userController.actualizarPerfil
);

// Cambiar contraseña
router.put('/cambiar-contrasena', 
  authMiddleware.verificarToken,
  validacionesCambiarPassword,
  userController.cambiarContrasena
);

// Cambiar idioma de aprendizaje
router.patch('/cambiar-idioma',
  authMiddleware.verificarToken,
  [
    body('idioma')
      .isIn(['Inglés', 'Francés', 'Alemán', 'Italiano', 'Portugués', 'Japonés', 'Coreano', 'Chino'])
      .withMessage('Idioma no soportado'),
    handleValidationErrors
  ],
  userController.cambiarIdioma
);

// Cambiar curso
router.patch('/cambiar-curso',
  authMiddleware.verificarToken,
  userController.cambiarCurso
);

// Obtener estadísticas del usuario
router.get('/estadisticas',
  authMiddleware.verificarToken,
  userController.obtenerEstadisticas
);

// Obtener progreso
router.get('/progreso',
  authMiddleware.verificarToken,
  userController.obtenerProgreso
);

// Obtener logros
router.get('/logros',
  authMiddleware.verificarToken,
  userController.obtenerLogros
);

// Obtener historial de actividad
router.get('/historial',
  authMiddleware.verificarToken,
  userController.obtenerHistorial
);

// ==========================================================
// RUTAS PÚBLICAS (para desarrollo)
// ==========================================================

router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'User Management Service',
    timestamp: new Date().toISOString()
  });
});

// ==========================================================
// MANEJO DE ERRORES
// ==========================================================

router.use((req, res) => {
  res.status(404).json({
    error: 'Ruta de usuario no encontrada',
    path: req.path,
    method: req.method,
    available_endpoints: [
      'GET /api/usuario/perfil',
      'PUT /api/usuario/perfil',
      'PUT /api/usuario/cambiar-contrasena',
      'PATCH /api/usuario/cambiar-idioma',
      'PATCH /api/usuario/cambiar-curso',
      'GET /api/usuario/estadisticas',
      'GET /api/usuario/progreso',
      'GET /api/usuario/logros',
      'GET /api/usuario/historial',
      'GET /api/usuario/health'
    ]
  });
});

module.exports = router;