// backend/routes/authRoutes.js
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');

// Middleware de validación
const validacionesRegistro = [
  body('nombre')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  
  body('primer_apellido')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El primer apellido debe tener entre 2 y 50 caracteres'),
  
  body('correo')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe ser un email válido'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número')
];

const validacionesLogin = [
  body('correo')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe ser un email válido'),
  
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
];

const validacionesVerificacion = [
  body('correo')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe ser un email válido'),
  
  body('codigo')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('El código debe ser de 6 dígitos numéricos')
];

// Rutas públicas con validaciones
router.post('/registro', validacionesRegistro, authController.registro);
router.post('/login', validacionesLogin, authController.login);
router.post('/verificar-email', validacionesVerificacion, authController.verificarEmail);
router.post('/reenviar-codigo', authController.reenviarCodigoVerificacion);

// Ruta de salud de la API
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Auth Service',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Ruta para obtener configuración pública
router.get('/config', (req, res) => {
  res.json({
    auth: {
      password_min_length: 8,
      password_requirements: {
        min_uppercase: 1,
        min_lowercase: 1,
        min_numbers: 1,
        min_special_chars: 0
      },
      verification_code_length: 6,
      verification_code_expiry: 10 // minutos
    },
    features: {
      email_verification: true,
      password_reset: true,
      account_recovery: true
    }
  });
});

module.exports = router;