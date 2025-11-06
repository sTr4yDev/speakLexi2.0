// backend/routes/ejercicioRoutes.js
const express = require('express');
const router = express.Router();
const ejercicioController = require('../controllers/ejercicioController');
const { verificarToken, authorize } = require('../middleware/auth');

// Obtener ejercicios de una lección
router.get(
    '/leccion/:leccion_id',
    verificarToken,
    ejercicioController.obtenerEjerciciosLeccion
);

// Crear ejercicio
router.post(
    '/',
    verificarToken,
    authorize('admin', 'profesor'),
    ejercicioController.crearEjercicio
);

// Actualizar ejercicio
router.put(
    '/:id',
    verificarToken,
    authorize('admin', 'profesor'),
    ejercicioController.actualizarEjercicio
);

// Eliminar ejercicio
router.delete(
    '/:id',
    verificarToken,
    authorize('admin', 'profesor'),
    ejercicioController.eliminarEjercicio
);

// Validar respuesta
router.post(
    '/:id/validar',
    verificarToken,
    authorize('alumno', 'estudiante'),
    ejercicioController.validarRespuesta
);

module.exports = router;