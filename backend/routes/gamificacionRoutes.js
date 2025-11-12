const express = require('express');
const router = express.Router();
const gamificacionController = require('../controllers/gamificacionController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * RUTAS: Gamificación (XP, Niveles, Rankings, Logros)
 * Todas las rutas requieren autenticación
 */

// ===================================
// RANKINGS (RF-12)
// ===================================

// Ranking global (TOP usuarios por XP total)
router.get('/ranking/global', 
    authMiddleware.verificarToken, 
    gamificacionController.obtenerRankingGlobal
);

// Ranking semanal
router.get('/ranking/semanal', 
    authMiddleware.verificarToken, 
    gamificacionController.obtenerRankingSemanal
);

// Ranking mensual
router.get('/ranking/mensual', 
    authMiddleware.verificarToken, 
    gamificacionController.obtenerRankingMensual
);

// Ranking por nivel CEFR (A1, A2, B1, B2, C1, C2)
router.get('/ranking/nivel/:nivel', 
    authMiddleware.verificarToken, 
    gamificacionController.obtenerRankingPorNivel
);

// Obtener mi posición en el ranking
router.get('/mi-posicion', 
    authMiddleware.verificarToken, 
    gamificacionController.obtenerMiPosicion
);

// ===================================
// PUNTOS Y NIVEL (RF-11)
// ===================================

// Obtener puntos XP del usuario actual
router.get('/puntos', 
    authMiddleware.verificarToken, 
    gamificacionController.obtenerPuntosUsuario
);

// Obtener nivel del usuario actual
router.get('/nivel', 
    authMiddleware.verificarToken, 
    gamificacionController.obtenerNivelUsuario
);

// ===================================
// RACHA (RF-11)
// ===================================

// Obtener racha del usuario actual
router.get('/racha', 
    authMiddleware.verificarToken, 
    gamificacionController.obtenerRachaUsuario
);

// ===================================
// LOGROS (RF-11)
// ===================================

// Obtener logros del usuario actual
router.get('/logros', 
    authMiddleware.verificarToken, 
    gamificacionController.obtenerLogrosUsuario
);

// Desbloquear logro específico
router.post('/logros/:logroId/desbloquear', 
    authMiddleware.verificarToken, 
    gamificacionController.desbloquearLogro
);

// ===================================
// ADMIN/TESTING (RF-11)
// ===================================

// Otorgar puntos manualmente (para testing/admin)
router.post(
    '/otorgar-puntos', 
    authMiddleware.verificarToken,
    authMiddleware.verificarRol(['admin', 'profesor']), // Solo admin/profesor
    gamificacionController.otorgarPuntos
);

module.exports = router;