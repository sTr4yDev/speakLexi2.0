// backend/models/lecciones.js
const db = require('../config/database');

// ✅ IMPORTANTE: Obtener el pool correctamente
const pool = db.pool || db;

// ✅ FUNCIÓN DE NORMALIZACIÓN DE TIPOS DE EJERCICIOS
const normalizarTipoEjercicio = (tipo) => {
    const mapeo = {
        'seleccion_multiple': 'seleccion_multiple',
        'seleccionMultiple': 'seleccion_multiple',
        'multiple_choice': 'seleccion_multiple',
        'verdadero_falso': 'verdadero_falso',
        'verdaderoFalso': 'verdadero_falso',
        'true_false': 'verdadero_falso',
        'completar_espacios': 'completar_espacios',
        'completarEspacios': 'completar_espacios',
        'fill_blank': 'completar_espacios',
        'emparejamiento': 'emparejamiento',
        'matching': 'emparejamiento',
        'escritura': 'escritura',
        'writing': 'escritura'
    };
    
    const tipoNormalizado = mapeo[tipo] || tipo;
    console.log(`🔄 Normalizando tipo: "${tipo}" → "${tipoNormalizado}"`);
    return tipoNormalizado;
};

/**
 * Crear nueva lección
 */
exports.crear = async (datosLeccion) => {
    try {
        const query = `
            INSERT INTO lecciones (
                titulo, descripcion, contenido, nivel, idioma, 
                duracion_minutos, orden, estado, creado_por
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const valores = [
            datosLeccion.titulo,
            datosLeccion.descripcion || '',
            datosLeccion.contenido || '',
            datosLeccion.nivel,
            datosLeccion.idioma,
            datosLeccion.duracion_minutos || 30,
            datosLeccion.orden || 0,
            datosLeccion.estado || 'activa',
            datosLeccion.creado_por
        ];

        const [resultado] = await pool.execute(query, valores);
        
        return resultado.insertId;
    } catch (error) {
        console.error('Error en Leccion.crear:', error);
        throw error;
    }
};

/**
 * Obtener lección por ID
 */
exports.obtenerPorId = async (id) => {
    try {
        const query = `
            SELECT l.*, 
                   u.nombre as creador_nombre,
                   u.primer_apellido as creador_apellido
            FROM lecciones l
            LEFT JOIN usuarios u ON l.creado_por = u.id
            WHERE l.id = ?
        `;

        const [filas] = await pool.execute(query, [id]);
        
        return filas.length > 0 ? filas[0] : null;
    } catch (error) {
        console.error('Error en Leccion.obtenerPorId:', error);
        throw error;
    }
};

/**
 * Listar TODAS las lecciones (para admin)
 */
exports.listarTodas = async (pagina = 1, limite = 50, filtros = {}) => {
    try {
        const paginaNum = parseInt(pagina, 10) || 1;
        const limiteNum = parseInt(limite, 10) || 50;
        const offset = (paginaNum - 1) * limiteNum;
        
        let whereConditions = [];
        let params = [];
        
        if (filtros.nivel) {
            whereConditions.push('l.nivel = ?');
            params.push(filtros.nivel);
        }
        if (filtros.idioma) {
            whereConditions.push('l.idioma = ?');
            params.push(filtros.idioma);
        }
        if (filtros.estado) {
            whereConditions.push('l.estado = ?');
            params.push(filtros.estado);
        }
        
        const whereClause = whereConditions.length > 0 
            ? 'WHERE ' + whereConditions.join(' AND ')
            : '';
        
        const query = `
            SELECT l.*, 
                   u.nombre as creador_nombre,
                   u.primer_apellido as creador_apellido
            FROM lecciones l
            LEFT JOIN usuarios u ON l.creado_por = u.id
            ${whereClause}
            ORDER BY l.creado_en DESC
            LIMIT ? OFFSET ?
        `;

        params.push(String(limiteNum), String(offset));
        const [lecciones] = await pool.execute(query, params);

        const countQuery = `
            SELECT COUNT(*) as total 
            FROM lecciones l 
            ${whereClause}
        `;
        const countParams = params.slice(0, -2);
        const [totalRows] = await pool.execute(countQuery, countParams);

        return {
            lecciones,
            paginacion: {
                pagina_actual: paginaNum,
                por_pagina: limiteNum,
                total: totalRows[0].total,
                total_paginas: Math.ceil(totalRows[0].total / limiteNum)
            }
        };
    } catch (error) {
        console.error('Error en Leccion.listarTodas:', error);
        throw error;
    }
};

/**
 * Listar lecciones por nivel e idioma
 */
exports.listarPorNivel = async (nivel, idioma, pagina = 1, limite = 10) => {
    try {
        const paginaNum = parseInt(pagina, 10) || 1;
        const limiteNum = parseInt(limite, 10) || 10;
        const offset = (paginaNum - 1) * limiteNum;
        
        const query = `
            SELECT l.*, 
                   u.nombre as creador_nombre,
                   COUNT(pl.id) as total_estudiantes
            FROM lecciones l
            LEFT JOIN usuarios u ON l.creado_por = u.id
            LEFT JOIN progreso_lecciones pl ON l.id = pl.leccion_id
            WHERE l.nivel = ? AND l.idioma = ? AND l.estado = 'activa'
            GROUP BY l.id
            ORDER BY l.orden ASC, l.creado_en DESC
            LIMIT ? OFFSET ?
        `;

        const [lecciones] = await pool.execute(query, [
            nivel, 
            idioma, 
            String(limiteNum), 
            String(offset)
        ]);

        const [totalRows] = await pool.execute(
            'SELECT COUNT(*) as total FROM lecciones WHERE nivel = ? AND idioma = ? AND estado = "activa"',
            [nivel, idioma]
        );

        return {
            lecciones,
            paginacion: {
                pagina_actual: paginaNum,
                por_pagina: limiteNum,
                total: totalRows[0].total,
                total_paginas: Math.ceil(totalRows[0].total / limiteNum)
            }
        };
    } catch (error) {
        console.error('Error en Leccion.listarPorNivel:', error);
        throw error;
    }
};

/**
 * Actualizar lección
 */
exports.actualizar = async (id, datos) => {
    try {
        const campos = [];
        const valores = [];

        if (datos.titulo !== undefined) {
            campos.push('titulo = ?');
            valores.push(datos.titulo);
        }
        if (datos.descripcion !== undefined) {
            campos.push('descripcion = ?');
            valores.push(datos.descripcion);
        }
        if (datos.contenido !== undefined) {
            campos.push('contenido = ?');
            valores.push(datos.contenido);
        }
        if (datos.nivel !== undefined) {
            campos.push('nivel = ?');
            valores.push(datos.nivel);
        }
        if (datos.idioma !== undefined) {
            campos.push('idioma = ?');
            valores.push(datos.idioma);
        }
        if (datos.duracion_minutos !== undefined) {
            campos.push('duracion_minutos = ?');
            valores.push(datos.duracion_minutos);
        }
        if (datos.orden !== undefined) {
            campos.push('orden = ?');
            valores.push(datos.orden);
        }
        if (datos.estado !== undefined) {
            campos.push('estado = ?');
            valores.push(datos.estado);
        }

        if (campos.length === 0) {
            return false;
        }

        valores.push(id);

        const query = `UPDATE lecciones SET ${campos.join(', ')} WHERE id = ?`;
        const [resultado] = await pool.execute(query, valores);

        return resultado.affectedRows > 0;
    } catch (error) {
        console.error('Error en Leccion.actualizar:', error);
        throw error;
    }
};

/**
 * Eliminar lección
 */
exports.eliminar = async (id) => {
    try {
        const query = 'DELETE FROM lecciones WHERE id = ?';
        const [resultado] = await pool.execute(query, [id]);

        return resultado.affectedRows > 0;
    } catch (error) {
        console.error('Error en Leccion.eliminar:', error);
        throw error;
    }
};

/**
 * Registrar progreso de lección
 */
exports.registrarProgreso = async (usuarioId, leccionId, progreso) => {
    try {
        const query = `
            INSERT INTO progreso_lecciones (usuario_id, leccion_id, progreso, completada)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                progreso = VALUES(progreso),
                completada = VALUES(completada),
                actualizado_en = CURRENT_TIMESTAMP
        `;

        const completada = progreso >= 100;
        const [resultado] = await pool.execute(query, [usuarioId, leccionId, progreso, completada]);

        return resultado.affectedRows > 0;
    } catch (error) {
        console.error('Error en Leccion.registrarProgreso:', error);
        throw error;
    }
};

/**
 * Obtener progreso de un usuario en una lección específica
 */
exports.obtenerProgreso = async (usuarioId, leccionId) => {
    try {
        const query = `
            SELECT progreso, completada 
            FROM progreso_lecciones 
            WHERE usuario_id = ? AND leccion_id = ?
        `;

        const [filas] = await pool.execute(query, [usuarioId, leccionId]);
        
        return filas.length > 0 ? filas[0] : null;
    } catch (error) {
        console.error('Error en Leccion.obtenerProgreso:', error);
        throw error;
    }
};

// ========================================
// ✅ MÉTODOS CORREGIDOS PARA EJERCICIOS/ACTIVIDADES
// ========================================

/**
 * Guardar actividades como ejercicios - CORREGIDO CON NORMALIZACIÓN
 */
exports.guardarEjercicios = async (leccionId, actividades, creadoPor) => {
    try {
        console.log(`📝 Guardando ${actividades.length} ejercicios para lección ${leccionId}`);
        
        for (const actividad of actividades) {
            // ✅ NORMALIZAR TIPO ANTES DE GUARDAR
            const tipoNormalizado = normalizarTipoEjercicio(actividad.tipo);
            
            // ✅ LOG para debug
            console.log(`📊 Actividad: ${actividad.titulo}`);
            console.log(`   Tipo original: ${actividad.tipo}`);
            console.log(`   Tipo normalizado: ${tipoNormalizado}`);
            
            const contenido = actividad.contenido || {};
            
            let opciones = null;
            if (tipoNormalizado === 'seleccion_multiple' && contenido.opciones) {
                opciones = JSON.stringify(contenido.opciones);
            } else if (tipoNormalizado === 'emparejamiento' && contenido.pares) {
                opciones = JSON.stringify(contenido.pares);
            }
            
            let respuestaCorrecta = {};
            if (actividad.respuesta_correcta) {
                respuestaCorrecta = actividad.respuesta_correcta;
            } else if (contenido.respuesta_correcta) {
                respuestaCorrecta = contenido.respuesta_correcta;
            }
            
            const query = `
                INSERT INTO ejercicios (
                    leccion_id, 
                    titulo, 
                    descripcion, 
                    tipo, 
                    contenido, 
                    opciones, 
                    respuesta_correcta, 
                    puntos_maximos, 
                    tiempo_limite_minutos,
                    orden, 
                    estado, 
                    creado_por
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo', ?)
            `;
            
            const valores = [
                leccionId,
                actividad.titulo || 'Ejercicio sin título',
                actividad.descripcion || '',
                tipoNormalizado, // ✅ USAR TIPO NORMALIZADO
                JSON.stringify(contenido),
                opciones,
                JSON.stringify(respuestaCorrecta),
                actividad.puntos || actividad.puntos_maximos || 10,
                actividad.config?.tiempo_limite || null,
                actividad.orden || 0,
                creadoPor
            ];
            
            await pool.execute(query, valores);
            
            console.log(`✅ Ejercicio guardado - Tipo: ${tipoNormalizado}, Orden: ${actividad.orden || 0}`);
        }
        
        console.log(`✅ ${actividades.length} ejercicios guardados exitosamente`);
        return true;
        
    } catch (error) {
        console.error('❌ Error guardando ejercicios:', error);
        throw error;
    }
};

/**
 * Obtener ejercicios por lección - CORREGIDO
 */
exports.obtenerEjerciciosPorLeccion = async (leccionId) => {
    try {
        const [ejercicios] = await pool.execute(`
            SELECT 
                id,
                leccion_id,
                titulo,
                descripcion,
                tipo,
                contenido,
                opciones,
                respuesta_correcta,
                puntos_maximos,
                tiempo_limite_minutos,
                orden,
                estado
            FROM ejercicios
            WHERE leccion_id = ? AND estado = 'activo'
            ORDER BY orden ASC
        `, [leccionId]);
        
        // ✅ Parsear JSON fields
        const ejerciciosParseados = ejercicios.map(ej => {
            try {
                return {
                    ...ej,
                    contenido: typeof ej.contenido === 'string' ? JSON.parse(ej.contenido) : ej.contenido,
                    opciones: ej.opciones ? (typeof ej.opciones === 'string' ? JSON.parse(ej.opciones) : ej.opciones) : null,
                    respuesta_correcta: typeof ej.respuesta_correcta === 'string' ? JSON.parse(ej.respuesta_correcta) : ej.respuesta_correcta
                };
            } catch (parseError) {
                console.error('Error parseando ejercicio:', parseError);
                return ej;
            }
        });

        console.log(`📖 Obtenidos ${ejerciciosParseados.length} ejercicios para lección ${leccionId}`);
        return ejerciciosParseados;
    } catch (error) {
        console.error('❌ Error obteniendo ejercicios:', error);
        return [];
    }
};

/**
 * Obtener lección completa con ejercicios y multimedia
 */
exports.obtenerLeccionCompleta = async (leccionId) => {
    try {
        const leccion = await exports.obtenerPorId(leccionId);
        
        if (!leccion) {
            return null;
        }

        const ejercicios = await exports.obtenerEjerciciosPorLeccion(leccionId);

        return {
            ...leccion,
            ejercicios
        };
    } catch (error) {
        console.error('Error obteniendo lección completa:', error);
        throw error;
    }
};