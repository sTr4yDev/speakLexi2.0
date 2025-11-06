// backend/models/cursos.js
const db = require('../config/database');
const pool = db.pool || db;

/**
 * Crear nuevo curso
 */
exports.crear = async (datosCurso) => {
    try {
        const query = `
            INSERT INTO cursos (
                nombre, descripcion, nivel, idioma, 
                icono, color, imagen_portada, orden, estado, creado_por
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const valores = [
            datosCurso.nombre,
            datosCurso.descripcion || '',
            datosCurso.nivel,
            datosCurso.idioma || 'Inglés',
            datosCurso.icono || '📚',
            datosCurso.color || '#6366f1',
            datosCurso.imagen_portada || null,
            datosCurso.orden || 0,
            datosCurso.estado || 'activo',
            datosCurso.creado_por
        ];

        const [resultado] = await pool.execute(query, valores);
        return resultado.insertId;
    } catch (error) {
        console.error('Error en Curso.crear:', error);
        throw error;
    }
};

/**
 * Obtener curso por ID con estadísticas
 */
exports.obtenerPorId = async (id) => {
    try {
        const query = `
            SELECT 
                c.*,
                COUNT(DISTINCT l.id) as total_lecciones,
                SUM(l.duracion_minutos) as duracion_total_minutos,
                ROUND(SUM(l.duracion_minutos) / 60, 1) as duracion_total_horas,
                COUNT(DISTINCT ic.usuario_id) as total_estudiantes,
                u.nombre as creador_nombre,
                u.primer_apellido as creador_apellido
            FROM cursos c
            LEFT JOIN lecciones l ON c.id = l.curso_id AND l.estado = 'activa'
            LEFT JOIN inscripciones_cursos ic ON c.id = ic.curso_id
            LEFT JOIN usuarios u ON c.creado_por = u.id
            WHERE c.id = ?
            GROUP BY c.id
        `;

        const [filas] = await pool.execute(query, [id]);
        return filas.length > 0 ? filas[0] : null;
    } catch (error) {
        console.error('Error en Curso.obtenerPorId:', error);
        throw error;
    }
};

/**
 * Listar todos los cursos con filtros
 */
exports.listar = async (pagina = 1, limite = 20, filtros = {}) => {
    try {
        const offset = (pagina - 1) * limite;
        
        let whereConditions = [];
        let params = [];
        
        if (filtros.nivel) {
            whereConditions.push('c.nivel = ?');
            params.push(filtros.nivel);
        }
        if (filtros.idioma) {
            whereConditions.push('c.idioma = ?');
            params.push(filtros.idioma);
        }
        if (filtros.estado) {
            whereConditions.push('c.estado = ?');
            params.push(filtros.estado);
        }
        
        const whereClause = whereConditions.length > 0 
            ? 'WHERE ' + whereConditions.join(' AND ')
            : '';
        
        const query = `
            SELECT * FROM vista_cursos_con_estadisticas
            ${whereClause}
            ORDER BY nivel, orden
            LIMIT ? OFFSET ?
        `;

        params.push(limite, offset);
        const [cursos] = await pool.execute(query, params);

        // Obtener total de registros
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM cursos c
            ${whereClause}
        `;
        const countParams = params.slice(0, -2);
        const [totalRows] = await pool.execute(countQuery, countParams);

        return {
            cursos,
            paginacion: {
                pagina_actual: pagina,
                por_pagina: limite,
                total: totalRows[0].total,
                total_paginas: Math.ceil(totalRows[0].total / limite)
            }
        };
    } catch (error) {
        console.error('Error en Curso.listar:', error);
        throw error;
    }
};

/**
 * Obtener cursos por nivel específico
 */
exports.obtenerPorNivel = async (nivel, idioma = 'Inglés') => {
    try {
        const query = `
            SELECT * FROM vista_cursos_con_estadisticas
            WHERE nivel = ? AND idioma = ? AND estado = 'activo'
            ORDER BY orden
        `;

        const [cursos] = await pool.execute(query, [nivel, idioma]);
        return cursos;
    } catch (error) {
        console.error('Error en Curso.obtenerPorNivel:', error);
        throw error;
    }
};

/**
 * Obtener lecciones de un curso
 */
exports.obtenerLecciones = async (cursoId, usuarioId = null) => {
    try {
        let query;
        let params;

        if (usuarioId) {
            // Si hay usuarioId, incluir progreso
            query = `
                SELECT 
                    l.*,
                    pl.progreso,
                    pl.completada,
                    pl.tiempo_total_segundos,
                    u.nombre as creador_nombre,
                    u.primer_apellido as creador_apellido
                FROM lecciones l
                LEFT JOIN progreso_lecciones pl ON l.id = pl.leccion_id AND pl.usuario_id = ?
                LEFT JOIN usuarios u ON l.creado_por = u.id
                WHERE l.curso_id = ? AND l.estado = 'activa'
                ORDER BY l.orden, l.creado_en
            `;
            params = [usuarioId, cursoId];
        } else {
            query = `
                SELECT 
                    l.*,
                    u.nombre as creador_nombre,
                    u.primer_apellido as creador_apellido
                FROM lecciones l
                LEFT JOIN usuarios u ON l.creado_por = u.id
                WHERE l.curso_id = ? AND l.estado = 'activa'
                ORDER BY l.orden, l.creado_en
            `;
            params = [cursoId];
        }

        const [lecciones] = await pool.execute(query, params);
        return lecciones;
    } catch (error) {
        console.error('Error en Curso.obtenerLecciones:', error);
        throw error;
    }
};

/**
 * Inscribir estudiante a un curso
 */
