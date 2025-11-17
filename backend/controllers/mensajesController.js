// backend/controllers/mensajesController.js
const { pool } = require('../config/database');

// @desc    Obtener todos los mensajes del usuario
// @route   GET /api/mensajes
// @access  Private
exports.obtenerMensajes = async (req, res) => {
    try {
        const usuarioId = req.user.id;
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;

        const query = `
            SELECT 
                m.id,
                m.remitente_id,
                m.destinatario_id,
                m.mensaje,
                m.leido,
                UNIX_TIMESTAMP(m.creado_en) * 1000 as creado_en,
                CASE 
                    WHEN m.remitente_id = ? THEN 'enviado'
                    ELSE 'recibido'
                END as tipo,
                CASE 
                    WHEN m.remitente_id = ? THEN u_dest.nombre
                    ELSE u_rem.nombre
                END as nombre_contacto,
                CASE 
                    WHEN m.remitente_id = ? THEN u_dest.correo
                    ELSE u_rem.correo
                END as correo_contacto
            FROM mensajes m
            LEFT JOIN usuarios u_rem ON m.remitente_id = u_rem.id
            LEFT JOIN usuarios u_dest ON m.destinatario_id = u_dest.id
            WHERE m.remitente_id = ? OR m.destinatario_id = ?
            ORDER BY m.creado_en DESC
            LIMIT ${limit} OFFSET ${offset}
        `;

        const [mensajes] = await pool.execute(query, [
            usuarioId, usuarioId, usuarioId,
            usuarioId, usuarioId
        ]);

        // Contar total
        const [countResult] = await pool.execute(
            'SELECT COUNT(*) as total FROM mensajes WHERE remitente_id = ? OR destinatario_id = ?',
            [usuarioId, usuarioId]
        );

        res.json({
            success: true,
            data: mensajes,
            total: countResult[0].total,
            paginacion: {
                limit: limit,
                offset: offset,
                hasMore: (offset + mensajes.length) < countResult[0].total
            }
        });

    } catch (error) {
        console.error('Error obteniendo mensajes:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener mensajes'
        });
    }
};

// @desc    Obtener mensajes no leídos
// @route   GET /api/mensajes/no-leidos
// @access  Private
exports.obtenerMensajesNoLeidos = async (req, res) => {
    try {
        const usuarioId = req.user.id;

        const query = `
            SELECT 
                m.id,
                m.remitente_id,
                m.mensaje,
                m.leido,
                UNIX_TIMESTAMP(m.creado_en) * 1000 as creado_en,
                u.nombre as remitente_nombre,
                u.correo as remitente_correo
            FROM mensajes m
            INNER JOIN usuarios u ON m.remitente_id = u.id
            WHERE m.destinatario_id = ? AND m.leido = 0
            ORDER BY m.creado_en DESC
            LIMIT 10
        `;

        const [mensajes] = await pool.execute(query, [usuarioId]);

        res.json({
            success: true,
            data: mensajes,
            total_no_leidos: mensajes.length
        });

    } catch (error) {
        console.error('Error obteniendo mensajes no leídos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener mensajes no leídos'
        });
    }
};

// @desc    Obtener un mensaje específico
// @route   GET /api/mensajes/:id
// @access  Private
exports.obtenerMensaje = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.user.id;

        const query = `
            SELECT 
                m.id,
                m.remitente_id,
                m.destinatario_id,
                m.mensaje,
                m.leido,
                UNIX_TIMESTAMP(m.creado_en) * 1000 as creado_en,
                u_rem.nombre as remitente_nombre,
                u_dest.nombre as destinatario_nombre
            FROM mensajes m
            LEFT JOIN usuarios u_rem ON m.remitente_id = u_rem.id
            LEFT JOIN usuarios u_dest ON m.destinatario_id = u_dest.id
            WHERE m.id = ? AND (m.remitente_id = ? OR m.destinatario_id = ?)
        `;

        const [mensajes] = await pool.execute(query, [id, usuarioId, usuarioId]);

        if (mensajes.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Mensaje no encontrado'
            });
        }

        // Si es el destinatario y no está leído, marcarlo como leído
        const mensaje = mensajes[0];
        if (mensaje.destinatario_id === usuarioId && !mensaje.leido) {
            await pool.execute(
                'UPDATE mensajes SET leido = 1 WHERE id = ?',
                [id]
            );
            mensaje.leido = 1;
        }

        res.json({
            success: true,
            data: mensaje
        });

    } catch (error) {
        console.error('Error obteniendo mensaje:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener mensaje'
        });
    }
};

