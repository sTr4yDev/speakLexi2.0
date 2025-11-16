// backend/controllers/leccionController.js
const Leccion = require('../models/lecciones');
const Multimedia = require('../models/multimedia');
const Gamificacion = require('../models/gamificacionModel');
const Estadisticas = require('../models/estadisticasModel');
const logrosHelper = require('../helpers/logrosHelper');
const { pool } = require('../config/database');

// @desc    Obtener catálogo de lecciones SOLO del nivel del usuario
// @route   GET /api/lecciones/catalogo
// @access  Private
exports.obtenerCatalogo = async (req, res) => {
    try {
        const { busqueda, limit = 50, offset = 0 } = req.query;
        const usuarioId = req.user.id;
        
        // 🎯 OBTENER IDIOMA Y NIVEL DEL USUARIO
        const [usuario] = await pool.execute(`
            SELECT 
                COALESCE(pe.idioma_aprendizaje, 'Inglés') as idioma,
                COALESCE(pe.nivel_actual, 'A1') as nivel
            FROM usuarios u
            LEFT JOIN perfil_estudiantes pe ON u.id = pe.usuario_id
            WHERE u.id = ?
        `, [usuarioId]);

        const idiomaUsuario = usuario[0]?.idioma || 'Inglés';
        const nivelUsuario = usuario[0]?.nivel || 'A1';
        
        // 🎯 CAMBIO CRÍTICO: SIEMPRE usar nivel e idioma del usuario, IGNORAR parámetros de filtro
        const idiomaFiltro = idiomaUsuario;
        const nivelFiltro = nivelUsuario;
        
        // Construir condiciones de filtro
        const condiciones = [];
        const params = [];
        
        // 🎯 SIEMPRE filtrar por idioma del usuario
        condiciones.push('AND l.idioma = ?');
        params.push(idiomaFiltro);
        
        // 🎯 SIEMPRE filtrar por nivel del usuario
        condiciones.push('AND l.nivel = ?');
        params.push(nivelFiltro);
        
        // Búsqueda opcional
        if (busqueda) {
            condiciones.push('AND (l.titulo LIKE ? OR l.descripcion LIKE ?)');
            const searchTerm = `%${busqueda}%`;
            params.push(searchTerm, searchTerm);
        }
        
        const condicionesStr = condiciones.join(' ');
        
        // ✅ CONSULTA PRINCIPAL CORREGIDA
        const query = `
            SELECT 
                l.id,
                l.titulo,
                l.descripcion,
                l.nivel,
                l.idioma,
                l.duracion_minutos,
                l.orden,
                COUNT(DISTINCT e.id) as total_ejercicios,
                COALESCE(MAX(p.progreso), 0) as progreso_usuario,
                CASE 
                    WHEN MAX(p.completada) = 1 THEN 'completada'
                    WHEN MAX(p.progreso) > 0 THEN 'en_progreso'
                    ELSE 'nueva'
                END as estado_usuario
            FROM lecciones l
            LEFT JOIN ejercicios e ON l.id = e.leccion_id AND e.estado = 'activo'
            LEFT JOIN progreso_lecciones p ON l.id = p.leccion_id AND p.usuario_id = ?
            WHERE l.estado = 'activa'
            ${condicionesStr}
            GROUP BY l.id, l.titulo, l.descripcion, l.nivel, l.idioma, l.duracion_minutos, l.orden
            ORDER BY 
                l.orden, 
                l.titulo
            LIMIT ? OFFSET ?
        `;
        
        // 🔥 FIX DEFINITIVO: Convertir a STRING para evitar bug de MySQL 8.0.22+
        const queryParams = [
            usuarioId,      // Para LEFT JOIN p.usuario_id = ?
            ...params,      // Para condiciones WHERE (idiomaFiltro + nivelFiltro + busqueda)
            String(parseInt(limit)),     // ✅ Convertir a STRING
            String(parseInt(offset))     // ✅ Convertir a STRING
        ];
        
        console.log('🔍 Query params:', queryParams);
        console.log('🎯 Filtros AUTOMÁTICOS aplicados:', {
            nivel: nivelFiltro,
            idioma: idiomaFiltro,
            busqueda: busqueda || 'ninguna'
        });
        
        // 🔥 ALTERNATIVA: Si sigue fallando, usar pool.query en lugar de execute
        let lecciones;
        try {
            [lecciones] = await pool.execute(query, queryParams);
        } catch (executeError) {
            console.log('⚠️  Execute falló, intentando con query...');
            [lecciones] = await pool.query(query, queryParams);
        }
        
        // Contar total - FIX: usar solo los parámetros de condiciones (sin usuarioId, limit, offset)
        const countQuery = `
            SELECT COUNT(DISTINCT l.id) as total
            FROM lecciones l
            WHERE l.estado = 'activa'
            ${condicionesStr}
        `;
        
        // ✅ FIX: Solo usar params (que contiene solo los filtros)
        const [countResult] = await pool.execute(countQuery, params);
        const totalLecciones = countResult[0].total;
        
        // Obtener estadísticas por niveles (solo para mostrar progreso general)
        const [statsPorNivel] = await pool.execute(`
            SELECT 
                l.nivel,
                COUNT(*) as total_lecciones,
                SUM(CASE WHEN p.completada = 1 THEN 1 ELSE 0 END) as lecciones_completadas,
                ROUND(SUM(CASE WHEN p.completada = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as porcentaje_completado
            FROM lecciones l
            LEFT JOIN progreso_lecciones p ON l.id = p.leccion_id AND p.usuario_id = ?
            WHERE l.estado = 'activa' AND l.idioma = ?
            GROUP BY l.nivel
            ORDER BY 
                CASE l.nivel
                    WHEN 'A1' THEN 1
                    WHEN 'A2' THEN 2
                    WHEN 'B1' THEN 3
                    WHEN 'B2' THEN 4
                    WHEN 'C1' THEN 5
                    WHEN 'C2' THEN 6
                    ELSE 7
                END
        `, [usuarioId, idiomaUsuario]);

        // 🔍 DEBUG: Verificar datos del usuario antes de enviar
        console.log('🔍 DEBUG - Usuario enviado al frontend:');
        console.log('idiomaUsuario:', idiomaUsuario);
        console.log('nivelUsuario:', nivelUsuario);
        console.log('usuario[0]:', usuario[0]);
        
        res.json({
            success: true,
            data: {
                lecciones,
                total: totalLecciones,
                paginacion: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: (parseInt(offset) + lecciones.length) < totalLecciones
                },
                estadisticas_por_nivel: statsPorNivel,
                usuario: {
                    idioma: idiomaUsuario,
                    nivel: nivelUsuario
                },
                filtros_aplicados: {
                    nivel: nivelFiltro,      // Siempre el nivel del usuario
                    idioma: idiomaFiltro,    // Siempre el idioma del usuario
                    busqueda: busqueda || null
                },
                mensaje: `Mostrando lecciones de nivel ${nivelUsuario} en ${idiomaUsuario}`
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo catálogo:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener catálogo de lecciones'
        });
    }
};