exports.inscribirEstudiante = async (usuarioId, cursoId) => {
    try {
        const query = `CALL inscribir_estudiante_curso(?, ?)`;
        const [resultado] = await pool.execute(query, [usuarioId, cursoId]);
        
        return {
            success: resultado[0][0].success,
            mensaje: resultado[0][0].mensaje
        };
    } catch (error) {
        console.error('Error en Curso.inscribirEstudiante:', error);
        throw error;
    }
};

/**
 * Obtener progreso del estudiante en un curso
 */
exports.obtenerProgresoEstudiante = async (usuarioId, cursoId) => {
    try {
        const query = `
            SELECT * FROM vista_progreso_estudiante
            WHERE usuario_id = ? AND curso_id = ?
        `;

        const [filas] = await pool.execute(query, [usuarioId, cursoId]);
        return filas.length > 0 ? filas[0] : null;
    } catch (error) {
        console.error('Error en Curso.obtenerProgresoEstudiante:', error);
        throw error;
    }
};

/**
 * Obtener todos los cursos de un estudiante
 */
exports.obtenerCursosEstudiante = async (usuarioId) => {
    try {
        const query = `
            SELECT 
                vpe.*,
                c.descripcion,
                c.icono,
                c.color,
                c.imagen_portada
            FROM vista_progreso_estudiante vpe
            JOIN cursos c ON vpe.curso_id = c.id
            WHERE vpe.usuario_id = ?
            ORDER BY vpe.fecha_ultima_actividad DESC
        `;

        const [cursos] = await pool.execute(query, [usuarioId]);
        return cursos;
    } catch (error) {
        console.error('Error en Curso.obtenerCursosEstudiante:', error);
        throw error;
    }
};

/**
 * Actualizar progreso del curso
 */
exports.actualizarProgreso = async (usuarioId, cursoId) => {
    try {
        const query = `CALL actualizar_progreso_curso(?, ?)`;
        const [resultado] = await pool.execute(query, [usuarioId, cursoId]);
        
        return {
            success: resultado[0][0].success,
            progreso: resultado[0][0].progreso,
            lecciones_completadas: resultado[0][0].lecciones_completadas,
            total_lecciones: resultado[0][0].total_lecciones
        };
    } catch (error) {
        console.error('Error en Curso.actualizarProgreso:', error);
        throw error;
    }
};

/**
 * Obtener siguiente lección del curso
 */
exports.obtenerSiguienteLeccion = async (usuarioId, cursoId) => {
    try {
        const query = `SELECT obtener_siguiente_leccion(?, ?) as siguiente_leccion_id`;
        const [filas] = await pool.execute(query, [usuarioId, cursoId]);
        
        if (filas[0].siguiente_leccion_id) {
            // Obtener detalles de la lección
            const queryLeccion = `
                SELECT l.*, u.nombre as creador_nombre
                FROM lecciones l
                LEFT JOIN usuarios u ON l.creado_por = u.id
                WHERE l.id = ?
            `;
            const [leccion] = await pool.execute(queryLeccion, [filas[0].siguiente_leccion_id]);
            return leccion[0];
        }
        
        return null;
    } catch (error) {
        console.error('Error en Curso.obtenerSiguienteLeccion:', error);
        throw error;
    }
};

/**
 * Actualizar curso
 */
exports.actualizar = async (id, datos) => {
    try {
        const campos = [];
        const valores = [];

        if (datos.nombre !== undefined) {
            campos.push('nombre = ?');
            valores.push(datos.nombre);
        }
        if (datos.descripcion !== undefined) {
            campos.push('descripcion = ?');
            valores.push(datos.descripcion);
        }
        if (datos.nivel !== undefined) {
            campos.push('nivel = ?');
            valores.push(datos.nivel);
        }
        if (datos.idioma !== undefined) {
            campos.push('idioma = ?');
            valores.push(datos.idioma);
        }
        if (datos.icono !== undefined) {
            campos.push('icono = ?');
            valores.push(datos.icono);
        }
        if (datos.color !== undefined) {
            campos.push('color = ?');
            valores.push(datos.color);
        }
        if (datos.imagen_portada !== undefined) {
            campos.push('imagen_portada = ?');
            valores.push(datos.imagen_portada);
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

        const query = `UPDATE cursos SET ${campos.join(', ')} WHERE id = ?`;
        const [resultado] = await pool.execute(query, valores);

        return resultado.affectedRows > 0;
    } catch (error) {
        console.error('Error en Curso.actualizar:', error);
        throw error;
    }
};

/**
 * Eliminar curso
 */
exports.eliminar = async (id) => {
    try {
        const query = 'DELETE FROM cursos WHERE id = ?';
        const [resultado] = await pool.execute(query, [id]);

        return resultado.affectedRows > 0;
    } catch (error) {
        console.error('Error en Curso.eliminar:', error);
        throw error;
    }
};

/**
 * Obtener estadísticas generales de cursos
 */
exports.obtenerEstadisticas = async () => {
    try {
        const query = `
            SELECT 
                COUNT(DISTINCT c.id) as total_cursos,
                COUNT(DISTINCT l.id) as total_lecciones,
                COUNT(DISTINCT ic.usuario_id) as total_estudiantes,
                SUM(CASE WHEN ic.estado = 'completado' THEN 1 ELSE 0 END) as cursos_completados,
                AVG(ic.progreso_general) as progreso_promedio
            FROM cursos c
            LEFT JOIN lecciones l ON c.id = l.curso_id AND l.estado = 'activa'
            LEFT JOIN inscripciones_cursos ic ON c.id = ic.curso_id
            WHERE c.estado = 'activo'
        `;

        const [estadisticas] = await pool.execute(query);
        return estadisticas[0];
    } catch (error) {
        console.error('Error en Curso.obtenerEstadisticas:', error);
        throw error;
    }
};