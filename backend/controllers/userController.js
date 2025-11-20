// ==========================================================
// backend/controllers/userController.js - VERSIÓN CORREGIDA (SIN TELÉFONO)
// ==========================================================

const database = require('../config/database');
const bcrypt = require('bcryptjs');

const userController = {
  
  // Obtener perfil del usuario - CORREGIDO (sin teléfono)
  obtenerPerfil: async (req, res) => {
    try {
      const userId = req.user.id;
      
      console.log('📋 Obteniendo perfil para usuario:', userId);
      
      // ✅ CORREGIDO: Quitar 'telefono' de la consulta
      const [usuarios] = await database.query(
        `SELECT id, nombre, primer_apellido, segundo_apellido, correo, 
                rol, estado_cuenta, fecha_registro, foto_perfil, correo_verificado
         FROM usuarios 
         WHERE id = ?`,
        [userId]
      );
      
      if (usuarios.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado',
          codigo: 'USER_NOT_FOUND'
        });
      }
      
      const usuario = usuarios[0];
      
      // Obtener datos del estudiante (si es alumno)
      let datosEstudiante = {};
      let cursoActual = {};
      
      if (usuario.rol === 'alumno') {
        // Datos del estudiante
        const [estudiante] = await database.query(
          `SELECT idioma_aprendizaje, nivel_actual, puntos_experiencia, 
                  racha_actual, lecciones_completadas, tiempo_estudio_minutos,
                  curso_actual_id
           FROM estudiantes 
           WHERE usuario_id = ?`,
          [userId]
        );
        
        datosEstudiante = estudiante[0] || {};
        
        // Si tiene curso actual, obtener información del curso
        if (datosEstudiante.curso_actual_id) {
          const [cursos] = await database.query(
            `SELECT id, nombre, descripcion, idioma, nivel 
             FROM cursos 
             WHERE id = ? AND activo = true`,
            [datosEstudiante.curso_actual_id]
          );
          
          cursoActual = cursos[0] || {};
        }
      }
      
      res.json({
        success: true,
        data: {
          usuario: {
            id: usuario.id,
            nombre: usuario.nombre,
            primer_apellido: usuario.primer_apellido,
            segundo_apellido: usuario.segundo_apellido,
            correo: usuario.correo,
            // ✅ CORREGIDO: Quitar teléfono
            rol: usuario.rol,
            estado_cuenta: usuario.estado_cuenta,
            fecha_registro: usuario.fecha_registro,
            foto_perfil: usuario.foto_perfil,
            correo_verificado: usuario.correo_verificado
          },
          datos_estudiante: datosEstudiante,
          curso_actual: cursoActual
        }
      });
      
    } catch (error) {
      console.error('❌ Error al obtener perfil:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        codigo: 'INTERNAL_SERVER_ERROR'
      });
    }
  },
  
  // Actualizar perfil del usuario - CORREGIDO (sin teléfono)
  actualizarPerfil: async (req, res) => {
    try {
      const userId = req.user.id;
      // ✅ CORREGIDO: Quitar teléfono de los datos que se pueden actualizar
      const { nombre, primer_apellido, segundo_apellido } = req.body;
      
      console.log('✏️ Actualizando perfil para usuario:', userId, req.body);
      
      const camposActualizar = {};
      if (nombre) camposActualizar.nombre = nombre;
      if (primer_apellido) camposActualizar.primer_apellido = primer_apellido;
      if (segundo_apellido !== undefined) camposActualizar.segundo_apellido = segundo_apellido;
      // ✅ CORREGIDO: No incluir teléfono
      
      if (Object.keys(camposActualizar).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No hay campos para actualizar',
          codigo: 'NO_FIELDS_TO_UPDATE'
        });
      }
      
      const [result] = await database.query(
        'UPDATE usuarios SET ? WHERE id = ?',
        [camposActualizar, userId]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado',
          codigo: 'USER_NOT_FOUND'
        });
      }
      
      // Obtener usuario actualizado
      // ✅ CORREGIDO: Quitar teléfono de la consulta
      const [usuarios] = await database.query(
        'SELECT id, nombre, primer_apellido, segundo_apellido, correo FROM usuarios WHERE id = ?',
        [userId]
      );
      
      res.json({
        success: true,
        message: 'Perfil actualizado correctamente',
        data: {
          usuario: usuarios[0]
        }
      });
      
    } catch (error) {
      console.error('❌ Error al actualizar perfil:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        codigo: 'INTERNAL_SERVER_ERROR'
      });
    }
  },
  
  // Cambiar contraseña - SE MANTIENE IGUAL
  cambiarContrasena: async (req, res) => {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;
      
      console.log('🔐 Cambiando contraseña para usuario:', userId);
      
      // Verificar contraseña actual
      const [usuarios] = await database.query(
        'SELECT password FROM usuarios WHERE id = ?',
        [userId]
      );
      
      if (usuarios.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado',
          codigo: 'USER_NOT_FOUND'
        });
      }
      
      const usuario = usuarios[0];
      
      const passwordValida = await bcrypt.compare(currentPassword, usuario.password);
      if (!passwordValida) {
        return res.status(401).json({
          success: false,
          error: 'La contraseña actual es incorrecta',
          codigo: 'INVALID_CURRENT_PASSWORD'
        });
      }
      
      // Hashear nueva contraseña
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      
      // Actualizar contraseña
      await database.query(
        'UPDATE usuarios SET password = ? WHERE id = ?',
        [hashedPassword, userId]
      );
      
      console.log('✅ Contraseña cambiada exitosamente para usuario:', userId);
      
      res.json({
        success: true,
        message: 'Contraseña actualizada correctamente'
      });
      
    } catch (error) {
      console.error('❌ Error al cambiar contraseña:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        codigo: 'INTERNAL_SERVER_ERROR'
      });
    }
  },
  
  // Cambiar idioma - SE MANTIENE IGUAL
  cambiarIdioma: async (req, res) => {
    try {
      const userId = req.user.id;
      const { idioma } = req.body;
      
      console.log('🌎 Cambiando idioma para usuario:', userId, 'a:', idioma);
      
      if (req.user.rol !== 'alumno') {
        return res.status(403).json({
          success: false,
          error: 'Solo los estudiantes pueden cambiar su idioma de aprendizaje',
          codigo: 'ONLY_FOR_STUDENTS'
        });
      }
      
      // Idiomas permitidos
      const idiomasPermitidos = ['Inglés', 'Francés', 'Alemán', 'Italiano', 'Portugués', 'Japonés', 'Coreano', 'Chino'];
      if (!idiomasPermitidos.includes(idioma)) {
        return res.status(400).json({
          success: false,
          error: 'Idioma no soportado',
          codigo: 'LANGUAGE_NOT_SUPPORTED',
          idiomas_permitidos: idiomasPermitidos
        });
      }
      
      // Verificar si existe registro en estudiantes
      const [estudiantes] = await database.query(
        'SELECT id FROM estudiantes WHERE usuario_id = ?',
        [userId]
      );
      
      if (estudiantes.length === 0) {
        // Crear registro
        await database.query(
          'INSERT INTO estudiantes (usuario_id, idioma_aprendizaje) VALUES (?, ?)',
          [userId, idioma]
        );
      } else {
        // Actualizar registro
        await database.query(
          'UPDATE estudiantes SET idioma_aprendizaje = ? WHERE usuario_id = ?',
          [idioma, userId]
        );
      }
      
      console.log('✅ Idioma cambiado exitosamente a:', idioma);
      
      res.json({
        success: true,
        message: 'Idioma de aprendizaje actualizado correctamente',
        data: { idioma }
      });
      
    } catch (error) {
      console.error('❌ Error al cambiar idioma:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        codigo: 'INTERNAL_SERVER_ERROR'
      });
    }
  },
  
  // Cambiar curso - SE MANTIENE IGUAL
  cambiarCurso: async (req, res) => {
    try {
      const userId = req.user.id;
      const { curso_id } = req.body;
      
      console.log('📚 Cambiando curso para usuario:', userId, 'a curso:', curso_id);
      
      if (req.user.rol !== 'alumno') {
        return res.status(403).json({
          success: false,
          error: 'Solo los estudiantes pueden cambiar de curso',
          codigo: 'ONLY_FOR_STUDENTS'
        });
      }
      
      // Verificar que el curso existe y está activo
      const [cursos] = await database.query(
        'SELECT id, nombre, idioma, nivel FROM cursos WHERE id = ? AND activo = true',
        [curso_id]
      );
      
      if (cursos.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Curso no encontrado o no disponible',
          codigo: 'COURSE_NOT_FOUND'
        });
      }
      
      const curso = cursos[0];
      
      // Verificar si existe registro en estudiantes
      const [estudiantes] = await database.query(
        'SELECT id FROM estudiantes WHERE usuario_id = ?',
        [userId]
      );
      
      if (estudiantes.length === 0) {
        // Crear registro con el curso
        await database.query(
          'INSERT INTO estudiantes (usuario_id, curso_actual_id, idioma_aprendizaje, nivel_actual) VALUES (?, ?, ?, ?)',
          [userId, curso_id, curso.idioma, curso.nivel]
        );
      } else {
        // Actualizar registro con el nuevo curso
        await database.query(
          'UPDATE estudiantes SET curso_actual_id = ?, idioma_aprendizaje = ?, nivel_actual = ? WHERE usuario_id = ?',
          [curso_id, curso.idioma, curso.nivel, userId]
        );
      }
      
      console.log('✅ Curso cambiado exitosamente a:', curso.nombre);
      
      res.json({
        success: true,
        message: 'Curso actualizado correctamente',
        data: { 
          curso: {
            id: curso.id,
            nombre: curso.nombre,
            idioma: curso.idioma,
            nivel: curso.nivel
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Error al cambiar curso:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        codigo: 'INTERNAL_SERVER_ERROR'
      });
    }
  },
  
  // Cambiar nivel - SE MANTIENE IGUAL
  cambiarNivel: async (req, res) => {
    try {
      const userId = req.user.id;
      const { nivel } = req.body;
      
      console.log('📊 Cambiando nivel para usuario:', userId, 'a:', nivel);
      
      if (req.user.rol !== 'alumno') {
        return res.status(403).json({
          success: false,
          error: 'Solo los estudiantes pueden cambiar su nivel',
          codigo: 'ONLY_FOR_STUDENTS'
        });
      }
      
      // Niveles permitidos
      const nivelesPermitidos = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      if (!nivelesPermitidos.includes(nivel)) {
        return res.status(400).json({
          success: false,
          error: 'Nivel no válido',
          codigo: 'INVALID_LEVEL',
          niveles_permitidos: nivelesPermitidos
        });
      }
      
      // Verificar si existe registro en estudiantes
      const [estudiantes] = await database.query(
        'SELECT id FROM estudiantes WHERE usuario_id = ?',
        [userId]
      );
      
      if (estudiantes.length === 0) {
        // Crear registro con el nivel
        await database.query(
          'INSERT INTO estudiantes (usuario_id, nivel_actual) VALUES (?, ?)',
          [userId, nivel]
        );
      } else {
        // Actualizar nivel
        await database.query(
          'UPDATE estudiantes SET nivel_actual = ? WHERE usuario_id = ?',
          [nivel, userId]
        );
      }
      
      console.log('✅ Nivel cambiado exitosamente a:', nivel);
      
      res.json({
        success: true,
        message: 'Nivel actualizado correctamente',
        data: { nivel }
      });
      
    } catch (error) {
      console.error('❌ Error al cambiar nivel:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        codigo: 'INTERNAL_SERVER_ERROR'
      });
    }
  },
  
  // Obtener estadísticas - SE MANTIENE IGUAL
  obtenerEstadisticas: async (req, res) => {
    try {
      const userId = req.user.id;
      
      console.log('📈 Obteniendo estadísticas para usuario:', userId);
      
      let estadisticas = {
        lecciones_completadas: 0,
        tiempo_estudio_minutos: 0,
        ejercicios_completados: 0,
        racha_actual: 0,
        nivel_actual: 'A1',
        proximo_nivel: 'A2',
        progreso_nivel: 0,
        puntos_experiencia: 0
      };
      
      if (req.user.rol === 'alumno') {
        // Obtener datos reales de la base de datos
        const [estudiante] = await database.query(
          `SELECT lecciones_completadas, tiempo_estudio_minutos, 
                  racha_actual, nivel_actual, puntos_experiencia
           FROM estudiantes 
           WHERE usuario_id = ?`,
          [userId]
        );
        
        if (estudiante.length > 0) {
          const datos = estudiante[0];
          estadisticas = {
            lecciones_completadas: datos.lecciones_completadas || 0,
            tiempo_estudio_minutos: datos.tiempo_estudio_minutos || 0,
            ejercicios_completados: Math.floor((datos.lecciones_completadas || 0) * 4.5), // Estimado
            racha_actual: datos.racha_actual || 0,
            nivel_actual: datos.nivel_actual || 'A1',
            proximo_nivel: obtenerProximoNivel(datos.nivel_actual),
            progreso_nivel: calcularProgresoNivel(datos.puntos_experiencia || 0),
            puntos_experiencia: datos.puntos_experiencia || 0
          };
        }
      }
      
      res.json({
        success: true,
        data: estadisticas
      });
      
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        codigo: 'INTERNAL_SERVER_ERROR'
      });
    }
  },
  
  // Obtener progreso - SE MANTIENE IGUAL
  obtenerProgreso: async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Datos de progreso por nivel
      const progreso = [
        { nivel: 'A1', completado: true, fecha_completado: '2024-01-15' },
        { nivel: 'A2', completado: true, fecha_completado: '2024-02-20' },
        { nivel: 'B1', completado: false, progreso_actual: 65 },
        { nivel: 'B2', completado: false, progreso_actual: 0 },
        { nivel: 'C1', completado: false, progreso_actual: 0 },
        { nivel: 'C2', completado: false, progreso_actual: 0 }
      ];
      
      res.json({
        success: true,
        data: progreso
      });
      
    } catch (error) {
      console.error('❌ Error al obtener progreso:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        codigo: 'INTERNAL_SERVER_ERROR'
      });
    }
  },
  
  // Obtener logros - SE MANTIENE IGUAL
  obtenerLogros: async (req, res) => {
    try {
      const logros = [
        { id: 1, nombre: 'Primera Lección', descripcion: 'Completa tu primera lección', obtenido: true, fecha: '2024-01-15', icono: '🎯' },
        { id: 2, nombre: 'Racha de 7 días', descripcion: 'Estudia 7 días consecutivos', obtenido: true, fecha: '2024-01-22', icono: '🔥' },
        { id: 3, nombre: 'Perfeccionista', descripcion: 'Completa 10 ejercicios perfectos', obtenido: false, progreso: 7, icono: '⭐' },
        { id: 4, nombre: 'Explorador', descripcion: 'Completa lecciones en 3 cursos diferentes', obtenido: false, progreso: 2, icono: '🧭' },
        { id: 5, nombre: 'Velocista', descripcion: 'Completa 5 lecciones en un día', obtenido: false, progreso: 3, icono: '⚡' }
      ];
      
      res.json({
        success: true,
        data: logros
      });
      
    } catch (error) {
      console.error('❌ Error al obtener logros:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        codigo: 'INTERNAL_SERVER_ERROR'
      });
    }
  },
  
  // Obtener historial - SE MANTIENE IGUAL
  obtenerHistorial: async (req, res) => {
    try {
      const historial = [
        { id: 1, accion: 'Lección completada', detalle: 'Saludos y presentaciones', fecha: '2024-03-15 14:30', puntos: 10 },
        { id: 2, accion: 'Ejercicio perfecto', detalle: 'Vocabulario básico', fecha: '2024-03-15 14:25', puntos: 5 },
        { id: 3, accion: 'Racha diaria', detalle: 'Día 7 consecutivo', fecha: '2024-03-14 09:15', puntos: 20 },
        { id: 4, accion: 'Logro desbloqueado', detalle: 'Primera lección', fecha: '2024-03-10 16:45', puntos: 25 },
        { id: 5, accion: 'Nivel completado', detalle: 'Nivel A1 superado', fecha: '2024-03-05 11:20', puntos: 100 }
      ];
      
      res.json({
        success: true,
        data: historial
      });
      
    } catch (error) {
      console.error('❌ Error al obtener historial:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        codigo: 'INTERNAL_SERVER_ERROR'
      });
    }
  }
};

// Funciones auxiliares - SE MANTIENEN IGUAL
function obtenerProximoNivel(nivelActual) {
  const niveles = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const index = niveles.indexOf(nivelActual);
  return index < niveles.length - 1 ? niveles[index + 1] : 'C2';
}

function calcularProgresoNivel(puntos) {
  const nivelesXP = [0, 100, 250, 500, 1000, 2000];
  for (let i = nivelesXP.length - 1; i >= 0; i--) {
    if (puntos >= nivelesXP[i]) {
      if (i === nivelesXP.length - 1) return 100;
      const xpActual = puntos - nivelesXP[i];
      const xpNecesario = nivelesXP[i + 1] - nivelesXP[i];
      return Math.min(100, Math.round((xpActual / xpNecesario) * 100));
    }
  }
  return 0;
}

module.exports = userController;