/* ============================================
   SPEAKLEXI - RUTAS DE RETROALIMENTACIÓN
   Módulo 4: Gestión de Desempeño (UC-14)
   ============================================ */

const express = require('express');
const router = express.Router();
const retroalimentacionController = require('../controllers/retroalimentacionController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @route   POST /api/retroalimentacion
 * @desc    Crear un nuevo comentario/retroalimentación
 * @body    leccion_id, tipo, asunto, mensaje, es_privado
 * @access  Estudiante/Profesor
 */
router.post('/',
    authMiddleware.verificarToken,
    authMiddleware.verificarRol(['alumno', 'profesor', 'admin']),
    retroalimentacionController.crearComentario
);

/**
 * @route   GET /api/retroalimentacion
 * @desc    Obtener todos los comentarios para el profesor
 * @query   tipo, leccion_id, solo_sin_respuesta, limite, offset
 * @access  Profesor
 */
router.get('/',
    authMiddleware.verificarToken,
    authMiddleware.verificarRol(['profesor', 'admin']),
    retroalimentacionController.obtenerComentarios
);

/**
 * @route   GET /api/retroalimentacion/estadisticas
 * @desc    Obtener estadísticas de retroalimentación
 * @access  Profesor
 */
router.get('/estadisticas',
    authMiddleware.verificarToken,
    authMiddleware.verificarRol(['profesor', 'admin']),
    retroalimentacionController.obtenerEstadisticas
);

/**
 * @route   GET /api/retroalimentacion/analisis/recurrentes
 * @desc    Análisis de comentarios recurrentes
 * @query   periodo (días)
 * @access  Profesor
 */
router.get('/analisis/recurrentes',
    authMiddleware.verificarToken,
    authMiddleware.verificarRol(['profesor', 'admin']),
    retroalimentacionController.analizarRecurrentes
);

/**
 * @route   GET /api/retroalimentacion/:id
 * @desc    Obtener detalles de un comentario específico
 * @access  Profesor/Estudiante (autor)
 */
router.get('/:id',
    authMiddleware.verificarToken,
    retroalimentacionController.obtenerComentarioPorId
);

/**
 * @route   POST /api/retroalimentacion/:id/responder
 * @desc    Responder a un comentario
 * @body    mensaje
 * @access  Profesor
 */
router.post('/:id/responder',
    authMiddleware.verificarToken,
    authMiddleware.verificarRol(['profesor', 'admin']),
    retroalimentacionController.responderComentario
);

/**
 * @route   PATCH /api/retroalimentacion/:id/resolver
 * @desc    Marcar comentario como resuelto
 * @access  Profesor
 */
router.patch('/:id/resolver',
    authMiddleware.verificarToken,
    authMiddleware.verificarRol(['profesor', 'admin']),
    retroalimentacionController.marcarResuelto
);

module.exports = router;