/* ============================================
   SPEAKLEXI - RUTAS DE ESTADÍSTICAS
   Módulo 4: Gestión de Desempeño (UC-13)
   ============================================ */

const express = require('express');
const router = express.Router();
const estadisticasController = require('../controllers/estadisticasController');
const authMiddleware = require('../middleware/authMiddleware');

// =================================================================
// RUTAS EXISTENTES
// =================================================================

/**
 * @route   GET /api/estadisticas/generales
 * @desc    Obtener estadísticas generales del profesor
 * @access  Profesor
 */
router.get('/generales',
    authMiddleware.verificarToken,
    authMiddleware.verificarRol(['profesor', 'admin']),
    estadisticasController.obtenerEstadisticasGenerales
);

/**
 * @route   GET /api/estadisticas/alumnos
 * @desc    Obtener lista de alumnos con su progreso
 * @query   nivel, idioma, ordenar, limite
 * @access  Profesor
 */
router.get('/alumnos',
    authMiddleware.verificarToken,
    authMiddleware.verificarRol(['profesor', 'admin']),
    estadisticasController.obtenerListaAlumnos
);

/**
 * @route   GET /api/estadisticas/alumno/:id
 * @desc    Obtener progreso individual detallado de un alumno
 * @access  Profesor
 */
router.get('/alumno/:id',
    authMiddleware.verificarToken,
    authMiddleware.verificarRol(['profesor', 'admin']),
    estadisticasController.obtenerProgresoIndividual
);

/**
 * @route   GET /api/estadisticas/tiempos-promedio
 * @desc    Obtener tiempos promedio por lección
 * @access  Profesor
 */
router.get('/tiempos-promedio',
    authMiddleware.verificarToken,
    authMiddleware.verificarRol(['profesor', 'admin']),
    estadisticasController.obtenerTiemposPromedio
);

/**
 * @route   GET /api/estadisticas/tasas-completitud
 * @desc    Obtener tasas de completitud por nivel/idioma
 * @query   agrupar_por (nivel|idioma)
 * @access  Profesor
 */
router.get('/tasas-completitud',
    authMiddleware.verificarToken,
    authMiddleware.verificarRol(['profesor', 'admin']),
    estadisticasController.obtenerTasasCompletitud
);

/**
 * @route   GET /api/estadisticas/tendencia
 * @desc    Obtener tendencia de progreso semanal/mensual
 * @query   periodo (semanal|mensual)
 * @access  Profesor
 */
router.get('/tendencia',
    authMiddleware.verificarToken,
    authMiddleware.verificarRol(['profesor', 'admin']),
    estadisticasController.obtenerTendencia
);

// =================================================================
// 🆕 NUEVAS RUTAS PARA DASHBOARD PROFESOR
// =================================================================

/**
 * @route   GET /api/estadisticas/resumen-general
 * @desc    Obtener resumen general de todos los estudiantes (para profesor)
 * @access  Profesor, Admin
 */
router.get('/resumen-general',
    authMiddleware.verificarToken,
    authMiddleware.verificarRol(['profesor', 'admin']),
    estadisticasController.obtenerResumenGeneral
);

/**
 * @route   GET /api/estadisticas/estudiantes
 * @desc    Obtener lista de estudiantes con sus estadísticas
 * @query   limite, pagina, nivel, idioma, orden
 * @access  Profesor, Admin
 */
router.get('/estudiantes',
    authMiddleware.verificarToken,
    authMiddleware.verificarRol(['profesor', 'admin']),
    estadisticasController.obtenerListaEstudiantes
);

/**
 * @route   GET /api/estadisticas/estudiantes/:id
 * @desc    Obtener detalle de un estudiante específico
 * @access  Profesor, Admin
 */
router.get('/estudiantes/:id',
    authMiddleware.verificarToken,
    authMiddleware.verificarRol(['profesor', 'admin']),
    estadisticasController.obtenerDetalleEstudiante
);

/**
 * @route   GET /api/estadisticas/estudiantes-alerta
 * @desc    Obtener estudiantes con bajo rendimiento (alertas)
 * @access  Profesor, Admin
 */
router.get('/estudiantes-alerta',
    authMiddleware.verificarToken,
    authMiddleware.verificarRol(['profesor', 'admin']),
    estadisticasController.obtenerEstudiantesAlerta
);

module.exports = router;