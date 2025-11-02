const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db = require('../config/database');
const emailService = require('../services/emailService');
const rateLimit = require('express-rate-limit');

// Rate limiting para endpoints sensibles
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos por ventana
  message: {
    error: 'Demasiados intentos, intenta más tarde',
    codigo: 'RATE_LIMIT_EXCEEDED'
  },
  skipSuccessfulRequests: true
});

// UC-04: Registrar usuario - MEJORADO
exports.registro = [
  authLimiter,
  async (req, res) => {
    try {
      // Validación de entrada con express-validator
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Datos de entrada inválidos',
          detalles: errors.array()
        });
      }

      const { 
        nombre, primer_apellido, segundo_apellido, 
        correo, password, idioma, nivel_actual 
      } = req.body;

      // Validación de fortaleza de contraseña
      if (password.length < 8) {
        return res.status(400).json({ 
          error: 'La contraseña debe tener al menos 8 caracteres',
          codigo: 'PASSWORD_TOO_SHORT'
        });
      }

      // Verificar correo existente de forma más segura
      const [existente] = await db.query(
        'SELECT id, estado_cuenta FROM usuarios WHERE correo = ?',
        [correo.toLowerCase().trim()]
      );

      if (existente.length > 0) {
        if (existente[0].estado_cuenta === 'pendiente_verificacion') {
          return res.status(400).json({ 
            error: 'Correo pendiente de verificación. Revisa tu email.',
            codigo: 'EMAIL_PENDING_VERIFICATION'
          });
        }
        return res.status(400).json({ 
          error: 'El correo ya está registrado',
          codigo: 'EMAIL_ALREADY_EXISTS'
        });
      }

      // Encriptar contraseña con salt rounds configurable
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const contrasena_hash = await bcrypt.hash(password, saltRounds);

      // Generar código de verificación más seguro
      const codigo_verificacion = Math.floor(100000 + Math.random() * 900000).toString();
      const expira_verificacion = new Date(Date.now() + 10 * 60 * 1000); // 10 min

      // Transacción para asegurar consistencia de datos
      const connection = await db.getConnection();
      await connection.beginTransaction();

      try {
        // Insertar usuario
        const [result] = await connection.query(
          `INSERT INTO usuarios 
           (nombre, primer_apellido, segundo_apellido, correo, contrasena_hash, 
            codigo_verificacion, expira_verificacion, rol, estado_cuenta) 
           VALUES (?, ?, ?, ?, ?, ?, ?, 'alumno', 'pendiente_verificacion')`,
          [
            nombre.trim(),
            primer_apellido.trim(),
            segundo_apellido ? segundo_apellido.trim() : null,
            correo.toLowerCase().trim(),
            contrasena_hash,
            codigo_verificacion,
            expira_verificacion
          ]
        );

        const usuario_id = result.insertId;

        // Crear perfiles en una sola operación
        const nombre_completo = `${nombre} ${primer_apellido}${segundo_apellido ? ' ' + segundo_apellido : ''}`.trim();
        
        await Promise.all([
          connection.query(
            `INSERT INTO perfil_usuarios (usuario_id, nombre_completo) 
             VALUES (?, ?)`,
            [usuario_id, nombre_completo]
          ),
          connection.query(
            `INSERT INTO perfil_estudiantes 
             (usuario_id, nivel_actual, idioma_aprendizaje) 
             VALUES (?, ?, ?)`,
            [usuario_id, nivel_actual || 'A1', idioma || 'Inglés']
          )
        ]);

        await connection.commit();

        // Enviar email de forma asíncrona (no bloqueante)
        emailService.enviarCodigoVerificacion(correo, codigo_verificacion)
          .catch(error => {
            console.error('Error enviando email (no crítico):', error);
            // No falla el registro si el email falla
          });

        // No exponer información sensible en la respuesta
        res.status(201).json({
          mensaje: 'Usuario registrado correctamente. Revisa tu email para verificar la cuenta.',
          usuario_id,
          correo: correo.toLowerCase(), // Email normalizado
          estado: 'pendiente_verificacion'
        });

      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

    } catch (error) {
      console.error('Error en registro:', error);
      
      // Respuestas de error más específicas
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ 
          error: 'El correo ya está registrado',
          codigo: 'DUPLICATE_EMAIL'
        });
      }
      
      res.status(500).json({ 
        error: 'Error interno del servidor al registrar usuario',
        codigo: 'INTERNAL_SERVER_ERROR'
      });
    }
  }
];