// @desc    Obtener idiomas disponibles
// @route   GET /api/lecciones/idiomas
// @access  Private
exports.obtenerIdiomas = async (req, res) => {
    try {
        const [idiomas] = await pool.execute(`
            SELECT DISTINCT idioma 
            FROM lecciones 
            WHERE estado = 'activa'
            ORDER BY idioma
        `);
        
        res.json({
            success: true,
            data: idiomas.map(row => row.idioma)
        });
    } catch (error) {
        console.error('Error obteniendo idiomas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener idiomas'
        });
    }
};

// @desc    Obtener niveles disponibles
// @route   GET /api/lecciones/niveles
// @access  Private
exports.obtenerNiveles = async (req, res) => {
    try {
        const [niveles] = await pool.execute(`
            SELECT DISTINCT nivel 
            FROM lecciones 
            WHERE estado = 'activa'
            ORDER BY 
                CASE nivel
                    WHEN 'A1' THEN 1
                    WHEN 'A2' THEN 2
                    WHEN 'B1' THEN 3
                    WHEN 'B2' THEN 4
                    WHEN 'C1' THEN 5
                    WHEN 'C2' THEN 6
                    ELSE 7
                END
        `);
        
        res.json({
            success: true,
            data: niveles.map(row => row.nivel)
        });
    } catch (error) {
        console.error('Error obteniendo niveles:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener niveles'
        });
    }
};

