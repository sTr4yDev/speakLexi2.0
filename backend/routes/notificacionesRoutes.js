// backend/routes/notificacionesRoutes.js
const express = require('express');
const router = express.Router();
const notificacionesController = require('../controllers/notificacionesController');
const authMiddleware = require('../middleware/authMiddleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware.verificarToken);

// @route   GET /api/notificaciones
// @desc    Obtener notificaciones del usuario
// @access  Private
router.get('/', notificacionesController.obtenerNotificaciones);

// @route   POST /api/notificaciones/:id/marcar-leida
// @desc    Marcar una notificación como leída
// @access  Private
router.post('/:id/marcar-leida', notificacionesController.marcarComoLeida);

// @route   POST /api/notificaciones/marcar-todas-leidas
// @desc    Marcar todas las notificaciones como leídas
// @access  Private
router.post('/marcar-todas-leidas', notificacionesController.marcarTodasComoLeidas);

// @route   DELETE /api/notificaciones/:id
// @desc    Eliminar una notificación
// @access  Private
router.delete('/:id', notificacionesController.eliminarNotificacion);

module.exports = router;