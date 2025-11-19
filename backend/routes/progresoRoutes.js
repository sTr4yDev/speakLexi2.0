const express = require('express');
const router = express.Router();
const progresoController = require('../controllers/progresoController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * RUTAS: Progreso de Lecciones y Cursos
 */

// ===================================
// RUTAS PARA DASHBOARD ESTUDIANTE
// ===================================

// Obtener logros del estudiante
router.get(
    '/logros', 
    authMiddleware.verificarToken,
    authMiddleware.verificarRol(['alumno']),
    progresoController.obtenerLogrosEstudiante
);

// Obtener resumen completo del dashboard - CORREGIDO
router.get(
    '/resumen', 
    authMiddleware.verificarToken,
    authMiddleware.verificarRol(['alumno']),
    progresoController.obtenerResumenEstudiante  // ✅ CAMBIADO AQUÍ
);

// Obtener lecciones recomendadas
router.get(
    '/lecciones-recomendadas', 
    authMiddleware.verificarToken,
    authMiddleware.verificarRol(['alumno']),
    progresoController.obtenerLeccionesRecomendadas
);

// ===================================
// RUTAS DE REGISTRO DE PROGRESO
// ===================================

// Registrar progreso de lección
router.post(
    '/registrar', 
    authMiddleware.verificarToken,
    authMiddleware.verificarRol(['alumno']),
    progresoController.registrarProgresoLeccion
);

// Sincronizar progreso (para offline)
router.post(
    '/sincronizar', 
    authMiddleware.verificarToken,
    authMiddleware.verificarRol(['alumno']),
    progresoController.sincronizarProgreso
);

// ===================================
// RUTAS DE CONSULTA DE PROGRESO
// ===================================

// Obtener historial de progreso
router.get(
    '/historial', 
    authMiddleware.verificarToken,
    progresoController.obtenerHistorialProgreso
);

// Obtener progreso por lección específica
router.get(
    '/leccion/:leccionId', 
    authMiddleware.verificarToken,
    progresoController.obtenerProgresoPorLeccion
);

// Obtener progreso por curso específico
router.get(
    '/curso/:cursoId', 
    authMiddleware.verificarToken,
    progresoController.obtenerProgresoPorCurso
);

// ===================================
// ACTUALIZACIÓN DE PROGRESO DE CURSO
// ===================================

// Actualizar progreso de curso (cuando se completa una lección)
router.post(
    '/curso/:cursoId/actualizar', 
    authMiddleware.verificarToken,
    authMiddleware.verificarRol(['alumno']),
    progresoController.actualizarProgresoCurso
);

module.exports = router;