// @desc    Obtener estadísticas de progreso del usuario
// @route   GET /api/lecciones/estadisticas/progreso
// @access  Private
exports.obtenerEstadisticasProgreso = async (req, res) => {
    try {
        const usuarioId = req.user.id;

        // Obtener estadísticas generales
        const [stats] = await pool.execute(`
            SELECT 
                COUNT(DISTINCT l.id) as total_lecciones,
                SUM(CASE WHEN p.completada = 1 THEN 1 ELSE 0 END) as lecciones_completadas,
                ROUND(SUM(CASE WHEN p.completada = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(DISTINCT l.id), 2) as porcentaje_total,
                SUM(CASE WHEN p.progreso > 0 AND p.completada = 0 THEN 1 ELSE 0 END) as lecciones_en_progreso
            FROM lecciones l
            LEFT JOIN progreso_lecciones p ON l.id = p.leccion_id AND p.usuario_id = ?
            WHERE l.estado = 'activa'
        `, [usuarioId]);

        // Progreso por nivel
        const [progresoNiveles] = await pool.execute(`
            SELECT 
                l.nivel,
                COUNT(*) as total_lecciones,
                SUM(CASE WHEN p.completada = 1 THEN 1 ELSE 0 END) as lecciones_completadas,
                ROUND(SUM(CASE WHEN p.completada = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as porcentaje_completado
            FROM lecciones l
            LEFT JOIN progreso_lecciones p ON l.id = p.leccion_id AND p.usuario_id = ?
            WHERE l.estado = 'activa'
            GROUP BY l.nivel
            ORDER BY 
                CASE l.nivel
                    WHEN 'A1' THEN 1
                    WHEN 'A2' THEN 2
                    WHEN 'B1' THEN 3
                    WHEN 'B2' THEN 4
                    WHEN 'C1' THEN 5
                    WHEN 'C2' THEN 6
                    ELSE 7
                END
        `, [usuarioId]);

        res.json({
            success: true,
            data: {
                estadisticas_generales: stats[0],
                progreso_por_nivel: progresoNiveles
            }
        });

    } catch (error) {
        console.error('Error obteniendo estadísticas de progreso:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas de progreso'
        });
    }
};

// @desc    Obtener lecciones recientes del usuario
// @route   GET /api/lecciones/recientes
// @access  Private
exports.obtenerLeccionesRecientes = async (req, res) => {
    try {
        const usuarioId = req.user.id;
        const limit = parseInt(req.query.limit) || 5;

        const [lecciones] = await pool.execute(`
            SELECT 
                l.id,
                l.titulo,
                l.descripcion,
                l.nivel,
                l.idioma,
                l.duracion_minutos,
                p.ultima_actualizacion,
                p.progreso,
                p.completada
            FROM lecciones l
            INNER JOIN progreso_lecciones p ON l.id = p.leccion_id AND p.usuario_id = ?
            WHERE l.estado = 'activa'
            ORDER BY p.ultima_actualizacion DESC
            LIMIT ?
        `, [usuarioId, limit]);

        res.json({
            success: true,
            data: lecciones
        });

    } catch (error) {
        console.error('Error obteniendo lecciones recientes:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener lecciones recientes'
        });
    }
};

// ========================================
// FUNCIONES ORIGINALES DEL CONTROLADOR
// ========================================

// @desc    Crear nueva lección
// @route   POST /api/lecciones
// @access  Private (Profesor/Admin)
exports.crearLeccion = async (req, res) => {
    try {
        const {
            titulo,
            descripcion,
            contenido,
            nivel,
            idioma,
            duracion_minutos,
            orden
        } = req.body;

        // Validar datos requeridos
        if (!titulo || !nivel || !idioma) {
            return res.status(400).json({
                success: false,
                error: 'Título, nivel e idioma son requeridos'
            });
        }

        const leccionData = {
            titulo,
            descripcion: descripcion || '',
            contenido: contenido || '',
            nivel,
            idioma,
            duracion_minutos: duracion_minutos || 30,
            orden: orden || 0,
            estado: 'borrador',
            creado_por: req.user.id
        };

        const leccionId = await Leccion.crear(leccionData);

        res.status(201).json({
            success: true,
            mensaje: 'Lección creada exitosamente',
            data: {
                id: leccionId,
                leccion_id: leccionId,
                ...leccionData
            }
        });

    } catch (error) {
        console.error('Error creando lección:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al crear lección'
        });
    }
};