// UC-01: Iniciar sesión - MEJORADO
exports.login = [
  authLimiter,
  async (req, res) => {
    try {
      const { correo, password } = req.body;

      if (!correo || !password) {
        return res.status(400).json({ 
          error: 'Correo y contraseña requeridos',
          codigo: 'MISSING_CREDENTIALS'
        });
      }

      // Normalizar email
      const correoNormalizado = correo.toLowerCase().trim();

      // Buscar usuario con información mínima necesaria
      const [usuarios] = await db.query(
        `SELECT 
          u.id, u.nombre, u.primer_apellido, u.correo, u.contrasena_hash,
          u.rol, u.estado_cuenta, u.correo_verificado, u.fecha_desactivacion,
          p.nombre_completo, p.foto_perfil,
          pe.nivel_actual, pe.idioma_aprendizaje, pe.total_xp
         FROM usuarios u
         LEFT JOIN perfil_usuarios p ON u.id = p.usuario_id
         LEFT JOIN perfil_estudiantes pe ON u.id = pe.usuario_id
         WHERE u.correo = ?`,
        [correoNormalizado]
      );

      // Medida de seguridad: mismo mensaje para usuario no encontrado y contraseña incorrecta
      if (usuarios.length === 0) {
        // Delay artificial para prevenir timing attacks
        await new Promise(resolve => setTimeout(resolve, 500));
        return res.status(401).json({ 
          error: 'Credenciales inválidas',
          codigo: 'INVALID_CREDENTIALS'
        });
      }

      const usuario = usuarios[0];

      // Verificar contraseña con timing-safe comparison
      const passwordValido = await bcrypt.compare(password, usuario.contrasena_hash);
      
      if (!passwordValido) {
        return res.status(401).json({ 
          error: 'Credenciales inválidas',
          codigo: 'INVALID_CREDENTIALS'
        });
      }

      // Verificar estados de cuenta con códigos específicos
      if (usuario.estado_cuenta === 'desactivado') {
        const diasRestantes = usuario.fecha_desactivacion 
          ? Math.max(0, 30 - Math.floor((Date.now() - new Date(usuario.fecha_desactivacion)) / (1000 * 60 * 60 * 24)))
          : 0;
        
        return res.status(403).json({
          error: 'Cuenta desactivada',
          codigo: 'ACCOUNT_DEACTIVATED',
          dias_restantes: diasRestantes,
          usuario_id: usuario.id
        });
      }

      if (!usuario.correo_verificado) {
        // Opción de reenviar código de verificación
        return res.status(403).json({
          error: 'Debes verificar tu correo electrónico',
          codigo: 'EMAIL_NOT_VERIFIED',
          puede_reenviar: true,
          correo: usuario.correo
        });
      }

      if (usuario.estado_cuenta === 'bloqueado') {
        return res.status(403).json({
          error: 'Cuenta temporalmente bloqueada por seguridad',
          codigo: 'ACCOUNT_LOCKED'
        });
      }

      // Generar JWT con claims específicos
      const tokenPayload = {
        id: usuario.id,
        correo: usuario.correo,
        rol: usuario.rol,
        nombre: usuario.nombre
      };

      const token = jwt.sign(
        tokenPayload,
        process.env.JWT_SECRET,
        { 
          expiresIn: process.env.JWT_EXPIRES_IN,
          issuer: 'SpeakLexi API',
          subject: usuario.id.toString()
        }
      );

      // Response sin información sensible
      const userResponse = {
        id: usuario.id,
        nombre: usuario.nombre,
        primer_apellido: usuario.primer_apellido,
        correo: usuario.correo,
        rol: usuario.rol,
        perfil: {
          nombre_completo: usuario.nombre_completo,
          nivel_actual: usuario.nivel_actual,
          idioma_aprendizaje: usuario.idioma_aprendizaje,
          total_xp: usuario.total_xp || 0,
          foto_perfil: usuario.foto_perfil
        }
      };

      // Configurar cookie segura (opcional)
      res.cookie('access_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000 // 1 hora
      });

      res.json({
        mensaje: 'Inicio de sesión exitoso',
        access_token: token,
        token_type: 'Bearer',
        expires_in: 3600,
        usuario: userResponse
      });

    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        codigo: 'LOGIN_ERROR'
      });
    }
  }
];

