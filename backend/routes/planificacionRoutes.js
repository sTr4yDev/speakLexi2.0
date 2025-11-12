/* ============================================
   SPEAKLEXI - RUTAS DE PLANIFICACIÓN
   Módulo 4: Gestión de Desempeño (UC-15)
   ============================================ */

const express = require('express');
const router = express.Router();
const planificacionController = require('../controllers/planificacionController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @route   GET /api/planificacion/areas-mejora
 * @desc    Identificar áreas de mejora comunes
 * @access  Profesor
 */
router.get('/areas-mejora',
    authMiddleware.verificarToken,
    authMiddleware.verificarRol(['profesor', 'admin']),
    planificacionController.identificarAreasMejora
);

/**
 * @route   GET /api/planificacion/sugerencias-contenido
 * @desc    Generar sugerencias de contenido adicional
 * @access  Profesor
 */
router.get('/sugerencias-contenido',
    authMiddleware.verificarToken,
    authMiddleware.verificarRol(['profesor', 'admin']),
    planificacionController.generarSugerencias
);

/**
 * @route   GET /api/planificacion/analisis-dificultad
 * @desc    Analizar dificultad de lecciones existentes
 * @access  Profesor
 */
router.get('/analisis-dificultad',
    authMiddleware.verificarToken,
    authMiddleware.verificarRol(['profesor', 'admin']),
    planificacionController.analizarDificultad
);

/**
 * @route   GET /api/planificacion/recomendaciones
 * @desc    Obtener recomendaciones consolidadas de planificación
 * @access  Profesor
 */
router.get('/recomendaciones',
    authMiddleware.verificarToken,
    authMiddleware.verificarRol(['profesor', 'admin']),
    planificacionController.obtenerRecomendaciones
);

module.exports = router;