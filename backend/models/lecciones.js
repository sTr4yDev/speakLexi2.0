// backend/models/lecciones.js
const db = require('../config/database');

// ✅ IMPORTANTE: Obtener el pool correctamente
const pool = db.pool || db;

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
            datosLeccion.estado || 'activa', // ✅ Cambiado de 'borrador' a 'activa'
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
 * 🔧 CORREGIDO: Bug MySQL 8.0.22+ - Convertir LIMIT/OFFSET a strings
 */
exports.listarTodas = async (pagina = 1, limite = 50, filtros = {}) => {
    try {
        // ✅ Convertir a números enteros primero
        const paginaNum = parseInt(pagina, 10) || 1;
        const limiteNum = parseInt(limite, 10) || 50;
        const offset = (paginaNum - 1) * limiteNum;
        
        let whereConditions = [];
        let params = [];
        
        // Aplicar filtros opcionales
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

        // 🔥 SOLUCIÓN: Convertir a STRING para evitar bug MySQL 8.0.22+
        // MySQL espera INT pero mysql2 envía DOUBLE, convertir a string funciona
        params.push(String(limiteNum), String(offset));
        const [lecciones] = await pool.execute(query, params);

        // Obtener total de registros
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM lecciones l 
            ${whereClause}
        `;
        const countParams = params.slice(0, -2); // Remover LIMIT y OFFSET
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
        // ✅ Convertir a números enteros
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

        // 🔥 SOLUCIÓN: Convertir a STRING
        const [lecciones] = await pool.execute(query, [
            nivel, 
            idioma, 
            String(limiteNum), 
            String(offset)
        ]);

        // Obtener total de registros
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
 * 🔥 NUEVO MÉTODO: Para verificar si ya estaba completada antes
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
// ✅ NUEVOS MÉTODOS PARA EJERCICIOS/ACTIVIDADES
// ========================================

/**
 * Guardar actividades como ejercicios
 */
exports.guardarEjercicios = async (leccionId, actividades, usuarioId) => {
    try {
        console.log(`📝 Guardando ${actividades.length} ejercicios para lección ${leccionId}`);
        
        for (const actividad of actividades) {
            const {
                tipo,
                contenido,
                opciones,
                respuesta_correcta,
                explicacion,
                orden,
                puntos,
                dificultad
            } = actividad;

            // Validar datos mínimos
            if (!tipo || !contenido) {
                console.warn('⚠️ Actividad ignorada por falta de tipo o contenido:', actividad);
                continue;
            }

            const query = `
                INSERT INTO ejercicios (
                    leccion_id, tipo, contenido, opciones, 
                    respuesta_correcta, explicacion, orden, 
                    puntos, dificultad, estado, creado_por
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo', ?)
            `;

            // Convertir opciones a JSON si es un array/objeto
            const opcionesJSON = opciones ? JSON.stringify(opciones) : null;

            await pool.execute(query, [
                leccionId,
                tipo,
                contenido,
                opcionesJSON,
                respuesta_correcta,
                explicacion || null,
                orden || 0,
                puntos || 10,
                dificultad || 'media',
                usuarioId
            ]);

            console.log(`✅ Ejercicio guardado - Tipo: ${tipo}, Orden: ${orden || 0}`);
        }

        console.log(`🎉 ${actividades.length} actividades guardadas como ejercicios para lección ${leccionId}`);
        return true;
    } catch (error) {
        console.error('❌ Error guardando ejercicios:', error);
        throw error;
    }
};

/**
 * Obtener ejercicios por lección
 */
exports.obtenerEjerciciosPorLeccion = async (leccionId) => {
    try {
        const [ejercicios] = await pool.execute(`
            SELECT 
                id, 
                leccion_id,
                tipo, 
                contenido, 
                opciones, 
                respuesta_correcta, 
                explicacion, 
                orden,
                puntos, 
                dificultad, 
                estado,
                creado_en
            FROM ejercicios 
            WHERE leccion_id = ? AND estado = 'activo'
            ORDER BY orden, creado_en
        `, [leccionId]);

        // Parsear opciones JSON si existen
        const ejerciciosParseados = ejercicios.map(ej => ({
            ...ej,
            opciones: ej.opciones ? JSON.parse(ej.opciones) : null
        }));

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
        // Obtener información básica de la lección
        const leccion = await exports.obtenerPorId(leccionId);
        
        if (!leccion) {
            return null;
        }

        // Obtener ejercicios
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