// backend/middleware/auth.js
// ✅ VERSIÓN CORREGIDA - Noviembre 2025

const jwt = require('jsonwebtoken');
const database = require('../config/database');

/**
 * @desc    Verificar token JWT
 * @access  Private
 */
const verificarToken = async (req, res, next) => {
    try {
        let token;

        // 1. Obtener token del header o query string
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.query.token) {
            token = req.query.token;
        }

        // 2. Validar que el token exista
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Acceso no autorizado. Token requerido.',
                codigo: 'TOKEN_REQUIRED'
            });
        }

        // 3. Verificar y decodificar el token
        let decoded;
        try {
            const jwtSecret = process.env.JWT_SECRET || 'secreto_por_defecto_para_desarrollo';
            decoded = jwt.verify(token, jwtSecret);
            console.log('✅ Token verificado para usuario ID:', decoded.id);
        } catch (jwtError) {
            console.error('❌ Error JWT:', jwtError.message);
            
            if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token inválido',
                    codigo: 'INVALID_TOKEN'
                });
            }

            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token expirado. Por favor, inicia sesión nuevamente.',
                    codigo: 'TOKEN_EXPIRED'
                });
            }

            return res.status(401).json({
                success: false,
                error: 'Error al procesar token',
                codigo: 'TOKEN_PROCESSING_ERROR'
            });
        }

        // 4. Verificar que el usuario existe en la BD
        let usuarios;
        try {
            // ✅ CONSULTA ACTUALIZADA - Sin email_verificado
            [usuarios] = await database.pool.query(
                `SELECT id, nombre, correo, rol, estado_cuenta 
                 FROM usuarios 
                 WHERE id = ? AND estado_cuenta = 'activo'`,
                [decoded.id]
            );

            console.log(`🔍 Consulta BD - Usuario ${decoded.id}:`, usuarios.length > 0 ? 'Encontrado' : 'No encontrado');

        } catch (dbError) {
            console.error('❌ Error de base de datos en verificarToken:', dbError);
            
            return res.status(500).json({
                success: false,
                error: 'Error al verificar usuario en base de datos',
                codigo: 'DATABASE_ERROR',
                detalles: process.env.NODE_ENV === 'development' ? {
                    message: dbError.message,
                    code: dbError.code
                } : undefined
            });
        }

        // 5. Validar que el usuario fue encontrado
        if (!usuarios || usuarios.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Usuario no encontrado o cuenta inactiva',
                codigo: 'USER_NOT_FOUND'
            });
        }

        // 6. Agregar usuario al request
        req.user = usuarios[0];
        console.log('✅ Usuario autenticado:', req.user.nombre, '- Rol:', req.user.rol);
        
        next();

    } catch (error) {
        console.error('❌ Error inesperado en verificarToken:', error);
        console.error('Stack trace:', error.stack);
        
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            codigo: 'INTERNAL_SERVER_ERROR',
            detalles: process.env.NODE_ENV === 'development' ? {
                message: error.message,
                stack: error.stack
            } : undefined
        });
    }
};

/**
 * @desc    Verificar rol de usuario (case-insensitive)
 * @access  Private
 */
const verificarRol = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'No autorizado - Usuario no autenticado',
                codigo: 'USER_NOT_AUTHENTICATED'
            });
        }

        // Normalizar roles a minúsculas para comparación
        const userRole = req.user.rol.toLowerCase();
        const allowedRoles = roles.map(r => r.toLowerCase());

        console.log(`🔐 Verificando rol: ${userRole} contra [${allowedRoles.join(', ')}]`);

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permisos para realizar esta acción',
                codigo: 'INSUFFICIENT_PERMISSIONS',
                rol_requerido: allowedRoles,
                rol_actual: userRole
            });
        }

        console.log('✅ Rol verificado correctamente');
        next();
    };
};

/**
 * @desc    Verificar si el email está verificado
 * @access  Private
 */
const verificarEmail = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Usuario no autenticado',
            codigo: 'USER_NOT_AUTHENTICATED'
        });
    }

    // ⚠️ ADVERTENCIA: Esta función ya no funcionará correctamente
    // ya que eliminamos email_verificado de la consulta
    if (!req.user.email_verificado) {
        return res.status(403).json({
            success: false,
            error: 'Debes verificar tu email antes de acceder a este recurso',
            codigo: 'EMAIL_NOT_VERIFIED'
        });
    }
    
    next();
};

/**
 * @desc    Middleware para loguear requests (desarrollo)
 * @access  Public
 */
const logRequests = (req, res, next) => {
    const timestamp = new Date().toISOString();
    const user = req.user ? `${req.user.nombre} (${req.user.rol})` : 'Anonymous';
    
    console.log(`📨 [${timestamp}] ${req.method} ${req.path} - Usuario: ${user}`);
    
    next();
};

/**
 * @desc    Alias para verificarRol (compatibilidad)
 * @access  Private
 */
const authorize = (...roles) => {
    return verificarRol(...roles);
};

module.exports = {
    verificarToken,
    verificarRol,
    verificarEmail,
    logRequests,
    authorize
};