// @desc    Listar TODAS las lecciones (para admin)
// @route   GET /api/lecciones
// @access  Private (Admin)
exports.listarTodasLecciones = async (req, res) => {
    try {
        const { pagina = 1, limite = 50, nivel, idioma, estado } = req.query;

        const resultado = await Leccion.listarTodas(pagina, limite, { nivel, idioma, estado });

        res.json({
            success: true,
            data: resultado.lecciones,
            paginacion: resultado.paginacion
        });

    } catch (error) {
        console.error('Error listando todas las lecciones:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al listar lecciones'
        });
    }
};

// @desc    Listar lecciones por nivel e idioma
// @route   GET /api/lecciones/nivel/:nivel
// @access  Private
exports.listarLecciones = async (req, res) => {
    try {
        const { nivel } = req.params;
        const { idioma, pagina = 1, limite = 10 } = req.query;

        if (!idioma) {
            return res.status(400).json({
                success: false,
                error: 'El parámetro idioma es requerido'
            });
        }

        const resultado = await Leccion.listarPorNivel(nivel, idioma, pagina, limite);

        res.json({
            success: true,
            data: resultado.lecciones,
            paginacion: resultado.paginacion
        });

    } catch (error) {
        console.error('Error listando lecciones:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al listar lecciones'
        });
    }
};

// @desc    Obtener lección por ID
// @route   GET /api/lecciones/:id
// @access  Private
exports.obtenerLeccion = async (req, res) => {
    try {
        const leccionId = req.params.id;
        const leccion = await Leccion.obtenerPorId(leccionId);

        if (!leccion) {
            return res.status(404).json({
                success: false,
                error: 'Lección no encontrada'
            });
        }

        // Obtener multimedia asociada
        const multimedia = await Multimedia.obtenerPorLeccion(leccionId);

        res.json({
            success: true,
            data: {
                ...leccion,
                multimedia
            }
        });

    } catch (error) {
        console.error('Error obteniendo lección:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al obtener lección'
        });
    }
};

// @desc    Actualizar lección
// @route   PUT /api/lecciones/:id
// @access  Private (Profesor/Admin)
exports.actualizarLeccion = async (req, res) => {
    try {
        const leccionId = req.params.id;
        const datosActualizacion = req.body;

        // Verificar que la lección existe
        const leccionExistente = await Leccion.obtenerPorId(leccionId);
        if (!leccionExistente) {
            return res.status(404).json({
                success: false,
                error: 'Lección no encontrada'
            });
        }

        // Verificar permisos (solo el creador o admin puede editar)
        if (leccionExistente.creado_por !== req.user.id && req.user.rol !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'No tienes permisos para editar esta lección'
            });
        }

        const actualizado = await Leccion.actualizar(leccionId, datosActualizacion);

        if (actualizado) {
            res.json({
                success: true,
                mensaje: 'Lección actualizada exitosamente'
            });
        } else {
            res.status(400).json({
                success: false,
                error: 'No se pudo actualizar la lección'
            });
        }

    } catch (error) {
        console.error('Error actualizando lección:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al actualizar lección'
        });
    }
};

// @desc    Eliminar lección
// @route   DELETE /api/lecciones/:id
// @access  Private (Profesor/Admin)
exports.eliminarLeccion = async (req, res) => {
    try {
        const leccionId = req.params.id;

        // Verificar que la lección existe
        const leccionExistente = await Leccion.obtenerPorId(leccionId);
        if (!leccionExistente) {
            return res.status(404).json({
                success: false,
                error: 'Lección no encontrada'
            });
        }

        // Verificar permisos
        if (leccionExistente.creado_por !== req.user.id && req.user.rol !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'No tienes permisos para eliminar esta lección'
            });
        }

        const eliminado = await Leccion.eliminar(leccionId);

        if (eliminado) {
            res.json({
                success: true,
                mensaje: 'Lección eliminada exitosamente'
            });
        } else {
            res.status(400).json({
                success: false,
                error: 'No se pudo eliminar la lección'
            });
        }

    } catch (error) {
        console.error('Error eliminando lección:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al eliminar lección'
        });
    }
};

