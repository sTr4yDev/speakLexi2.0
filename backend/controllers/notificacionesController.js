// backend/controllers/notificacionesController.js
const { pool } = require('../config/database');

// @desc    Obtener todas las notificaciones del usuario
// @route   GET /api/notificaciones
// @access  Private
exports.obtenerNotificaciones = async (req, res) => {
    try {
        const usuarioId = req.user.id;
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;

        const query = `
            SELECT 
                id,
                tipo,
                titulo,
                descripcion,
                leida,
                url,
                creado_en
            FROM notificaciones
            WHERE usuario_id = ?
            ORDER BY creado_en DESC
            LIMIT ${limit} OFFSET ${offset}
        `;

        // ✅ SOLO PASAR usuario_id como parámetro
        const [notificaciones] = await pool.execute(query, [usuarioId]);

        // Contar total de notificaciones
        const [countResult] = await pool.execute(
            'SELECT COUNT(*) as total FROM notificaciones WHERE usuario_id = ?',
            [usuarioId]
        );

        // Contar no leídas
        const [noLeidasResult] = await pool.execute(
            'SELECT COUNT(*) as total FROM notificaciones WHERE usuario_id = ? AND leida = 0',
            [usuarioId]
        );

        res.json({
            success: true,
            data: notificaciones,
            total: countResult[0].total,
            no_leidas: noLeidasResult[0].total,
            paginacion: {
                limit: limit,
                offset: offset,
                hasMore: (offset + notificaciones.length) < countResult[0].total
            }
        });

    } catch (error) {
        console.error('Error obteniendo notificaciones:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener notificaciones'
        });
    }
};

// @desc    Marcar una notificación como leída
// @route   POST /api/notificaciones/:id/marcar-leida
// @access  Private
exports.marcarComoLeida = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.user.id;

        // Verificar que la notificación pertenece al usuario
        const [notificacion] = await pool.execute(
            'SELECT id FROM notificaciones WHERE id = ? AND usuario_id = ?',
            [id, usuarioId]
        );

        if (notificacion.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Notificación no encontrada'
            });
        }

        // Marcar como leída
        await pool.execute(
            'UPDATE notificaciones SET leida = 1 WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            mensaje: 'Notificación marcada como leída'
        });

    } catch (error) {
        console.error('Error marcando notificación como leída:', error);
        res.status(500).json({
            success: false,
            error: 'Error al marcar notificación como leída'
        });
    }
};

// @desc    Marcar todas las notificaciones como leídas
// @route   POST /api/notificaciones/marcar-todas-leidas
// @access  Private
exports.marcarTodasComoLeidas = async (req, res) => {
    try {
        const usuarioId = req.user.id;

        await pool.execute(
            'UPDATE notificaciones SET leida = 1 WHERE usuario_id = ? AND leida = 0',
            [usuarioId]
        );

        res.json({
            success: true,
            mensaje: 'Todas las notificaciones marcadas como leídas'
        });

    } catch (error) {
        console.error('Error marcando todas como leídas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al marcar todas las notificaciones como leídas'
        });
    }
};

// @desc    Eliminar una notificación
// @route   DELETE /api/notificaciones/:id
// @access  Private
exports.eliminarNotificacion = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.user.id;

        // Verificar que la notificación pertenece al usuario
        const [notificacion] = await pool.execute(
            'SELECT id FROM notificaciones WHERE id = ? AND usuario_id = ?',
            [id, usuarioId]
        );

        if (notificacion.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Notificación no encontrada'
            });
        }

        // Eliminar
        await pool.execute('DELETE FROM notificaciones WHERE id = ?', [id]);

        res.json({
            success: true,
            mensaje: 'Notificación eliminada'
        });

    } catch (error) {
        console.error('Error eliminando notificación:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar notificación'
        });
    }
};

// ============================================
// FUNCIÓN AUXILIAR - CREAR NOTIFICACIÓN
// ============================================

/**
 * Crear una notificación para un usuario
 * @param {number} usuarioId - ID del usuario
 * @param {string} tipo - Tipo de notificación
 * @param {string} titulo - Título de la notificación
 * @param {string} descripcion - Descripción
 * @param {string} url - URL opcional
 */
exports.crearNotificacion = async (usuarioId, tipo, titulo, descripcion, url = null) => {
    try {
        const query = `
            INSERT INTO notificaciones (usuario_id, tipo, titulo, descripcion, url, leida, creado_en)
            VALUES (?, ?, ?, ?, ?, 0, NOW())
        `;

        const [result] = await pool.execute(query, [usuarioId, tipo, titulo, descripcion, url]);

        console.log(`✅ Notificación creada para usuario ${usuarioId}: ${titulo}`);
        return result.insertId;

    } catch (error) {
        console.error('Error creando notificación:', error);
        throw error;
    }
};