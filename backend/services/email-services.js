// backend/services/emailService.js
const nodemailer = require('nodemailer');
const { createBullBoard } = require('@bull-board/api');
const { BullAdapter } = require('@bull-board/api/bullAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const Queue = require('bull'); // Necesitarás instalar 'bull'
require('dotenv').config();

// 1. Configuración Mejorada del Transporter
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT),
  secure: parseInt(process.env.MAIL_PORT) === 465, // True para 465, false para otros
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// 2. Verificar la conexión al iniciar la aplicación
transporter.verify(function (error, success) {
  if (error) {
    console.log('❌ Error de conexión SMTP:', error);
  } else {
    console.log('✅ Servidor SMTP listo para enviar mensajes');
  }
});

// 3. Configurar Cola de Emails (Bull Queue)
const emailQueue = new Queue('email sending', {
  redis: { host: '127.0.0.1', port: 6379 } // Ajusta según tu config de Redis
});

// 4. Función de Reintento Mejorada
async function sendWithRetry(mailOptions, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await transporter.sendMail(mailOptions);
      return true;
    } catch (err) {
      console.error(`Intento ${i + 1} fallido:`, err.message);
      if (i < retries - 1) {
        const backoffTime = 2 ** i * 1000; // Retroceso exponencial: 1s, 2s, 4s...
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }
    }
  }
  return false;
}

// 5. Procesador de la Cola
emailQueue.process(async (job) => {
  const { mailOptions } = job.data;
  console.log(`Enviando email a: ${mailOptions.to}`);

  const success = await sendWithRetry(mailOptions);
  if (!success) {
    throw new Error(`Fallo al enviar email a ${mailOptions.to} después de 3 intentos`);
  }
});

// 6. Funciones de tu API (ahora añaden trabajos a la cola)
exports.enviarCodigoVerificacion = async (correo, codigo) => {
  const mailOptions = {
    from: process.env.MAIL_FROM,
    to: correo,
    subject: 'Verifica tu cuenta - SpeakLexi',
    html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #667eea;">¡Bienvenido a SpeakLexi!</h1>
          <p>Tu código de verificación es:</p>
          <div style="background: #f0f9ff; padding: 20px; text-align: center; border-radius: 8px;">
            <h2 style="color: #0ea5e9; letter-spacing: 5px;">${codigo}</h2>
          </div>
          <p style="color: #666; margin-top: 20px;">Este código expira en 10 minutos.</p>
        </div>
      `
  };

  // Añade el trabajo a la cola en lugar de enviarlo directamente
  await emailQueue.add('verification', { mailOptions }, { 
    delay: 0, // Sin retraso
    attempts: 3 // Número de reintentos
  });
  console.log(`✅ Tarea de verificación encolada para ${correo}`);
};

exports.enviarRecuperacionPassword = async (correo, token) => {
  const enlace = `${process.env.FRONTEND_URL}/pages/auth/restablecer-contrasena.html?token=${token}`;

  const mailOptions = {
    from: process.env.MAIL_FROM,
    to: correo,
    subject: 'Recuperación de contraseña - SpeakLexi',
    html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #667eea;">Recuperación de Contraseña</h1>
          <p>Haz clic en el siguiente botón para restablecer tu contraseña:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${enlace}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 40px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: bold;
                      display: inline-block;">
              Restablecer Contraseña
            </a>
          </div>
          <p style="color: #666;">Este enlace expira en 1 hora.</p>
        </div>
      `
  };

  await emailQueue.add('password reset', { mailOptions }, { 
    delay: 0,
    attempts: 3
  });
  console.log(`✅ Tarea de recuperación encolada para ${correo}`);
};