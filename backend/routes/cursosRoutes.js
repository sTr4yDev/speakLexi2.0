// backend/routes/cursosRoutes.js
const express = require('express');
const router = express.Router();
const cursosController = require('../controllers/cursosController');
const { protect, authorize } = require('../middleware/auth');

// ============================================
// RUTAS PÚBLICAS
// ============================================

// Listar todos los cursos (con filtros)
router.get('/', cursosController.listarCursos);

// Obtener cursos por nivel
router.get('/nivel/:nivel', cursosController.obtenerCursosPorNivel);

// ============================================
// RUTAS PROTEGIDAS - ESTUDIANTES
// ============================================

// ⚠️ IMPORTANTE: Esta ruta DEBE ir ANTES de '/:id'
// Obtener mis cursos inscritos
router.get(
    '/estudiante/mis-cursos', 
    protect, 
    authorize('alumno', 'estudiante'), 
    cursosController.obtenerMisCursos
);

// ============================================
// RUTAS CON :id (DEBEN IR DESPUÉS DE RUTAS ESPECÍFICAS)
// ============================================

// Obtener curso específico por ID
router.get('/:id', cursosController.obtenerCurso);

// Obtener lecciones de un curso (con progreso si está autenticado)
router.get('/:id/lecciones', protect, cursosController.obtenerLeccionesCurso);

// Inscribirse a un curso
router.post(
    '/:id/inscribir', 
    protect, 
    authorize('alumno', 'estudiante'), 
    cursosController.inscribirEstudiante
);

// Obtener progreso en un curso
router.get(
    '/:id/progreso', 
    protect, 
    authorize('alumno', 'estudiante'), 
    cursosController.obtenerProgresoEstudiante
);

// Obtener siguiente lección
router.get(
    '/:id/siguiente-leccion', 
    protect, 
    authorize('alumno', 'estudiante'), 
    cursosController.obtenerSiguienteLeccion
);

// ============================================
// RUTAS PROTEGIDAS - PROFESORES/ADMIN
// ============================================

// Crear nuevo curso
router.post(
    '/', 
    protect, 
    authorize('profesor', 'admin'), 
    cursosController.crearCurso
);

// Actualizar curso
router.put(
    '/:id', 
    protect, 
    authorize('profesor', 'admin'), 
    cursosController.actualizarCurso
);

// Eliminar curso
router.delete(
    '/:id', 
    protect, 
    authorize('admin'), 
    cursosController.eliminarCurso
);

// ⚠️ IMPORTANTE: Esta ruta DEBE ir ANTES de '/:id' o usar un prefijo diferente
// Obtener estadísticas de cursos
router.get(
    '/admin/estadisticas', 
    protect, 
    authorize('admin'), 
    cursosController.obtenerEstadisticas
);

module.exports = router;