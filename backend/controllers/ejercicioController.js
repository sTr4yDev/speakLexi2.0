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

// Validar respuesta de ejercicio - VERSIÓN CORREGIDA
exports.validarRespuesta = async (req, res) => {
    try {
        const { id } = req.params;
        const respuesta_usuario = req.body;

        console.log('📝 Validando ejercicio ID:', id);
        console.log('📥 Respuesta recibida:', JSON.stringify(respuesta_usuario));

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

        console.log('✅ Ejercicio encontrado:', ejercicio.tipo);
        console.log('🎯 Respuesta correcta:', respuestaCorrecta);

        let esCorrecta = false;
        let puntuacion = 0;

        switch (ejercicio.tipo) {
            case 'seleccion_multiple':
                // ✅ Maneja ambos formatos
                const respuestaUsuarioSM = respuesta_usuario.respuestas || respuesta_usuario;
                esCorrecta = JSON.stringify(respuestaUsuarioSM) === JSON.stringify(respuestaCorrecta.respuestas);
                puntuacion = esCorrecta ? ejercicio.puntos_maximos : 0;
                break;

            case 'completar_espacios':
                // ✅ Maneja ambos formatos
                const respuestasUsuario = respuesta_usuario.respuestas || respuesta_usuario;
                
                // Validar que sea un array
                if (!Array.isArray(respuestasUsuario)) {
                    throw new Error('Formato de respuesta inválido para completar_espacios');
                }
                
                const correctas = respuestasUsuario.filter((r, i) => 
                    r && respuestaCorrecta.respuestas[i] && 
                    r.toString().toLowerCase().trim() === respuestaCorrecta.respuestas[i].toString().toLowerCase().trim()
                ).length;
                
                puntuacion = Math.round((correctas / respuestaCorrecta.respuestas.length) * ejercicio.puntos_maximos);
                esCorrecta = puntuacion === ejercicio.puntos_maximos;
                break;

            case 'verdadero_falso':
                // ✅ CORRECCIÓN: Manejar array de respuestas V/F
                const respuestasUsuarioVF = respuesta_usuario.respuestas || [respuesta_usuario.respuesta];
                const respuestasCorrectasVF = respuestaCorrecta.respuestas || [respuestaCorrecta.respuesta];
                
                console.log('🔍 V/F Usuario:', respuestasUsuarioVF);
                console.log('🔍 V/F Correctas:', respuestasCorrectasVF);
                
                // Validar que ambos sean arrays
                if (!Array.isArray(respuestasUsuarioVF) || !Array.isArray(respuestasCorrectasVF)) {
                    throw new Error('Formato de respuesta inválido para verdadero_falso');
                }
                
                // Contar respuestas correctas
                const correctasVF = respuestasUsuarioVF.filter((r, i) => 
                    r === respuestasCorrectasVF[i]
                ).length;
                
                // Calcular puntuación proporcional
                puntuacion = Math.round((correctasVF / respuestasCorrectasVF.length) * ejercicio.puntos_maximos);
                esCorrecta = puntuacion === ejercicio.puntos_maximos;
                
                console.log(`✅ V/F: ${correctasVF}/${respuestasCorrectasVF.length} correctas = ${puntuacion} puntos`);
                break;

            case 'emparejamiento':
                // ✅ CORRECCIÓN: Validar emparejamientos correctamente
                const respuestasUsuarioEmp = respuesta_usuario.respuestas || respuesta_usuario.emparejamientos || respuesta_usuario;
                const respuestasCorrectasEmp = respuestaCorrecta.respuestas || respuestaCorrecta.emparejamientos || respuestaCorrecta;
                
                console.log('🔍 Emparejamiento Usuario:', respuestasUsuarioEmp);
                console.log('🔍 Emparejamiento Correctas:', respuestasCorrectasEmp);
                
                // Validar que ambos sean arrays
                if (!Array.isArray(respuestasUsuarioEmp) || !Array.isArray(respuestasCorrectasEmp)) {
                    throw new Error('Formato de respuesta inválido para emparejamiento');
                }
                
                // Contar emparejamientos correctos
                const correctasEmp = respuestasUsuarioEmp.filter((r, i) => 
                    r !== null && r !== undefined && r === respuestasCorrectasEmp[i]
                ).length;
                
                // Calcular puntuación proporcional
                puntuacion = Math.round((correctasEmp / respuestasCorrectasEmp.length) * ejercicio.puntos_maximos);
                esCorrecta = puntuacion === ejercicio.puntos_maximos;
                
                console.log(`✅ Emparejamiento: ${correctasEmp}/${respuestasCorrectasEmp.length} correctos = ${puntuacion} puntos`);
                break;

            case 'escritura':
                // ✅ Ejercicios de escritura libre - Se validan manualmente o con IA
                const textoUsuario = respuesta_usuario.texto || respuesta_usuario.respuesta || '';
                const palabrasMinimas = respuestaCorrecta.palabras_minimas || 50;
                const palabrasEscritas = textoUsuario.trim().split(/\s+/).filter(p => p.length > 0).length;
                
                console.log('📝 Escritura - Palabras escritas:', palabrasEscritas);
                console.log('📝 Escritura - Palabras mínimas:', palabrasMinimas);
                
                // Por ahora, solo validamos que cumpla con el mínimo de palabras
                // En el futuro se puede agregar validación con IA o revisión manual
                if (palabrasEscritas >= palabrasMinimas) {
                    puntuacion = ejercicio.puntos_maximos;
                    esCorrecta = true;
                    console.log('✅ Escritura: Cumple con palabras mínimas');
                } else {
                    // Puntuación proporcional si no alcanza el mínimo
                    puntuacion = Math.round((palabrasEscritas / palabrasMinimas) * ejercicio.puntos_maximos);
                    esCorrecta = false;
                    console.log(`⚠️ Escritura: Solo ${palabrasEscritas}/${palabrasMinimas} palabras`);
                }
                break;

            default:
                return res.status(400).json({
                    success: false,
                    error: `Tipo de ejercicio no soportado: ${ejercicio.tipo}`
                });
        }

        console.log('📊 Resultado validación:', { esCorrecta, puntuacion });

        // ✅ OTORGAR XP SI LA RESPUESTA ES CORRECTA
        if (puntuacion > 0) {
            const Gamificacion = require('../models/gamificacionModel');
            await Gamificacion.otorgarXP(
                req.user.id, 
                puntuacion, 
                'ejercicio_completado',
                `Ejercicio: ${ejercicio.titulo}`
            );
            console.log(`🎉 XP otorgado: ${puntuacion} puntos al usuario ${req.user.id}`);
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

        // ✅ FORMATO CORRECIDO - Compatible con frontend
        res.json({
            success: true,
            esCorrecta: esCorrecta,
            puntuacion: puntuacion,
            puntuacionMaxima: ejercicio.puntos_maximos,
            respuestas: respuesta_usuario.respuestas || [respuesta_usuario.respuesta] || respuesta_usuario,
            correctas: respuestaCorrecta.respuestas || [respuestaCorrecta.respuesta] || respuestaCorrecta,
            explicacion: ejercicio.explicacion || '',
            tipo: ejercicio.tipo,
            // Mantener data para compatibilidad con otras partes del sistema
            data: {
                correcto: esCorrecta,
                puntuacion_obtenida: puntuacion,
                puntuacion_maxima: ejercicio.puntos_maximos,
                respuesta_correcta: respuestaCorrecta
            }
        });

    } catch (error) {
        console.error('❌ Error validando respuesta:', error);
        res.status(500).json({
            success: false,
            error: 'Error al validar respuesta: ' + error.message
        });
    }
};