// UC-03: Verificar email - MEJORADO
exports.verificarEmail = [
  authLimiter,
  async (req, res) => {
    try {
      const { correo, codigo } = req.body;

      if (!correo || !codigo) {
        return res.status(400).json({ 
          error: 'Correo y código requeridos',
          codigo: 'MISSING_VERIFICATION_DATA'
        });
      }

      const [usuarios] = await db.query(
        `SELECT id, correo_verificado, codigo_verificacion, expira_verificacion 
         FROM usuarios WHERE correo = ?`,
        [correo.toLowerCase().trim()]
      );

      if (usuarios.length === 0) {
        return res.status(404).json({ 
          error: 'Usuario no encontrado',
          codigo: 'USER_NOT_FOUND'
        });
      }

      const usuario = usuarios[0];

      if (usuario.correo_verificado) {
        return res.json({ 
          mensaje: 'Correo ya verificado',
          codigo: 'ALREADY_VERIFIED'
        });
      }

      if (!usuario.codigo_verificacion || !usuario.expira_verificacion) {
        return res.status(400).json({ 
          error: 'No hay código de verificación pendiente',
          codigo: 'NO_PENDING_VERIFICATION'
        });
      }

      if (new Date() > new Date(usuario.expira_verificacion)) {
        return res.status(400).json({ 
          error: 'Código expirado',
          codigo: 'VERIFICATION_CODE_EXPIRED'
        });
      }

      if (usuario.codigo_verificacion !== codigo.trim()) {
        // Contador de intentos fallidos (podrías implementar bloqueo después de X intentos)
        return res.status(400).json({ 
          error: 'Código incorrecto',
          codigo: 'INVALID_VERIFICATION_CODE'
        });
      }

      // Actualizar verificación
      await db.query(
        `UPDATE usuarios 
         SET correo_verificado = TRUE, 
             estado_cuenta = 'activo',
             codigo_verificacion = NULL, 
             expira_verificacion = NULL 
         WHERE id = ?`,
        [usuario.id]
      );

      res.json({ 
        mensaje: 'Correo verificado correctamente',
        estado: 'activo'
      });

    } catch (error) {
      console.error('Error verificar email:', error);
      res.status(500).json({ 
        error: 'Error al verificar email',
        codigo: 'VERIFICATION_ERROR'
      });
    }
  }
];

// Nuevo endpoint: Reenviar código de verificación
exports.reenviarCodigoVerificacion = [
  authLimiter,
  async (req, res) => {
    try {
      const { correo } = req.body;

      const [usuarios] = await db.query(
        'SELECT id, correo_verificado FROM usuarios WHERE correo = ?',
        [correo.toLowerCase().trim()]
      );

      if (usuarios.length === 0) {
        return res.status(404).json({ 
          error: 'Usuario no encontrado',
          codigo: 'USER_NOT_FOUND'
        });
      }

      const usuario = usuarios[0];

      if (usuario.correo_verificado) {
        return res.json({ 
          mensaje: 'El correo ya está verificado',
          codigo: 'ALREADY_VERIFIED'
        });
      }

      // Generar nuevo código
      const nuevo_codigo = Math.floor(100000 + Math.random() * 900000).toString();
      const nueva_expiracion = new Date(Date.now() + 10 * 60 * 1000);

      await db.query(
        'UPDATE usuarios SET codigo_verificacion = ?, expira_verificacion = ? WHERE id = ?',
        [nuevo_codigo, nueva_expiracion, usuario.id]
      );

      // Enviar email
      await emailService.enviarCodigoVerificacion(correo, nuevo_codigo);

      res.json({ 
        mensaje: 'Código de verificación reenviado',
        expira_en: nueva_expiracion
      });

    } catch (error) {
      console.error('Error reenviando código:', error);
      res.status(500).json({ 
        error: 'Error al reenviar código',
        codigo: 'RESEND_ERROR'
      });
    }
  }
];