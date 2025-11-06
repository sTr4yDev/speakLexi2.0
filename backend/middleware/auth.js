// backend/middleware/auth.js

const jwt = require('jsonwebtoken');
const database = require('../config/database');
const Usuario = require('../models/usuario');

// @desc    Verificar token JWT (versión unificada)
// @access  Private
const protect = async (req, res, next) => {
    try {
        let token;

        // Buscar token en múltiples ubicaciones
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } 
        // Obtener token de query string (para desarrollo)
        else if (req.query.token) {
            token = req.query.token;
        }
        // Obtener token de cookies
        else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Acceso no autorizado. Token requerido.',
                codigo: 'TOKEN_REQUIRED'
            });
        }

        // Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto_por_defecto_para_desarrollo');
        
        let usuario;
        
        // Intentar obtener usuario del modelo si existe, sino de la base de datos directa
        if (Usuario && typeof Usuario.obtenerPorId === 'function') {
            usuario = await Usuario.obtenerPorId(decoded.id);
        } else {
            // Fallback a consulta directa
            const [usuarios] = await database.query(
                `SELECT id, nombre, correo, rol, estado_cuenta, email_verificado 
                 FROM usuarios 
                 WHERE id = ? AND estado_cuenta = 'activo'`,
                [decoded.id]
            );
            usuario = usuarios.length > 0 ? usuarios[0] : null;
        }

        if (!usuario) {
            return res.status(401).json({
                success: false,
                error: 'Token inválido. Usuario no encontrado o cuenta inactiva.',
                codigo: 'USER_NOT_FOUND'
            });
        }

        // Agregar usuario al request
        req.user = usuario;
        next();

    } catch (error) {
        console.error('❌ Error verificando token:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Token inválido',
                codigo: 'INVALID_TOKEN'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expirado',
                codigo: 'TOKEN_EXPIRED'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al verificar token',
            codigo: 'TOKEN_VERIFICATION_ERROR'
        });
    }
};

// @desc    Verificar rol de usuario (versión mejorada)
// @access  Private
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'No autorizado - Usuario no autenticado'
            });
        }

        // Normalizar roles a minúsculas para comparación case-insensitive
        const userRole = req.user.rol.toLowerCase();
        const allowedRoles = roles.map(r => r.toLowerCase());

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permisos para esta acción',
                codigo: 'INSUFFICIENT_PERMISSIONS',
                rol_requerido: allowedRoles,
                rol_actual: userRole
            });
        }

        next();
    };
};

// @desc    Verificar si el email está verificado
// @access  Private
const requireVerifiedEmail = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Usuario no autenticado',
            codigo: 'USER_NOT_AUTHENTICATED'
        });
    }

    if (!req.user.email_verificado) {
        return res.status(403).json({
            success: false,
            error: 'Debes verificar tu email antes de acceder a este recurso',
            codigo: 'EMAIL_NOT_VERIFIED'
        });
    }
    next();
};

// @desc    Middleware opcional - permite autenticación pero no la requiere
// @access  Public/Private
const optionalAuth = async (req, res, next) => {
    let token;

    // Buscar token en múltiples ubicaciones
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } 
    else if (req.query.token) {
        token = req.query.token;
    }
    else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        // No hay token, continuar sin usuario
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto_por_defecto_para_desarrollo');
        
        let usuario;
        
        // Intentar obtener usuario del modelo si existe, sino de la base de datos directa
        if (Usuario && typeof Usuario.obtenerPorId === 'function') {
            usuario = await Usuario.obtenerPorId(decoded.id);
        } else {
            // Fallback a consulta directa
            const [usuarios] = await database.query(
                `SELECT id, nombre, correo, rol, estado_cuenta, email_verificado 
                 FROM usuarios 
                 WHERE id = ? AND estado_cuenta = 'activo'`,
                [decoded.id]
            );
            usuario = usuarios.length > 0 ? usuarios[0] : null;
        }

        if (usuario && usuario.estado_cuenta === 'activo') {
            req.user = usuario;
        }

        next();
    } catch (error) {
        // Token inválido, continuar sin usuario
        console.warn('⚠️ Token inválido en autenticación opcional:', error.message);
        next();
    }
};

// @desc    Middleware para loguear requests
// @access  Private/Public
const logRequests = (req, res, next) => {
    const userInfo = req.user ? `Usuario: ${req.user.id}` : 'Anonymous';
    
    console.log(`📨 ${req.method} ${req.originalUrl}`, {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        user: userInfo
    });
    
    next();
};

// @desc    Middleware para verificar propiedad del recurso
// @access  Private
const requireOwnership = (resourceOwnerField = 'user_id') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'No autorizado - Usuario no autenticado'
            });
        }

        // Si es admin, permitir acceso a cualquier recurso
        if (req.user.rol.toLowerCase() === 'admin') {
            return next();
        }

        // Verificar que el usuario sea el propietario del recurso
        const resourceOwnerId = req.params[resourceOwnerField] || req.body[resourceOwnerField];
        
        if (!resourceOwnerId) {
            return res.status(400).json({
                success: false,
                error: 'No se pudo determinar el propietario del recurso'
            });
        }

        if (parseInt(resourceOwnerId) !== parseInt(req.user.id)) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permisos para acceder a este recurso',
                codigo: 'RESOURCE_OWNERSHIP_REQUIRED'
            });
        }

        next();
    };
};

// Aliases para compatibilidad con código existente
const verificarToken = protect;
const verificarRol = authorize;
const verificarEmail = requireVerifiedEmail;

module.exports = {
    // Funciones principales
    protect,
    authorize,
    requireVerifiedEmail,
    optionalAuth,
    requireOwnership,
    logRequests,
    
    // Aliases para compatibilidad
    verificarToken,
    verificarRol,
    verificarEmail
};