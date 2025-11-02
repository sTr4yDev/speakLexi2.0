// ==========================================================
// middleware/auth.js - Middleware de autenticación JWT
// ==========================================================

const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Verificar token JWT
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Token de acceso requerido'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar que el usuario aún existe en la base de datos
    const user = await query(
      'SELECT id, correo, nombre, rol, estado FROM usuarios WHERE id = ?',
      [decoded.userId]
    );

    if (user.length === 0) {
      return res.status(401).json({
        error: 'Usuario no encontrado'
      });
    }

    if (user[0].estado !== 'activo') {
      return res.status(401).json({
        error: 'Cuenta desactivada'
      });
    }

    req.user = user[0];
    next();
  } catch (error) {
    console.error('Error verificando token:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado'
      });
    }
    
    return res.status(403).json({
      error: 'Token inválido'
    });
  }
};

// Verificar rol de administrador
const requireAdmin = (req, res, next) => {
  if (req.user.rol !== 'admin' && req.user.rol !== 'administrador') {
    return res.status(403).json({
      error: 'Se requieren permisos de administrador'
    });
  }
  next();
};

// Verificar rol de profesor
const requireTeacher = (req, res, next) => {
  if (req.user.rol !== 'profesor' && req.user.rol !== 'admin') {
    return res.status(403).json({
      error: 'Se requieren permisos de profesor'
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireTeacher
};