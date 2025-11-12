const ProgresoModel = require('../models/progresoModel');
const GamificacionModel = require('../models/gamificacionModel');
const db = require('../config/database');

/**
 * CONTROLADOR: Progreso de Lecciones y Cursos
 * RF-10: Registrar progreso del alumno
 */

/**
 * ✅ EJEMPLO COMPLETO
 * @desc    Registrar progreso de lección
 * @route   POST /api/progreso/registrar
 * @access  Private (alumno)
 */
exports.registrarProgresoLeccion = async (req, res) => {
    try {
        const usuarioId = req.user.id;
        const { leccion_id, progreso, tiempo_segundos } = req.body;
        
        // Validaciones
        if (!leccion_id || progreso === undefined) {
            return res.status(400).json({ 
                error: 'leccion_id y progreso son requeridos' 
            });
        }
        
        if (progreso < 0 || progreso > 100) {
            return res.status(400).json({ 
                error: 'El progreso debe estar entre 0 y 100' 
            });
        }
        
        // Registrar progreso
        const resultado = await ProgresoModel.registrarProgresoLeccion(
            usuarioId, 
            leccion_id, 
            { progreso, tiempo_segundos: tiempo_segundos || 0 }
        );
        
        // Si completó la lección (progreso >= 100), otorgar puntos
        if (progreso >= 100 && resultado.recien_completada) {
            await GamificacionModel.otorgarPuntos(
                usuarioId, 
                10, // LECCION_COMPLETADA
                `Lección ${leccion_id} completada`
            );
            await GamificacionModel.actualizarRacha(usuarioId);
        }
        
        res.status(200).json({
            mensaje: 'Progreso registrado exitosamente',
            progreso: resultado
        });
        
    } catch (error) {
        console.error('Error en registrarProgresoLeccion:', error);
        res.status(500).json({ 
            error: 'Error al registrar progreso',
            detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * ✅ COMPLETADO: Obtener progreso por lección
 * @route   GET /api/progreso/leccion/:leccionId
 * @access  Private
 */
exports.obtenerProgresoPorLeccion = async (req, res) => {
    try {
        const usuarioId = req.user.id;
        const { leccionId } = req.params;
        
        if (!leccionId) {
            return res.status(400).json({ 
                error: 'leccionId es requerido' 
            });
        }
        
        const progreso = await ProgresoModel.obtenerProgresoPorLeccion(usuarioId, leccionId);
        
        if (!progreso) {
            return res.status(404).json({ 
                error: 'No se encontró progreso para esta lección',
                sugerencia: 'Puede que aún no hayas comenzado esta lección'
            });
        }
        
        res.json({ 
            progreso,
            mensaje: progreso.completada ? 
                'Lección completada' : 
                `Progreso: ${progreso.progreso}%`
        });
        
    } catch (error) {
        console.error('Error en obtenerProgresoPorLeccion:', error);
        res.status(500).json({ 
            error: 'Error al obtener progreso de la lección',
            detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * ✅ COMPLETADO: Obtener progreso por curso
 * @route   GET /api/progreso/curso/:cursoId
 */
exports.obtenerProgresoPorCurso = async (req, res) => {
    try {
        const usuarioId = req.user.id;
        const { cursoId } = req.params;
        
        if (!cursoId) {
            return res.status(400).json({ 
                error: 'cursoId es requerido' 
            });
        }
        
        const progreso = await ProgresoModel.obtenerProgresoPorCurso(usuarioId, cursoId);
        
        if (!progreso) {
            return res.status(404).json({ 
                error: 'No se encontró el curso o no estás inscrito',
                sugerencia: 'Asegúrate de estar inscrito en este curso'
            });
        }
        
        res.json({ 
            progreso,
            resumen: {
                curso_id: cursoId,
                progreso_general: progreso.progreso_general,
                estado: progreso.estado,
                lecciones_completadas: progreso.lecciones_completadas,
                total_lecciones: progreso.total_lecciones,
                fecha_ultima_actividad: progreso.fecha_ultima_actividad
            }
        });
        
    } catch (error) {
        console.error('Error en obtenerProgresoPorCurso:', error);
        res.status(500).json({ 
            error: 'Error al obtener progreso del curso',
            detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * ✅ COMPLETADO: Sincronizar progreso (para uso offline)
 * @route   POST /api/progreso/sincronizar
 */
exports.sincronizarProgreso = async (req, res) => {
    try {
        const usuarioId = req.user.id;
        const { progresos } = req.body;
        
        if (!Array.isArray(progresos)) {
            return res.status(400).json({ 
                error: 'El campo progresos debe ser un array' 
            });
        }
        
        if (progresos.length === 0) {
            return res.status(400).json({ 
                error: 'El array progresos no puede estar vacío' 
            });
        }
        
        // Validar estructura de cada progreso
        for (const progreso of progresos) {
            if (!progreso.leccion_id || progreso.progreso === undefined) {
                return res.status(400).json({ 
                    error: 'Cada progreso debe tener leccion_id y progreso' 
                });
            }
        }
        
        const resultado = await ProgresoModel.sincronizarProgreso(usuarioId, progresos);
        
        res.json({
            mensaje: `Sincronización completada - ${resultado.actualizados} progresos actualizados`,
            resultado: {
                sincronizados: resultado.actualizados,
                con_errores: resultado.errores,
                nuevos_completados: resultado.nuevos_completados
            }
        });
        
    } catch (error) {
        console.error('Error en sincronizarProgreso:', error);
        res.status(500).json({ 
            error: 'Error al sincronizar progreso',
            detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * ✅ COMPLETADO: Obtener historial de progreso
 * @route   GET /api/progreso/historial
 */
exports.obtenerHistorialProgreso = async (req, res) => {
    try {
        const usuarioId = req.user.id;
        const { limite = 50, offset = 0, tipo = 'todos' } = req.query;
        
        // Validar tipo
        const tiposValidos = ['todos', 'lecciones', 'cursos', 'completados'];
        if (!tiposValidos.includes(tipo)) {
            return res.status(400).json({ 
                error: 'Tipo inválido. Usa: todos, lecciones, cursos, completados' 
            });
        }
        
        const historial = await ProgresoModel.obtenerHistorialProgreso(
            usuarioId, 
            parseInt(limite),
            parseInt(offset),
            tipo
        );
        
        res.json({
            historial,
            total: historial.length,
            limite: parseInt(limite),
            offset: parseInt(offset),
            tipo
        });
        
    } catch (error) {
        console.error('Error en obtenerHistorialProgreso:', error);
        res.status(500).json({ 
            error: 'Error al obtener historial de progreso',
            detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * ✅ COMPLETADO: Obtener resumen de progreso del usuario
 * @route   GET /api/progreso/resumen
 */
exports.obtenerResumenProgreso = async (req, res) => {
    try {
        const usuarioId = req.user.id;
        
        const resumen = await ProgresoModel.obtenerResumenProgreso(usuarioId);
        
        if (!resumen) {
            return res.status(404).json({ 
                error: 'No se encontró el perfil del estudiante',
                sugerencia: 'Completa tu primer lección para crear tu perfil'
            });
        }
        
        // Calcular estadísticas adicionales
        const estadisticas = {
            ...resumen,
            eficiencia: resumen.lecciones_completadas > 0 ? 
                Math.round((resumen.lecciones_completadas / (resumen.lecciones_completadas + resumen.lecciones_incompletas)) * 100) : 0,
            tiempo_promedio_leccion: resumen.lecciones_completadas > 0 ?
                Math.round(resumen.tiempo_total_segundos / resumen.lecciones_completadas) : 0,
            dias_activo: Math.ceil((new Date() - new Date(resumen.fecha_registro)) / (1000 * 60 * 60 * 24))
        };
        
        res.json({ 
            resumen: estadisticas,
            mensaje: `Nivel ${resumen.nivel_actual} - ${resumen.lecciones_completadas} lecciones completadas`
        });
        
    } catch (error) {
        console.error('Error en obtenerResumenProgreso:', error);
        res.status(500).json({ 
            error: 'Error al obtener resumen de progreso',
            detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * ✅ NUEVO: Actualizar progreso de curso (cuando se completa una lección)
 * @route   POST /api/progreso/curso/:cursoId/actualizar
 * @access  Private
 */
exports.actualizarProgresoCurso = async (req, res) => {
    try {
        const usuarioId = req.user.id;
        const { cursoId } = req.params;
        
        if (!cursoId) {
            return res.status(400).json({ 
                error: 'cursoId es requerido' 
            });
        }
        
        const resultado = await ProgresoModel.actualizarProgresoCurso(usuarioId, cursoId);
        
        res.json({
            mensaje: 'Progreso del curso actualizado',
            resultado
        });
        
    } catch (error) {
        console.error('Error en actualizarProgresoCurso:', error);
        res.status(500).json({ 
            error: 'Error al actualizar progreso del curso',
            detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * ============================================
 * NUEVAS FUNCIONES PARA DASHBOARD ESTUDIANTE - CORREGIDAS
 * ============================================
 */

/**
 * Obtener resumen completo del progreso del estudiante - CORREGIDO
 */
exports.obtenerResumenEstudiante = async (req, res) => {
    try {
        const usuarioId = req.user.id;

        console.log(`📊 Obteniendo resumen para estudiante: ${usuarioId}`);

        // 1. Información del perfil del estudiante - CORREGIDO
        const [perfil] = await db.pool.execute(`
            SELECT 
                pe.nivel_actual,
                pe.idioma_aprendizaje,
                pe.total_xp,
                u.nombre,
                u.primer_apellido,
                u.correo
            FROM perfil_estudiantes pe
            JOIN usuarios u ON pe.usuario_id = u.id
            WHERE pe.usuario_id = ?
        `, [usuarioId]);

        if (!perfil.length) {
            return res.status(404).json({ 
                mensaje: 'Perfil de estudiante no encontrado',
                codigo: 'PROFILE_NOT_FOUND'
            });
        }

        const perfilEstudiante = perfil[0];

        // 2. Estadísticas de progreso básicas
        const [estadisticas] = await db.pool.execute(`
            SELECT 
                COUNT(*) as lecciones_iniciadas,
                SUM(CASE WHEN completada = 1 THEN 1 ELSE 0 END) as lecciones_completadas,
                SUM(tiempo_total_segundos) as tiempo_total_segundos,
                AVG(progreso) as promedio_progreso
            FROM progreso_lecciones
            WHERE usuario_id = ?
        `, [usuarioId]);

        // 3. Cursos inscritos
        const [cursos] = await db.pool.execute(`
            SELECT 
                c.id,
                c.nombre,
                c.descripcion,
                c.nivel,
                c.idioma,
                c.icono,
                c.color,
                ic.progreso_general as progreso,
                ic.lecciones_completadas,
                ic.tiempo_total_minutos
            FROM inscripciones_cursos ic
            JOIN cursos c ON ic.curso_id = c.id
            WHERE ic.usuario_id = ? AND ic.estado = 'activo'
            ORDER BY ic.fecha_ultima_actividad DESC
            LIMIT 5
        `, [usuarioId]);

        // 4. Lecciones recientes
        const [leccionesRecientes] = await db.pool.execute(`
            SELECT 
                l.id,
                l.titulo,
                l.descripcion,
                c.nombre as curso_nombre,
                pl.progreso,
                pl.completada,
                pl.actualizado_en
            FROM progreso_lecciones pl
            JOIN lecciones l ON pl.leccion_id = l.id
            LEFT JOIN cursos c ON l.curso_id = c.id
            WHERE pl.usuario_id = ?
            ORDER BY pl.actualizado_en DESC
            LIMIT 5
        `, [usuarioId]);

        // 5. Lecciones recomendadas (basadas en nivel actual)
        const [leccionesRecomendadas] = await db.pool.execute(`
            SELECT 
                l.id,
                l.titulo,
                l.descripcion,
                l.nivel,
                l.idioma,
                l.duracion_minutos,
                c.nombre as curso_nombre,
                c.icono,
                c.color
            FROM lecciones l
            JOIN cursos c ON l.curso_id = c.id
            LEFT JOIN progreso_lecciones pl ON l.id = pl.leccion_id AND pl.usuario_id = ?
            WHERE l.nivel = ?
              AND l.idioma = ?
              AND l.estado = 'activa'
              AND (pl.completada IS NULL OR pl.completada = 0)
            ORDER BY l.orden ASC
            LIMIT 5
        `, [usuarioId, perfilEstudiante.nivel_actual, perfilEstudiante.idioma_aprendizaje]);

        // 6. Construir respuesta estructurada para el dashboard
        const stats = estadisticas[0] || {
            lecciones_iniciadas: 0,
            lecciones_completadas: 0,
            tiempo_total_segundos: 0,
            promedio_progreso: 0
        };

        const resumen = {
            usuario: {
                id: usuarioId,
                nombre: perfilEstudiante.nombre,
                primer_apellido: perfilEstudiante.primer_apellido,
                correo: perfilEstudiante.correo,
                nivel: perfilEstudiante.nivel_actual,
                idioma: perfilEstudiante.idioma_aprendizaje,
                xp: perfilEstudiante.total_xp || 0
            },
            progreso: {
                general: Math.round(stats.promedio_progreso) || 0,
                leccionesCompletadas: stats.lecciones_completadas || 0,
                totalLecciones: stats.lecciones_iniciadas || 0,
                puntuacionPromedio: 0, // Por implementar
                tiempoEstudio: Math.round((stats.tiempo_total_segundos || 0) / 60) // Convertir a minutos
            },
            cursos: cursos.map(curso => ({
                id: curso.id,
                nombre: curso.nombre,
                descripcion: curso.descripcion,
                nivel: curso.nivel,
                idioma: curso.idioma,
                icono: curso.icono,
                color: curso.color,
                progreso: curso.progreso || 0,
                leccionesCompletadas: curso.lecciones_completadas || 0,
                tiempoEstudio: curso.tiempo_total_minutos || 0
            })),
            actividadReciente: leccionesRecientes.map(leccion => ({
                id: leccion.id,
                titulo: leccion.titulo,
                curso: leccion.curso_nombre,
                progreso: leccion.progreso,
                completada: leccion.completada === 1,
                fechaActualizacion: leccion.actualizado_en
            })),
            leccionesRecomendadas: leccionesRecomendadas.map(leccion => ({
                id: leccion.id,
                titulo: leccion.titulo,
                descripcion: leccion.descripcion,
                nivel: leccion.nivel,
                idioma: leccion.idioma,
                duracion: leccion.duracion_minutos,
                curso: leccion.curso_nombre,
                icono: leccion.icono,
                color: leccion.color
            })),
            estadisticas: {
                rachaActual: 0, // Por implementar
                puntosTotales: perfilEstudiante.total_xp || 0,
                nivelActual: perfilEstudiante.nivel_actual || 'A1'
            }
        };

        console.log(`✅ Resumen cargado para estudiante ${usuarioId}:`, {
            progreso: `${resumen.progreso.general}%`,
            lecciones: `${resumen.progreso.leccionesCompletadas}/${resumen.progreso.totalLecciones}`,
            cursos: resumen.cursos.length
        });

        res.json({
            success: true,
            data: resumen,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error en obtenerResumenEstudiante:', error);
        
        res.status(500).json({
            success: false,
            mensaje: 'Error del servidor al cargar el resumen',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            codigo: 'RESUMEN_LOAD_ERROR'
        });
    }
};

/**
 * Obtener lecciones recomendadas para el estudiante - CORREGIDO
 */
exports.obtenerLeccionesRecomendadas = async (req, res) => {
    try {
        const usuarioId = req.user.id;

        // Obtener nivel e idioma del estudiante
        const [perfil] = await db.pool.execute(`
            SELECT nivel_actual, idioma_aprendizaje
            FROM perfil_estudiantes
            WHERE usuario_id = ?
        `, [usuarioId]);

        if (!perfil.length) {
            return res.status(404).json({ 
                mensaje: 'Perfil no encontrado',
                codigo: 'PROFILE_NOT_FOUND'
            });
        }

        const { nivel_actual, idioma_aprendizaje } = perfil[0];

        // Obtener lecciones del nivel actual que NO ha completado
        const [lecciones] = await db.pool.execute(`
            SELECT 
                l.id,
                l.titulo,
                l.descripcion,
                l.nivel,
                l.idioma,
                l.duracion_minutos,
                c.nombre as curso_nombre,
                c.icono,
                c.color,
                COALESCE(pl.progreso, 0) as progreso_actual
            FROM lecciones l
            JOIN cursos c ON l.curso_id = c.id
            LEFT JOIN progreso_lecciones pl ON l.id = pl.leccion_id AND pl.usuario_id = ?
            WHERE l.nivel = ?
              AND l.idioma = ?
              AND l.estado = 'activa'
              AND (pl.completada IS NULL OR pl.completada = 0)
            ORDER BY l.orden ASC, l.creado_en ASC
            LIMIT 10
        `, [usuarioId, nivel_actual, idioma_aprendizaje]);

        res.json({
            success: true,
            nivel: nivel_actual,
            idioma: idioma_aprendizaje,
            lecciones_recomendadas: lecciones,
            total: lecciones.length
        });

    } catch (error) {
        console.error('❌ Error en obtenerLeccionesRecomendadas:', error);
        res.status(500).json({ 
            success: false,
            mensaje: 'Error al obtener lecciones recomendadas',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = exports;