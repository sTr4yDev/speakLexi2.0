const express = require('express');
const router = express.Router();
const leccionController = require('../controllers/leccionController');
const authMiddleware = require('../middleware/authMiddleware');
const { body, param, query } = require('express-validator');

// Middleware de validación
const validarCrearLeccion = [
    body('titulo')
        .isLength({ min: 5, max: 100 })
        .withMessage('El título debe tener entre 5 y 100 caracteres'),
    body('nivel')
        .isIn(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
        .withMessage('Nivel inválido'),
    body('idioma')
        .isIn(['Inglés', 'Francés', 'Alemán', 'Italiano', 'Portugués', 'Japonés', 'Coreano', 'Chino'])
        .withMessage('Idioma no soportado'),
    body('duracion_minutos')
        .optional()
        .isInt({ min: 1, max: 180 })
        .withMessage('La duración debe estar entre 1 y 180 minutos')
];

const validarProgreso = [
    body('progreso')
        .isInt({ min: 0, max: 100 })
        .withMessage('El progreso debe estar entre 0 y 100')
];

// Validadores para las nuevas rutas de catálogo
const validarFiltrosCatalogo = [
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Límite debe ser entre 1 y 100'),
    query('offset')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Offset debe ser un número positivo'),
    query('nivel')
        .optional()
        .isIn(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
        .withMessage('Nivel inválido')
];

// Todas las rutas requieren autenticación
router.use(authMiddleware.verificarToken);

// ========================================
// RUTAS DE CATÁLOGO Y METADATOS
// ========================================

// ✅ CATÁLOGO COMPLETO con filtros
router.get('/catalogo', 
    validarFiltrosCatalogo,
    leccionController.obtenerCatalogo
);

// ✅ IDIOMAS DISPONIBLES
router.get('/idiomas', leccionController.obtenerIdiomas);

// ✅ NIVELES DISPONIBLES
router.get('/niveles', leccionController.obtenerNiveles);

// ✅ ESTADÍSTICAS DE PROGRESO DEL USUARIO
router.get('/estadisticas/progreso', leccionController.obtenerEstadisticasProgreso);

// ✅ LECCIONES RECIENTES DEL USUARIO
router.get('/recientes', 
    query('limit').optional().isInt({ min: 1, max: 20 }),
    leccionController.obtenerLeccionesRecientes
);

// ========================================
// RUTAS REST ESTÁNDAR - ORDEN CORRECTO
// ========================================

// 1. Rutas específicas primero (antes de /:id)

// ✅ Listar TODAS las lecciones (para admin)
router.get('/', leccionController.listarTodasLecciones);

// ✅ Listar lecciones por nivel
router.get('/nivel/:nivel', 
    param('nivel').isIn(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
    leccionController.listarLecciones
);

// 2. Crear lección (REST estándar: POST /)
router.post('/',
    authMiddleware.verificarRol(['profesor', 'admin']),  // ✅ CORREGIDO
    validarCrearLeccion,
    leccionController.crearLeccion
);

// ========================================
// RUTAS CON :id (después de las específicas)
// ========================================

// ✅ Obtener lección específica
router.get('/:id', 
    param('id').isInt({ min: 1 }),
    leccionController.obtenerLeccion
);

// ✅ Actualizar lección
router.put('/:id',
    authMiddleware.verificarRol(['profesor', 'admin']),  // ✅ CORREGIDO
    param('id').isInt({ min: 1 }),
    leccionController.actualizarLeccion
);

// ✅ Eliminar lección
router.delete('/:id',
    authMiddleware.verificarRol(['profesor', 'admin']),  // ✅ CORREGIDO
    param('id').isInt({ min: 1 }),
    leccionController.eliminarLeccion
);

// ✅ Registrar progreso de lección
router.post('/:id/progreso',
    param('id').isInt({ min: 1 }),
    validarProgreso,
    leccionController.registrarProgreso
);

// ✅ Completar lección (con validación de aprobación)
router.post('/:id/completar',
    param('id').isInt({ min: 1 }),
    body('ejercicios_correctos').isInt({ min: 0 }),
    body('total_ejercicios').isInt({ min: 1 }),
    body('xp_acumulado').optional().isInt({ min: 0 }),
    leccionController.completarLeccion
);

module.exports = router;