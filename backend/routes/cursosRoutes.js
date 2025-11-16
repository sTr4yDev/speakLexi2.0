// backend/routes/cursosRoutes.js
const express = require('express');
const router = express.Router();
const cursosController = require('../controllers/cursosController');
const { verificarToken, authorize } = require('../middleware/auth');

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

// Obtener mis cursos inscritos
router.get(
    '/estudiante/mis-cursos', 
    verificarToken, 
    authorize('alumno', 'estudiante'), 
    cursosController.obtenerMisCursos
);

// ============================================
// RUTAS PROTEGIDAS - ADMIN
// ============================================

// Obtener estadísticas de cursos
router.get(
    '/admin/estadisticas', 
    verificarToken, 
    authorize('admin'), 
    cursosController.obtenerEstadisticas
);

// ============================================
// RUTAS CON :id (DEBEN IR DESPUÉS DE RUTAS ESPECÍFICAS)
// ============================================

// Obtener curso específico por ID
router.get('/:id', cursosController.obtenerCurso);

// Obtener lecciones de un curso (con progreso si está autenticado)
router.get('/:id/lecciones', verificarToken, cursosController.obtenerLeccionesCurso);

// Inscribirse a un curso
router.post(
    '/:id/inscribir', 
    verificarToken, 
    authorize('alumno', 'estudiante'), 
    cursosController.inscribirEstudiante
);

// Obtener progreso en un curso
router.get(
    '/:id/progreso', 
    verificarToken, 
    authorize('alumno', 'estudiante'), 
    cursosController.obtenerProgresoEstudiante
);

// Obtener siguiente lección
router.get(
    '/:id/siguiente-leccion', 
    verificarToken, 
    authorize('alumno', 'estudiante'), 
    cursosController.obtenerSiguienteLeccion
);

// ============================================
// RUTAS PROTEGIDAS - PROFESORES/ADMIN
// ============================================

// Crear nuevo curso
router.post(
    '/', 
    verificarToken, 
    authorize('profesor', 'admin'), 
    cursosController.crearCurso
);

// Actualizar curso
router.put(
    '/:id', 
    verificarToken, 
    authorize('profesor', 'admin'), 
    cursosController.actualizarCurso
);

// Eliminar curso
router.delete(
    '/:id', 
    verificarToken, 
    authorize('admin'), 
    cursosController.eliminarCurso
);

module.exports = router;