// @desc    Registrar progreso de lección
// @route   POST /api/lecciones/:id/progreso
// @access  Private
exports.registrarProgreso = async (req, res) => {
    try {
        const leccionId = req.params.id;
        const { progreso } = req.body;
        const usuarioId = req.user.id;

        // PASO 1: Validar progreso
        if (progreso < 0 || progreso > 100) {
            return res.status(400).json({
                success: false,
                error: 'El progreso debe estar entre 0 y 100'
            });
        }

        // PASO 2: Obtener información de la lección
        const leccion = await Leccion.obtenerPorId(leccionId);
        if (!leccion) {
            return res.status(404).json({
                success: false,
                error: 'Lección no encontrada'
            });
        }

        // PASO 3: Verificar progreso anterior usando el modelo Leccion
        const progresoAnterior = await Leccion.obtenerProgreso(usuarioId, leccionId);
        
        const esPrimeraVez = !progresoAnterior;
        const yaCompletada = progresoAnterior ? progresoAnterior.completada : false;

        // PASO 4: Registrar progreso en BD
        await Leccion.registrarProgreso(usuarioId, leccionId, progreso);

        // PASO 5: Si completó (100%) y NO estaba completada antes, otorgar XP
        if (progreso >= 100 && !yaCompletada) {
            // Calcular XP base según nivel
            const xpPorNivel = {
                'A1': 10, 'A2': 15, 'B1': 25,
                'B2': 35, 'C1': 45, 'C2': 50
            };
            const xpBase = xpPorNivel[leccion.nivel] || 10;

            // Bonus por duración (2 XP cada 10 minutos)
            const xpDuracion = Math.floor(leccion.duracion_minutos / 10) * 2;

            // Bonus primera vez (x2)
            const multiplicador = esPrimeraVez ? 2 : 1;
            
            const xpTotal = (xpBase + xpDuracion) * multiplicador;

            // Otorgar XP usando modelo de gamificación
            await Gamificacion.otorgarXP(usuarioId, xpTotal, {
                tipo: 'leccion_completada',
                leccion_id: leccionId,
                nivel: leccion.nivel,
                primera_vez: esPrimeraVez
            });

            // Actualizar estadísticas
            await Estadisticas.actualizarDesdeProgreso(usuarioId);

            // Verificar y desbloquear logros
            const logrosNuevos = await logrosHelper.verificarLogros(usuarioId, {
                porcentaje,
                nivel: leccion.nivel,
                leccion_id: leccionId
            });

            // Actualizar racha si aplica
            //await Gamificacion.actualizarRacha(usuarioId);

            return res.json({
                success: true,
                mensaje: '¡Lección completada! 🎉',
                data: {
                    progreso: 100,
                    completada: true,
                    xp_ganado: xpTotal,
                    es_primera_vez: esPrimeraVez,
                    logros_desbloqueados: logrosNuevos,
                    nueva_racha: logrosNuevos.some(l => l.tipo === 'racha')
                }
            });
        }

        // Si solo actualizó progreso (no completó) o ya estaba completada
        res.json({
            success: true,
            mensaje: 'Progreso actualizado',
            data: {
                progreso: progreso,
                completada: progreso === 100
            }
        });

    } catch (error) {
        console.error('Error registrando progreso:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al registrar progreso'
        });
    }
};

