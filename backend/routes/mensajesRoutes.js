// backend/routes/mensajesRoutes.js
const express = require('express');
const router = express.Router();
const mensajesController = require('../controllers/mensajesController');
const authMiddleware = require('../middleware/authMiddleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware.verificarToken);

// @route   GET /api/mensajes
// @desc    Obtener todos los mensajes del usuario
// @access  Private
router.get('/', mensajesController.obtenerMensajes);

// @route   GET /api/mensajes/no-leidos
// @desc    Obtener mensajes no leídos
// @access  Private
router.get('/no-leidos', mensajesController.obtenerMensajesNoLeidos);

// @route   GET /api/mensajes/:id
// @desc    Obtener un mensaje específico
// @access  Private
router.get('/:id', mensajesController.obtenerMensaje);

// @route   POST /api/mensajes
// @desc    Enviar un nuevo mensaje
// @access  Private
router.post('/', mensajesController.enviarMensaje);

// @route   POST /api/mensajes/:id/marcar-leido
// @desc    Marcar un mensaje como leído
// @access  Private
router.post('/:id/marcar-leido', mensajesController.marcarComoLeido);

// @route   DELETE /api/mensajes/:id
// @desc    Eliminar un mensaje
// @access  Private
router.delete('/:id', mensajesController.eliminarMensaje);

module.exports = router;