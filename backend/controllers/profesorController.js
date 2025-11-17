const db = require('../config/database');
const pool = db.pool || db;

/**
 * CONTROLADOR COMPLETO DE PROFESOR - SIN COMENTARIOS EN QUERIES SQL
 * Implementa RF-13, RF-14, RF-15
 */
class ProfesorController {

    // ============================================
    // RUTAS PÚBLICAS
    // ============================================

    /**
     * @route   GET /api/profesor/lista
     * @desc    Obtener lista de profesores para selector
     */
    static async obtenerListaProfesores(req, res) {
        try {
            const [profesores] = await pool.execute(`
                SELECT 
                    u.id,
                    CONCAT(u.nombre, ' ', COALESCE(u.primer_apellido, '')) as nombre_completo,
                    u.correo,
                    pa.nivel,
                    pa.idioma
                FROM usuarios u
                INNER JOIN profesor_asignaciones pa ON u.id = pa.profesor_id
                WHERE u.rol = 'profesor' 
                AND pa.activo = 1
                ORDER BY u.nombre
            `);

            res.json({
                success: true,
                data: profesores
            });

        } catch (error) {
            console.error('Error obteniendo lista de profesores:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }

    // ============================================
    // DASHBOARD Y ESTADÍSTICAS (RF-13)
    // ============================================

    /**
     * @route   GET /api/profesor/dashboard
     * @desc    Dashboard principal del profesor
     */
    static async obtenerDashboard(req, res) {
        try {
            const profesorId = req.user.id;
            console.log(`📊 Cargando dashboard para profesor: ${profesorId}`);

            const [asignacion] = await pool.execute(`
                SELECT nivel, idioma, curso_id
                FROM profesor_asignaciones
                WHERE profesor_id = ? AND activo = 1
                LIMIT 1
            `, [profesorId]);

            if (!asignacion.length) {
                return res.status(403).json({
                    success: false,
                    message: 'Profesor sin asignación de curso'
                });
            }

            const { nivel: nivelProfesor, idioma: idiomaProfesor } = asignacion[0];

            const [asignaciones] = await pool.execute(`
                SELECT nivel, idioma 
                FROM profesor_asignaciones 
                WHERE profesor_id = ? AND activo = 1
                LIMIT 1
            `, [profesorId]);

            if (asignaciones.length === 0) {
                return res.json({
                    success: true,
                    data: {
                        profesor: {
                            nombre: req.user.nombre || 'Profesor',
                            primer_apellido: req.user.primer_apellido || '',
                            correo: req.user.correo,
                            nivel: 'N/A',
                            idioma: 'N/A',
                            curso_nombre: 'Sin curso asignado'
                        },
                        estadisticas: {
                            total_estudiantes: 0,
                            promedio_clase: 0,
                            total_lecciones_completadas: 0,
                            tiempo_total_horas: 0
                        },
                        top_estudiantes: [],
                        estudiantes_recientes: [],
                        alertas: []
                    }
                });
            }

            const [estudiantes] = await pool.execute(`
                SELECT estudiante_id 
                FROM profesor_estudiantes 
                WHERE profesor_id = ? AND activo = 1
            `, [profesorId]);

            if (estudiantes.length === 0) {
                return res.json({
                    success: true,
                    data: {
                        profesor: {
                            nombre: req.user.nombre || 'Profesor',
                            primer_apellido: req.user.primer_apellido || '',
                            correo: req.user.correo,
                            nivel: nivelProfesor,
                            idioma: idiomaProfesor,
                            curso_nombre: 'Curso de ' + idiomaProfesor
                        },
                        estadisticas: {
                            total_estudiantes: 0,
                            promedio_clase: 0,
                            total_lecciones_completadas: 0,
                            tiempo_total_horas: 0
                        },
                        top_estudiantes: [],
                        estudiantes_recientes: [],
                        alertas: []
                    }
                });
            }

            const estudianteIds = estudiantes.map(e => e.estudiante_id);

            let dashboardStats = {
                total_estudiantes: 0,
                promedio_general: 0,
                lecciones_completadas: 0,
                tiempo_total_estudio: 0
            };

            try {
                const [dashboard] = await pool.execute(`
                    SELECT
                        COUNT(DISTINCT pe.estudiante_id) as total_estudiantes,
                        COUNT(DISTINCT CASE 
                            WHEN EXISTS (
                                SELECT 1 FROM estadisticas_ejercicios ee 
                                WHERE ee.usuario_id = pe.estudiante_id 
                                AND ee.ultima_vez_completado >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                            ) THEN pe.estudiante_id
                        END) as estudiantes_activos,
                        COALESCE(SUM(es.lecciones_completadas), 0) as lecciones_completadas,
                        ROUND(COALESCE(AVG(es.promedio_general), 0), 2) as promedio_general,
                        COALESCE(SUM(es.tiempo_total_estudio), 0) as tiempo_total_estudio,
                        (SELECT COUNT(*) FROM retroalimentacion r 
                         WHERE r.profesor_id = ? AND r.leido = 0) as retroalimentaciones_pendientes
                    FROM profesor_estudiantes pe
                    LEFT JOIN estadisticas_estudiante es ON pe.estudiante_id = es.usuario_id
                    WHERE pe.profesor_id = ? AND pe.activo = 1
                `, [profesorId, profesorId]);

                if (dashboard.length > 0) {
                    dashboardStats = {
                        total_estudiantes: dashboard[0].total_estudiantes || 0,
                        promedio_general: dashboard[0].promedio_general || 0,
                        lecciones_completadas: dashboard[0].lecciones_completadas || 0,
                        tiempo_total_estudio: dashboard[0].tiempo_total_estudio || 0
                    };
                }
            } catch (statsError) {
                console.error('Error en estadísticas del dashboard:', statsError);
            }

            let alertas = [];
            try {
                const [alertasData] = await pool.execute(`
                    SELECT 
                        'retroalimentacion' as tipo,
                        COUNT(*) as cantidad
                    FROM retroalimentacion 
                    WHERE profesor_id = ? AND leido = 0
                    UNION ALL
                    SELECT 
                        'plan_pendiente' as tipo,
                        COUNT(*) as cantidad
                    FROM planes_estudio 
                    WHERE profesor_id = ? AND estado = 'pendiente'
                `, [profesorId, profesorId]);

                alertas = alertasData;
            } catch (alertError) {
                console.error('Error en alertas:', alertError);
                alertas = [
                    { tipo: 'retroalimentacion', cantidad: 0 },
                    { tipo: 'plan_pendiente', cantidad: 0 }
                ];
            }

            let mejoresEstudiantes = [];
            try {
                const [mejoresEstudiantesData] = await pool.execute(`
                    SELECT
                        u.id,
                        u.nombre,
                        u.primer_apellido,
                        u.correo,
                        COALESCE(pe.nivel_actual, 'A1') as nivel_actual,
                        COALESCE(pe.total_xp, 0) as total_xp,
                        COALESCE(es.lecciones_completadas, 0) as lecciones_completadas,
                        COALESCE(es.lecciones_en_progreso, 0) as lecciones_en_progreso,
                        ROUND(COALESCE(es.promedio_general, 0), 2) as promedio_general,
                        COALESCE(es.tiempo_total_estudio, 0) as tiempo_total_estudio,
                        COALESCE(pe.racha_dias, 0) as racha_dias
                    FROM usuarios u
                    INNER JOIN profesor_estudiantes pue ON u.id = pue.estudiante_id
                    LEFT JOIN perfil_estudiantes pe ON u.id = pe.usuario_id
                    LEFT JOIN estadisticas_estudiante es ON u.id = es.usuario_id
                    WHERE pue.profesor_id = ? AND pue.activo = 1
                    ORDER BY COALESCE(pe.total_xp, 0) DESC
                    LIMIT 5
                `, [profesorId]);

                mejoresEstudiantes = mejoresEstudiantesData;
            } catch (studentsError) {
                console.error('Error en mejores estudiantes:', studentsError);
                mejoresEstudiantes = [];
            }

            let todosEstudiantes = [];
            try {
                const [todosEstudiantesData] = await pool.execute(`
                    SELECT
                        u.id,
                        u.nombre,
                        u.primer_apellido,
                        u.correo,
                        COALESCE(pe.nivel_actual, 'A1') as nivel_actual,
                        COALESCE(pe.idioma_aprendizaje, ?) as idioma_aprendizaje,
                        COALESCE(pe.total_xp, 0) as total_xp,
                        COALESCE(es.lecciones_completadas, 0) as lecciones_completadas,
                        COALESCE(es.lecciones_en_progreso, 0) as lecciones_en_progreso,
                        ROUND(COALESCE(es.promedio_general, 0), 2) as promedio_general,
                        COALESCE(es.tiempo_total_estudio, 0) as tiempo_total_estudio,
                        COALESCE(pe.racha_dias, 0) as racha_dias
                    FROM usuarios u
                    INNER JOIN profesor_estudiantes pue ON u.id = pue.estudiante_id
                    LEFT JOIN perfil_estudiantes pe ON u.id = pe.usuario_id
                    LEFT JOIN estadisticas_estudiante es ON u.id = es.usuario_id
                    WHERE pue.profesor_id = ? AND pue.activo = 1
                    ORDER BY u.nombre ASC
                `, [idiomaProfesor, profesorId]);

                todosEstudiantes = todosEstudiantesData;
                console.log(`📋 Todos los estudiantes cargados: ${todosEstudiantes.length} estudiantes`);
            } catch (todosError) {
                console.error('Error cargando todos los estudiantes:', todosError);
                todosEstudiantes = [];
            }

            console.log(`✅ Dashboard cargado: ${dashboardStats.total_estudiantes} estudiantes`);

            res.json({
                success: true,
                data: {
                    profesor: {
                        nombre: req.user.nombre || 'Profesor',
                        primer_apellido: req.user.primer_apellido || '',
                        correo: req.user.correo,
                        nivel: nivelProfesor,
                        idioma: idiomaProfesor,
                        curso_nombre: 'Curso de ' + idiomaProfesor
                    },
                    
                    estadisticas: {
                        total_estudiantes: dashboardStats.total_estudiantes,
                        promedio_clase: dashboardStats.promedio_general,
                        total_lecciones_completadas: dashboardStats.lecciones_completadas,
                        tiempo_total_horas: Math.round(dashboardStats.tiempo_total_estudio / 60) || 0
                    },
                    
                    top_estudiantes: mejoresEstudiantes,
                    
                    estudiantes_recientes: todosEstudiantes,
                    
                    alertas: alertas
                }
            });

        } catch (error) {
            console.error('❌ Error en dashboard profesor:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                detalle: error.message
            });
        }
    }

    /**
     * @route   GET /api/profesor/estudiantes
     * @desc    Obtener lista de estudiantes asignados
     */
    static async obtenerEstudiantes(req, res) {
        try {
            const profesorId = req.user.id;
            const { busqueda } = req.query;

            let whereClause = 'WHERE pue.profesor_id = ? AND pue.activo = 1';
            const params = [profesorId];

            if (busqueda) {
                whereClause += ' AND (u.nombre LIKE ? OR u.primer_apellido LIKE ?)';
                const searchTerm = `%${busqueda}%`;
                params.push(searchTerm, searchTerm);
            }

            const [estudiantes] = await pool.execute(`
                SELECT
                    u.id,
                    CONCAT(u.nombre, ' ', COALESCE(u.primer_apellido, '')) as nombre_completo,
                    u.correo,
                    pe.nivel_actual,
                    pe.total_xp,
                    pe.racha_dias,
                    es.lecciones_completadas,
                    es.lecciones_en_progreso,
                    ROUND(es.promedio_general, 2) as promedio_general,
                    es.tiempo_total_estudio,
                    pue.nivel_asignado,
                    pue.idioma_asignado,
                    pue.fecha_asignacion
                FROM usuarios u
                INNER JOIN profesor_estudiantes pue ON u.id = pue.estudiante_id
                LEFT JOIN perfil_estudiantes pe ON u.id = pe.usuario_id
                LEFT JOIN estadisticas_estudiante es ON u.id = es.usuario_id
                ${whereClause}
                ORDER BY u.nombre
            `, params);

            res.json({
                success: true,
                data: estudiantes
            });

        } catch (error) {
            console.error('Error obteniendo estudiantes:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }

    /**
     * @route   GET /api/profesor/estadisticas
     * @desc    Obtener estadísticas detalladas (RF-13)
     */
    static async obtenerEstadisticasDetalladas(req, res) {
        try {
            const profesorId = req.user.id;
            const { estudiante_id, nivel, idioma, fecha_desde, fecha_hasta } = req.query;

            if (estudiante_id) {
                return await ProfesorController.obtenerEstadisticasEstudiante(req, res);
            }

            const [asignaciones] = await pool.execute(`
                SELECT nivel, idioma 
                FROM profesor_asignaciones 
                WHERE profesor_id = ? AND activo = 1
                LIMIT 1
            `, [profesorId]);

            if (asignaciones.length === 0) {
                return res.status(403).json({
                    success: false,
                    error: 'Profesor sin nivel/idioma asignado'
                });
            }

            const nivelProfesor = nivel || asignaciones[0].nivel;
            const idiomaProfesor = idioma || asignaciones[0].idioma;

            const [estudiantes] = await pool.execute(`
                SELECT estudiante_id 
                FROM profesor_estudiantes 
                WHERE profesor_id = ? 
                AND nivel_asignado = ? 
                AND idioma_asignado = ?
                AND activo = 1
            `, [profesorId, nivelProfesor, idiomaProfesor]);

            if (estudiantes.length === 0) {
                return res.json({
                    success: true,
                    data: {
                        resumen_general: { total_alumnos: 0 },
                        mejores_alumnos: [],
                        tendencia_mensual: []
                    }
                });
            }

            const estudianteIds = estudiantes.map(e => e.estudiante_id);

            let condicionesFecha = '';
            const params = [estudianteIds];

            if (fecha_desde) {
                condicionesFecha += ' AND ee.ultima_vez_completado >= ?';
                params.push(fecha_desde);
            }
            if (fecha_hasta) {
                condicionesFecha += ' AND ee.ultima_vez_completado <= ?';
                params.push(fecha_hasta + ' 23:59:59');
            }

            const [resumen] = await pool.execute(`
                SELECT
                    COUNT(DISTINCT pe.estudiante_id) as total_alumnos,
                    COUNT(DISTINCT CASE 
                        WHEN ee.ultima_vez_completado >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                        THEN ee.usuario_id 
                    END) as alumnos_activos_7dias,
                    COALESCE(SUM(es.lecciones_completadas), 0) as lecciones_completadas_total,
                    ROUND(COALESCE(AVG(p.total_xp), 0), 2) as xp_promedio,
                    ROUND(COALESCE(AVG(es.promedio_general), 0), 2) as tasa_completacion,
                    ROUND(COALESCE(AVG(es.tiempo_total_estudio), 0) / 60.0, 2) as tiempo_promedio_horas
                FROM profesor_estudiantes pe
                LEFT JOIN estadisticas_estudiante es ON pe.estudiante_id = es.usuario_id
                LEFT JOIN perfil_estudiantes p ON pe.estudiante_id = p.usuario_id
                LEFT JOIN estadisticas_ejercicios ee ON pe.estudiante_id = ee.usuario_id
                WHERE pe.estudiante_id IN (?)
            `, [estudianteIds]);

            const [mejoresAlumnos] = await pool.execute(`
                SELECT
                    u.id as alumno_id,
                    CONCAT(u.nombre, ' ', COALESCE(u.primer_apellido, '')) as nombre,
                    COALESCE(pe.nivel_actual, 'A1') as nivel,
                    COALESCE(pe.total_xp, 0) as total_xp,
                    COALESCE(es.lecciones_completadas, 0) as lecciones_completadas,
                    COALESCE(pe.racha_dias, 0) as racha_dias
                FROM usuarios u
                INNER JOIN profesor_estudiantes pue ON u.id = pue.estudiante_id
                LEFT JOIN perfil_estudiantes pe ON u.id = pe.usuario_id
                LEFT JOIN estadisticas_estudiante es ON u.id = es.usuario_id
                WHERE u.id IN (?)
                ORDER BY pe.total_xp DESC
                LIMIT 10
            `, [estudianteIds]);

            const [tendencia] = await pool.execute(`
                SELECT
                    DATE_FORMAT(ee.ultima_vez_completado, '%Y-%m') as mes,
                    COUNT(DISTINCT ee.id) as ejercicios_completados,
                    COUNT(DISTINCT ee.usuario_id) as alumnos_activos,
                    ROUND(AVG(ee.mejor_puntuacion), 2) as puntuacion_promedio
                FROM estadisticas_ejercicios ee
                WHERE ee.usuario_id IN (?)
                  AND ee.ultima_vez_completado >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                  ${condicionesFecha}
                GROUP BY mes
                ORDER BY mes ASC
            `, params);

            res.json({
                success: true,
                data: {
                    resumen_general: resumen[0],
                    mejores_alumnos: mejoresAlumnos,
                    tendencia_mensual: tendencia,
                    filtros_aplicados: {
                        nivel: nivelProfesor,
                        idioma: idiomaProfesor,
                        fecha_desde,
                        fecha_hasta
                    }
                }
            });

        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }

    // ============================================
    // GESTIÓN DE RETROALIMENTACIÓN (RF-14)
    // ============================================

    /**
     * @route   POST /api/profesor/retroalimentacion
     * @desc    Enviar retroalimentación a estudiante
     */
    static async enviarRetroalimentacion(req, res) {
        const connection = await pool.getConnection();
        
        try {
            const profesorId = req.user.id;
            const { estudiante_id, asunto, mensaje, tipo = 'general', leccion_id, ejercicio_respuesta_id, calificacion } = req.body;

            if (!estudiante_id || !asunto || !mensaje) {
                return res.status(400).json({
                    success: false,
                    error: 'estudiante_id, asunto y mensaje son requeridos'
                });
            }

            await connection.beginTransaction();

            const [asignacion] = await connection.execute(`
                SELECT 1 FROM profesor_estudiantes 
                WHERE profesor_id = ? AND estudiante_id = ? AND activo = 1
            `, [profesorId, estudiante_id]);

            if (asignacion.length === 0) {
                await connection.rollback();
                return res.status(403).json({
                    success: false,
                    error: 'No tienes permisos para enviar retroalimentación a este estudiante'
                });
            }

            const [resultMensaje] = await connection.execute(`
                INSERT INTO mensajes (remitente_id, destinatario_id, asunto, mensaje, tipo)
                VALUES (?, ?, ?, ?, 'retroalimentacion')
            `, [profesorId, estudiante_id, asunto, mensaje]);

            const mensajeId = resultMensaje.insertId;

            const [resultRetro] = await connection.execute(`
                INSERT INTO retroalimentacion 
                (profesor_id, estudiante_id, leccion_id, ejercicio_respuesta_id, asunto, mensaje, tipo, calificacion, mensaje_id, leido, creado_en)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())
            `, [profesorId, estudiante_id, leccion_id || null, ejercicio_respuesta_id || null, asunto, mensaje, tipo, calificacion || null, mensajeId]);

            await connection.commit();

            res.json({
                success: true,
                mensaje: 'Retroalimentación enviada exitosamente',
                data: {
                    retroalimentacion_id: resultRetro.insertId,
                    mensaje_id: mensajeId
                }
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error enviando retroalimentación:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        } finally {
            connection.release();
        }
    }

    /**
     * @route   GET /api/profesor/retroalimentacion
     * @desc    Obtener historial de retroalimentaciones
     */
    static async obtenerRetroalimentaciones(req, res) {
        try {
            const profesorId = req.user.id;
            const { estudiante_id, leido } = req.query;

            let whereClause = 'WHERE r.profesor_id = ?';
            const params = [profesorId];

            if (estudiante_id) {
                whereClause += ' AND r.estudiante_id = ?';
                params.push(estudiante_id);
            }

            if (leido !== undefined) {
                whereClause += ' AND r.leido = ?';
                params.push(leido === 'true' ? 1 : 0);
            }

            const [retroalimentaciones] = await pool.execute(`
                SELECT
                    r.id,
                    r.estudiante_id,
                    CONCAT(u.nombre, ' ', COALESCE(u.primer_apellido, '')) as estudiante_nombre,
                    r.asunto,
                    r.mensaje,
                    r.tipo,
                    r.calificacion,
                    r.leido,
                    r.fecha_lectura,
                    r.leccion_id,
                    r.ejercicio_respuesta_id,
                    r.creado_en
                FROM retroalimentacion r
                INNER JOIN usuarios u ON r.estudiante_id = u.id
                ${whereClause}
                ORDER BY r.creado_en DESC
            `, params);

            res.json({
                success: true,
                data: retroalimentaciones
            });

        } catch (error) {
            console.error('Error obteniendo retroalimentaciones:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }

    // ============================================
    // NUEVO: EJERCICIOS PENDIENTES (RF-14)
    // ============================================

    /**
     * @route   GET /api/profesor/ejercicios-pendientes
     * @desc    Obtener ejercicios de escritura pendientes de retroalimentación
     */
    static async obtenerEjerciciosPendientes(req, res) {
        try {
            const profesorId = req.user.id;

            const [asignaciones] = await pool.execute(`
                SELECT nivel, idioma 
                FROM profesor_asignaciones 
                WHERE profesor_id = ? AND activo = 1
                LIMIT 1
            `, [profesorId]);

            if (asignaciones.length === 0) {
                return res.status(403).json({
                    success: false,
                    error: 'Profesor sin nivel/idioma asignado'
                });
            }

            const { nivel, idioma } = asignaciones[0];

            const [estudiantes] = await pool.execute(`
                SELECT estudiante_id 
                FROM profesor_estudiantes 
                WHERE profesor_id = ? AND activo = 1
            `, [profesorId]);

            if (estudiantes.length === 0) {
                return res.json({
                    success: true,
                    data: {
                        total_pendientes: 0,
                        ejercicios: [],
                        mensaje: 'No hay estudiantes asignados'
                    }
                });
            }

            const estudianteIds = estudiantes.map(e => e.estudiante_id);

            const [ejercicios] = await pool.execute(`
                SELECT
                    re.id as respuesta_id,
                    re.usuario_id as alumno_id,
                    CONCAT(u.nombre, ' ', COALESCE(u.primer_apellido, '')) as alumno_nombre,
                    e.id as ejercicio_id,
                    e.pregunta as ejercicio_titulo,
                    re.respuesta_texto,
                    l.nivel,
                    l.idioma,
                    re.creado_en as fecha_envio,
                    EXISTS(
                        SELECT 1 FROM retroalimentacion r 
                        WHERE r.ejercicio_respuesta_id = re.id
                    ) as tiene_retroalimentacion
                FROM resultados_ejercicios re
                INNER JOIN usuarios u ON re.usuario_id = u.id
                INNER JOIN ejercicios e ON re.ejercicio_id = e.id
                INNER JOIN lecciones l ON e.leccion_id = l.id
                WHERE e.tipo = 'escritura'
                  AND l.nivel = ?
                  AND l.idioma = ?
                  AND re.usuario_id IN (?)
                  AND NOT EXISTS (
                      SELECT 1 FROM retroalimentacion r
                      WHERE r.ejercicio_respuesta_id = re.id
                  )
                ORDER BY re.creado_en DESC
                LIMIT 50
            `, [nivel, idioma, estudianteIds]);

            console.log(`📝 Encontrados ${ejercicios.length} ejercicios pendientes`);

            res.json({
                success: true,
                data: {
                    total_pendientes: ejercicios.length,
                    ejercicios,
                    filtros: {
                        nivel,
                        idioma,
                        total_estudiantes: estudianteIds.length
                    }
                }
            });

        } catch (error) {
            console.error('❌ Error obteniendo ejercicios pendientes:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                detalle: error.message
            });
        }
    }

    // ============================================
    // PLANIFICACIÓN DE CONTENIDOS (RF-15)
    // ============================================

    /**
     * @route   POST /api/profesor/planes
     * @desc    Crear plan de estudio personalizado
     */
    static async crearPlan(req, res) {
        const connection = await pool.getConnection();
        
        try {
            const profesorId = req.user.id;
            const { 
                estudiante_id, 
                titulo, 
                descripcion, 
                objetivos, 
                temas_dificultad, 
                lecciones_sugeridas, 
                ejercicios_extra,
                fecha_inicio,
                fecha_fin_estimada,
                areas_enfoque
            } = req.body;

            if (!estudiante_id || !titulo) {
                return res.status(400).json({
                    success: false,
                    error: 'estudiante_id y titulo son requeridos'
                });
            }

            await connection.beginTransaction();

            const [asignacion] = await connection.execute(`
                SELECT 1 FROM profesor_estudiantes 
                WHERE profesor_id = ? AND estudiante_id = ? AND activo = 1
            `, [profesorId, estudiante_id]);

            if (asignacion.length === 0) {
                await connection.rollback();
                return res.status(403).json({
                    success: false,
                    error: 'No tienes permisos para crear planes para este estudiante'
                });
            }

            const [perfil] = await connection.execute(`
                SELECT nivel_actual FROM perfil_estudiantes WHERE usuario_id = ?
            `, [estudiante_id]);

            const nivel = perfil[0]?.nivel_actual || 'A1';

            const [resultPlan] = await connection.execute(`
                INSERT INTO planes_estudio
                (profesor_id, estudiante_id, curso_id, titulo, descripcion, objetivos, 
                 temas_dificultad, lecciones_sugeridas, ejercicios_extra, areas_enfoque,
                 estado, progreso, fecha_inicio, fecha_fin_estimada)
                VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, 'pendiente', 0, ?, ?)
            `, [
                profesorId,
                estudiante_id,
                titulo,
                descripcion || '',
                objetivos || '',
                JSON.stringify(temas_dificultad || []),
                JSON.stringify(lecciones_sugeridas || []),
                JSON.stringify(ejercicios_extra || []),
                JSON.stringify(areas_enfoque || []),
                fecha_inicio || new Date().toISOString().split('T')[0],
                fecha_fin_estimada || null
            ]);

            const planId = resultPlan.insertId;

            await connection.commit();

            res.json({
                success: true,
                mensaje: 'Plan de estudio creado exitosamente',
                data: {
                    plan_id: planId
                }
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error creando plan:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        } finally {
            connection.release();
        }
    }

    /**
     * @route   GET /api/profesor/planes
     * @desc    Obtener planes de estudio
     */
    static async obtenerPlanes(req, res) {
        try {
            const profesorId = req.user.id;
            const { estado } = req.query;

            let whereClause = 'WHERE p.profesor_id = ?';
            const params = [profesorId];

            if (estado) {
                whereClause += ' AND p.estado = ?';
                params.push(estado);
            }

            const [planes] = await pool.execute(`
                SELECT
                    p.id,
                    p.titulo,
                    p.descripcion,
                    p.estado,
                    p.progreso,
                    p.fecha_inicio,
                    p.fecha_fin_estimada,
                    p.fecha_completado,
                    p.areas_enfoque,
                    p.temas_dificultad,
                    p.lecciones_sugeridas,
                    u.id as estudiante_id,
                    CONCAT(u.nombre, ' ', COALESCE(u.primer_apellido, '')) as estudiante_nombre,
                    pe.nivel_actual as nivel_estudiante
                FROM planes_estudio p
                INNER JOIN usuarios u ON p.estudiante_id = u.id
                LEFT JOIN perfil_estudiantes pe ON u.id = pe.usuario_id
                ${whereClause}
                ORDER BY p.creado_en DESC
            `, params);

            const planesFormateados = planes.map(plan => ({
                ...plan,
                areas_enfoque: plan.areas_enfoque ? JSON.parse(plan.areas_enfoque) : [],
                temas_dificultad: plan.temas_dificultad ? JSON.parse(plan.temas_dificultad) : [],
                lecciones_sugeridas: plan.lecciones_sugeridas ? JSON.parse(plan.lecciones_sugeridas) : []
            }));

            res.json({
                success: true,
                data: planesFormateados
            });

        } catch (error) {
            console.error('Error obteniendo planes:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }

    // ============================================
    // NUEVO: ANÁLISIS DE RENDIMIENTO (RF-15)
    // ============================================

    /**
     * @route   GET /api/profesor/analisis-rendimiento
     * @desc    Analizar rendimiento del grupo y detectar áreas críticas
     */
    static async analizarRendimiento(req, res) {
        try {
            const profesorId = req.user.id;

            const [asignaciones] = await pool.execute(`
                SELECT nivel, idioma 
                FROM profesor_asignaciones 
                WHERE profesor_id = ? AND activo = 1
                LIMIT 1
            `, [profesorId]);

            if (asignaciones.length === 0) {
                return res.status(403).json({
                    success: false,
                    error: 'Profesor sin nivel/idioma asignado'
                });
            }

            const { nivel, idioma } = asignaciones[0];

            const [estudiantes] = await pool.execute(`
                SELECT estudiante_id 
                FROM profesor_estudiantes 
                WHERE profesor_id = ? AND activo = 1
            `, [profesorId]);

            if (estudiantes.length === 0) {
                return res.json({
                    success: true,
                    data: {
                        areas_criticas: [],
                        sugerencias: [],
                        estadisticas_grupo: {
                            total_estudiantes: 0,
                            mensaje: 'No hay estudiantes asignados'
                        }
                    }
                });
            }

            const estudianteIds = estudiantes.map(e => e.estudiante_id);

            const [analisisEjercicios] = await pool.execute(`
                SELECT
                    ee.tipo_ejercicio as area,
                    COUNT(DISTINCT ee.usuario_id) as estudiantes_afectados,
                    SUM(ee.intentos_totales) as total_intentos,
                    SUM(ee.intentos_incorrectos) as ejercicios_fallados,
                    ROUND(
                        (SUM(ee.intentos_incorrectos) * 100.0) / NULLIF(SUM(ee.intentos_totales), 0),
                        2
                    ) as porcentaje_error
                FROM estadisticas_ejercicios ee
                WHERE ee.usuario_id IN (?)
                GROUP BY ee.tipo_ejercicio
                HAVING porcentaje_error > 25 OR ejercicios_fallados > 5
                ORDER BY porcentaje_error DESC
            `, [estudianteIds]);

            const areasCriticas = analisisEjercicios.map(area => {
                let nivel_criticidad = 'baja';
                if (area.porcentaje_error > 40) nivel_criticidad = 'alta';
                else if (area.porcentaje_error > 30) nivel_criticidad = 'media';

                return {
                    area: area.area,
                    nombre: ProfesorController.obtenerNombreArea(area.area),
                    porcentaje_error: parseFloat(area.porcentaje_error) || 0,
                    estudiantes_afectados: area.estudiantes_afectados,
                    ejercicios_fallados: area.ejercicios_fallados,
                    nivel_criticidad
                };
            });

            const sugerencias = [];
            areasCriticas.forEach(area => {
                if (area.nivel_criticidad === 'alta') {
                    sugerencias.push({
                        titulo: `Refuerzo urgente en ${area.nombre}`,
                        descripcion: `${area.estudiantes_afectados} estudiantes tienen dificultades significativas (${area.porcentaje_error}% de error)`,
                        accion: 'crear_plan_refuerzo',
                        prioridad: 'alta',
                        area: area.area
                    });
                } else if (area.nivel_criticidad === 'media') {
                    sugerencias.push({
                        titulo: `Practicar ${area.nombre}`,
                        descripcion: `${area.estudiantes_afectados} estudiantes necesitan práctica adicional`,
                        accion: 'sugerir_ejercicios',
                        prioridad: 'media',
                        area: area.area
                    });
                }
            });

            const [statsGrupo] = await pool.execute(`
                SELECT
                    COUNT(DISTINCT es.usuario_id) as total_estudiantes,
                    ROUND(AVG(es.promedio_general), 2) as promedio_general,
                    SUM(es.lecciones_completadas) as lecciones_completadas_total,
                    ROUND(AVG(es.tiempo_total_estudio) / 60, 2) as horas_estudio_promedio
                FROM estadisticas_estudiante es
                WHERE es.usuario_id IN (?)
            `, [estudianteIds]);

            console.log(`🔍 Análisis completado: ${areasCriticas.length} áreas críticas detectadas`);

            res.json({
                success: true,
                data: {
                    areas_criticas: areasCriticas,
                    sugerencias: sugerencias,
                    estadisticas_grupo: statsGrupo[0],
                    resumen: {
                        total_estudiantes_analizados: estudianteIds.length,
                        areas_con_problemas: areasCriticas.length,
                        sugerencias_generadas: sugerencias.length
                    }
                }
            });

        } catch (error) {
            console.error('❌ Error analizando rendimiento:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                detalle: error.message
            });
        }
    }

    // ============================================
    // ALERTAS Y NOTIFICACIONES
    // ============================================

    static async obtenerAlertas(req, res) {
        try {
            const profesorId = req.user.id;
            const { solo_no_revisadas = 'true' } = req.query;

            let whereClause = 'WHERE pe.profesor_id = ?';
            const params = [profesorId];

            if (solo_no_revisadas === 'true') {
                whereClause += ' AND r.leido = 0';
            }

            const [alertas] = await pool.execute(`
                SELECT
                    r.id,
                    'retroalimentacion' as tipo,
                    CONCAT(u.nombre, ' ', COALESCE(u.primer_apellido, '')) as estudiante_nombre,
                    r.asunto,
                    r.mensaje,
                    r.leido,
                    r.creado_en
                FROM retroalimentacion r
                INNER JOIN usuarios u ON r.estudiante_id = u.id
                INNER JOIN profesor_estudiantes pe ON r.estudiante_id = pe.estudiante_id
                ${whereClause}
                ORDER BY r.creado_en DESC
                LIMIT 20
            `, params);

            res.json({
                success: true,
                data: alertas
            });

        } catch (error) {
            console.error('Error obteniendo alertas:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }

    static async marcarAlertaRevisada(req, res) {
        try {
            const { id } = req.params;
            const profesorId = req.user.id;

            const [alerta] = await pool.execute(`
                SELECT 1 FROM retroalimentacion r
                INNER JOIN profesor_estudiantes pe ON r.estudiante_id = pe.estudiante_id
                WHERE r.id = ? AND pe.profesor_id = ?
            `, [id, profesorId]);

            if (alerta.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Alerta no encontrada'
                });
            }

            await pool.execute(`
                UPDATE retroalimentacion 
                SET leido = 1, fecha_lectura = NOW() 
                WHERE id = ?
            `, [id]);

            res.json({
                success: true,
                message: 'Alerta marcada como revisada'
            });

        } catch (error) {
            console.error('Error marcando alerta:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }

    // ============================================
    // GESTIÓN DE CONTENIDO
    // ============================================

    static async obtenerLecciones(req, res) {
        try {
            const profesorId = req.user.id;

            const [asignaciones] = await pool.execute(`
                SELECT nivel, idioma 
                FROM profesor_asignaciones 
                WHERE profesor_id = ? AND activo = 1
                LIMIT 1
            `, [profesorId]);

            if (asignaciones.length === 0) {
                return res.status(403).json({
                    success: false,
                    error: 'Profesor sin nivel/idioma asignado'
                });
            }

            const { nivel, idioma } = asignaciones[0];

            const [lecciones] = await pool.execute(`
                SELECT
                    l.id,
                    l.titulo,
                    l.descripcion,
                    l.nivel,
                    l.idioma,
                    l.orden,
                    COUNT(DISTINCT e.id) as total_ejercicios
                FROM lecciones l
                LEFT JOIN ejercicios e ON l.id = e.leccion_id
                WHERE l.nivel = ? AND l.idioma = ?
                GROUP BY l.id
                ORDER BY l.orden
            `, [nivel, idioma]);

            res.json({
                success: true,
                data: lecciones
            });

        } catch (error) {
            console.error('Error obteniendo lecciones:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }

    // ============================================
    // MÉTODOS AUXILIARES
    // ============================================

    /**
     * Método auxiliar para estadísticas de estudiante específico
     */
    static async obtenerEstadisticasEstudiante(req, res) {
        try {
            const profesorId = req.user.id;
            const { estudiante_id } = req.query;

            const [asignacion] = await pool.execute(`
                SELECT 1 FROM profesor_estudiantes 
                WHERE profesor_id = ? AND estudiante_id = ? AND activo = 1
            `, [profesorId, estudiante_id]);

            if (asignacion.length === 0) {
                return res.status(403).json({
                    success: false,
                    error: 'No tienes permisos para ver estadísticas de este estudiante'
                });
            }

            const [estadisticas] = await pool.execute(`
                SELECT
                    u.id,
                    CONCAT(u.nombre, ' ', COALESCE(u.primer_apellido, '')) as nombre,
                    pe.nivel_actual,
                    pe.total_xp,
                    pe.racha_dias,
                    es.lecciones_completadas,
                    es.lecciones_en_progreso,
                    es.promedio_general,
                    es.tiempo_total_estudio,
                    es.ultima_actualizacion
                FROM usuarios u
                LEFT JOIN perfil_estudiantes pe ON u.id = pe.usuario_id
                LEFT JOIN estadisticas_estudiante es ON u.id = es.usuario_id
                WHERE u.id = ?
            `, [estudiante_id]);

            res.json({
                success: true,
                data: estadisticas[0]
            });

        } catch (error) {
            console.error('Error obteniendo estadísticas de estudiante:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }

    /**
     * Función helper para nombres de áreas
     */
    static obtenerNombreArea(tipo) {
        const nombres = {
            'gramatica': 'Gramática',
            'vocabulario': 'Vocabulario',
            'escucha': 'Comprensión Auditiva',
            'escritura': 'Escritura',
            'lectura': 'Comprensión Lectora',
            'pronunciacion': 'Pronunciación',
            'conversacion': 'Conversación',
            'comprension': 'Comprensión General',
            'traduccion': 'Traducción',
            'conjugacion': 'Conjugación Verbal'
        };
        return nombres[tipo] || tipo;
    }
}

module.exports = ProfesorController;