// @desc    Completar lección con validación de aprobación
// @route   POST /api/lecciones/:id/completar
// @access  Private
exports.completarLeccion = async (req, res) => {
    try {
        const leccionId = req.params.id;
        const { ejercicios_correctos, total_ejercicios, xp_acumulado } = req.body;
        const usuarioId = req.user.id;

        // PASO 1: Validar datos
        if (!ejercicios_correctos || !total_ejercicios) {
            return res.status(400).json({
                success: false,
                error: 'Faltan datos de ejercicios'
            });
        }

        // PASO 2: Calcular porcentaje de aprobación
        const porcentaje = Math.round((ejercicios_correctos / total_ejercicios) * 100);
        const aprobado = porcentaje >= 60;

        console.log(`📊 Lección ${leccionId} - Usuario ${usuarioId}:`);
        console.log(`   - Correctos: ${ejercicios_correctos}/${total_ejercicios}`);
        console.log(`   - Porcentaje: ${porcentaje}%`);
        console.log(`   - Estado: ${aprobado ? '✅ APROBADO' : '❌ REPROBADO'}`);

        // PASO 3: Obtener información de la lección
        const leccion = await Leccion.obtenerPorId(leccionId);
        if (!leccion) {
            return res.status(404).json({
                success: false,
                error: 'Lección no encontrada'
            });
        }

        // PASO 4: Verificar si ya estaba completada
        const progresoAnterior = await Leccion.obtenerProgreso(usuarioId, leccionId);
        const yaCompletada = progresoAnterior ? progresoAnterior.completada : false;

        if (!aprobado) {
            // No aprobó - NO marcar como completada
            return res.json({
                success: true,
                aprobado: false,
                mensaje: 'Necesitas al menos 60% para completar la lección',
                data: {
                    porcentaje,
                    ejercicios_correctos,
                    total_ejercicios,
                    xp_ganado: xp_acumulado || 0,
                    completada: false
                }
            });
        }

        // PASO 5: Aprobó - Marcar como completada
        await Leccion.registrarProgreso(usuarioId, leccionId, 100);

        // PASO 6: Calcular XP bonus (solo si NO estaba completada antes)
        let xpBonus = 0;
        if (!yaCompletada) {
            // XP bonus según porcentaje
            if (porcentaje === 100) {
                xpBonus = 50; // Perfecto
            } else if (porcentaje >= 80) {
                xpBonus = 30; // Excelente
            } else if (porcentaje >= 60) {
                xpBonus = 10; // Aprobado
            }

            // Otorgar XP bonus
            if (xpBonus > 0) {
                await Gamificacion.otorgarXP(
                    usuarioId, 
                    xpBonus, 
                    'leccion_completada_bonus',
                    `Bonus por ${porcentaje}% en: ${leccion.titulo}`
                );
            }

            // PASO 7: Otorgar hint (solo si aprobó y NO estaba completada)
            let hintGanado = false;
            if (!yaCompletada && aprobado) {
                // Verificar hints actuales
                const [perfilActual] = await pool.execute(
                    'SELECT hints_disponibles FROM perfil_estudiantes WHERE usuario_id = ?',
                    [usuarioId]
                );
                
                const hintsActuales = perfilActual[0]?.hints_disponibles || 0;
                
                // Solo otorgar si no ha llegado al límite
                if (hintsActuales < 5) {
                    await pool.execute(
                        'UPDATE perfil_estudiantes SET hints_disponibles = LEAST(hints_disponibles + 1, 5) WHERE usuario_id = ?',
                        [usuarioId]
                    );
                    hintGanado = true;
                    console.log(`💡 Hint otorgado: ${hintsActuales} → ${hintsActuales + 1}/5`);
                } else {
                    console.log(`⚠️ Límite de hints alcanzado (5/5)`);
                }
            }

            // Actualizar estadísticas
            await Estadisticas.actualizarDesdeProgreso(usuarioId);

            // Verificar logros
            const logrosNuevos = await logrosHelper.verificarLogros(usuarioId, {
                porcentaje,
                nivel: leccion.nivel,
                leccion_id: leccionId
            });

            // Actualizar racha
            await Gamificacion.actualizarRacha(usuarioId);

            console.log(`🎉 Lección completada - XP bonus: ${xpBonus}`);

            return res.json({
                success: true,
                aprobado: true,
                mensaje: '¡Lección completada exitosamente! 🎉',
                data: {
                    porcentaje,
                    ejercicios_correctos,
                    total_ejercicios,
                    xp_ejercicios: xp_acumulado || 0,
                    xp_bonus: xpBonus,
                    xp_total: (xp_acumulado || 0) + xpBonus,
                    completada: true,
                    es_primera_vez: !yaCompletada,
                    logros_desbloqueados: logrosNuevos,
                    hint_ganado: hintGanado
                }
            });
        } else {
            // Ya estaba completada - solo enviar confirmación
            return res.json({
                success: true,
                aprobado: true,
                mensaje: 'Lección completada (sin XP bonus, ya estaba completada)',
                data: {
                    porcentaje,
                    ejercicios_correctos,
                    total_ejercicios,
                    xp_ejercicios: xp_acumulado || 0,
                    xp_bonus: 0,
                    xp_total: xp_acumulado || 0,
                    completada: true,
                    es_primera_vez: false
                }
            });
        }

    } catch (error) {
        console.error('❌ Error completando lección:', error);
        res.status(500).json({
            success: false,
            error: 'Error al completar lección: ' + error.message
        });
    }
};