// @desc    Enviar un nuevo mensaje
// @route   POST /api/mensajes
// @access  Private
exports.enviarMensaje = async (req, res) => {
    try {
        const { destinatario_id, mensaje } = req.body;
        const remitenteId = req.user.id;

        // Validar datos
        if (!destinatario_id || !mensaje) {
            return res.status(400).json({
                success: false,
                error: 'Destinatario y mensaje son requeridos'
            });
        }

        if (mensaje.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'El mensaje no puede estar vacío'
            });
        }

        // Verificar que el destinatario existe
        const [destinatario] = await pool.execute(
            'SELECT id, nombre FROM usuarios WHERE id = ?',
            [destinatario_id]
        );

        if (destinatario.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Destinatario no encontrado'
            });
        }

        // Insertar mensaje
        const query = `
            INSERT INTO mensajes (remitente_id, destinatario_id, mensaje, leido, creado_en)
            VALUES (?, ?, ?, 0, NOW())
        `;

        const [result] = await pool.execute(query, [remitenteId, destinatario_id, mensaje]);

        // Obtener el mensaje recién creado con timestamp
        const [mensajeCreado] = await pool.execute(`
            SELECT 
                m.id,
                m.remitente_id,
                m.destinatario_id,
                m.mensaje,
                m.leido,
                UNIX_TIMESTAMP(m.creado_en) * 1000 as creado_en,
                u.nombre as nombre_contacto
            FROM mensajes m
            LEFT JOIN usuarios u ON m.destinatario_id = u.id
            WHERE m.id = ?
        `, [result.insertId]);

        // Crear notificación para el destinatario
        const notificacionesController = require('./notificacionesController');
        await notificacionesController.crearNotificacion(
            destinatario_id,
            'mensaje',
            'Nuevo mensaje',
            `Tienes un nuevo mensaje de ${req.user.nombre}`,
            `/mensajes?id=${result.insertId}`
        );

        res.status(201).json({
            success: true,
            mensaje: 'Mensaje enviado exitosamente',
            data: mensajeCreado[0]
        });

    } catch (error) {
        console.error('Error enviando mensaje:', error);
        res.status(500).json({
            success: false,
            error: 'Error al enviar mensaje'
        });
    }
};

// @desc    Marcar un mensaje como leído
// @route   POST /api/mensajes/:id/marcar-leido
// @access  Private
exports.marcarComoLeido = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.user.id;

        // Verificar que el mensaje es para este usuario
        const [mensaje] = await pool.execute(
            'SELECT id FROM mensajes WHERE id = ? AND destinatario_id = ?',
            [id, usuarioId]
        );

        if (mensaje.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Mensaje no encontrado'
            });
        }

        // Marcar como leído
        await pool.execute(
            'UPDATE mensajes SET leido = 1 WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            mensaje: 'Mensaje marcado como leído'
        });

    } catch (error) {
        console.error('Error marcando mensaje como leído:', error);
        res.status(500).json({
            success: false,
            error: 'Error al marcar mensaje como leído'
        });
    }
};

// @desc    Eliminar un mensaje
// @route   DELETE /api/mensajes/:id
// @access  Private
exports.eliminarMensaje = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.user.id;

        // Verificar que el mensaje pertenece al usuario (como remitente o destinatario)
        const [mensaje] = await pool.execute(
            'SELECT id FROM mensajes WHERE id = ? AND (remitente_id = ? OR destinatario_id = ?)',
            [id, usuarioId, usuarioId]
        );

        if (mensaje.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Mensaje no encontrado'
            });
        }

        // Eliminar
        await pool.execute('DELETE FROM mensajes WHERE id = ?', [id]);

        res.json({
            success: true,
            mensaje: 'Mensaje eliminado'
        });

    } catch (error) {
        console.error('Error eliminando mensaje:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar mensaje'
        });
    }
};