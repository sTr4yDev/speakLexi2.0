// backend/controllers/ejercicioController.js
const db = require('../config/database');
const pool = db.pool || db;

// Crear ejercicio
exports.crearEjercicio = async (req, res) => {
    try {
        const {
            leccion_id,
            titulo,
            descripcion,
            tipo,
            contenido,
            respuesta_correcta,
            puntos_maximos,
            orden
        } = req.body;

        const query = `
            INSERT INTO ejercicios (
                leccion_id, titulo, descripcion, tipo,
                contenido, respuesta_correcta, puntos_maximos,
                orden, estado, creado_por, creado_en
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'activo', ?, NOW())
        `;

        const valores = [
            leccion_id,
            titulo,
            descripcion || '',
            tipo,
            JSON.stringify(contenido),
            JSON.stringify(respuesta_correcta),
            puntos_maximos || 10,
            orden || 0,
            req.user.id
        ];

        const [resultado] = await pool.execute(query, valores);

        res.status(201).json({
            success: true,
            mensaje: 'Ejercicio creado exitosamente',
            data: {
                id: resultado.insertId,
                ejercicio_id: resultado.insertId
            }
        });

    } catch (error) {
        console.error('Error creando ejercicio:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear ejercicio'
        });
    }
};

// Obtener ejercicios de una lección
exports.obtenerEjerciciosLeccion = async (req, res) => {
    try {
        const { leccion_id } = req.params;

        const query = `
            SELECT * FROM ejercicios
            WHERE leccion_id = ? AND estado = 'activo'
            ORDER BY orden ASC
        `;

        const [ejercicios] = await pool.execute(query, [leccion_id]);

        // Parsear JSON
        const ejerciciosParsed = ejercicios.map(ej => ({
            ...ej,
            contenido: JSON.parse(ej.contenido),
            respuesta_correcta: JSON.parse(ej.respuesta_correcta)
        }));

        res.json({
            success: true,
            data: ejerciciosParsed
        });

    } catch (error) {
        console.error('Error obteniendo ejercicios:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener ejercicios'
        });
    }
};

// Actualizar ejercicio
exports.actualizarEjercicio = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            titulo,
            descripcion,
            tipo,
            contenido,
            respuesta_correcta,
            puntos_maximos,
            orden
        } = req.body;

        const query = `
            UPDATE ejercicios
            SET titulo = ?, descripcion = ?, tipo = ?,
                contenido = ?, respuesta_correcta = ?,
                puntos_maximos = ?, orden = ?,
                actualizado_en = NOW()
            WHERE id = ?
        `;

        const valores = [
            titulo,
            descripcion,
            tipo,
            JSON.stringify(contenido),
            JSON.stringify(respuesta_correcta),
            puntos_maximos,
            orden,
            id
        ];

        await pool.execute(query, valores);

        res.json({
            success: true,
            mensaje: 'Ejercicio actualizado exitosamente'
        });

    } catch (error) {
        console.error('Error actualizando ejercicio:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar ejercicio'
        });
    }
};

// Eliminar ejercicio
exports.eliminarEjercicio = async (req, res) => {
    try {
        const { id } = req.params;

        const query = `DELETE FROM ejercicios WHERE id = ?`;
        await pool.execute(query, [id]);

        res.json({
            success: true,
            mensaje: 'Ejercicio eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error eliminando ejercicio:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar ejercicio'
        });
    }
};

// Validar respuesta de ejercicio
exports.validarRespuesta = async (req, res) => {
    try {
        const { id } = req.params;
        const { respuesta_usuario } = req.body;

        // Obtener ejercicio
        const [ejercicios] = await pool.execute(
            'SELECT * FROM ejercicios WHERE id = ?',
            [id]
        );

        if (ejercicios.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Ejercicio no encontrado'
            });
        }

        const ejercicio = ejercicios[0];
        const respuestaCorrecta = JSON.parse(ejercicio.respuesta_correcta);

        // Validar según tipo
        let esCorrecta = false;
        let puntuacion = 0;

        switch (ejercicio.tipo) {
            case 'seleccion_multiple':
                esCorrecta = JSON.stringify(respuesta_usuario) === JSON.stringify(respuestaCorrecta.respuestas);
                puntuacion = esCorrecta ? ejercicio.puntos_maximos : 0;
                break;

            case 'completar_espacios':
                const respuestasUsuario = Array.isArray(respuesta_usuario) ? respuesta_usuario : respuesta_usuario.respuestas;
                const correctas = respuestasUsuario.filter((r, i) => 
                    r.toLowerCase().trim() === respuestaCorrecta.respuestas[i].toLowerCase().trim()
                ).length;
                puntuacion = Math.round((correctas / respuestaCorrecta.respuestas.length) * ejercicio.puntos_maximos);
                esCorrecta = puntuacion === ejercicio.puntos_maximos;
                break;

            // Agregar más tipos según necesites
        }

        // Guardar resultado
        const queryResultado = `
            INSERT INTO resultados_ejercicios (
                usuario_id, ejercicio_id, puntuacion_obtenida,
                respuestas_usuario, completado_en
            ) VALUES (?, ?, ?, ?, NOW())
        `;

        await pool.execute(queryResultado, [
            req.user.id,
            id,
            puntuacion,
            JSON.stringify(respuesta_usuario)
        ]);

        res.json({
            success: true,
            data: {
                correcto: esCorrecta,
                puntuacion_obtenida: puntuacion,
                puntuacion_maxima: ejercicio.puntos_maximos,
                respuesta_correcta: respuestaCorrecta
            }
        });

    } catch (error) {
        console.error('Error validando respuesta:', error);
        res.status(500).json({
            success: false,
            error: 'Error al validar respuesta'
        });
    }
};