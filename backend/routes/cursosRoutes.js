// backend/controllers/cursosController.js
const Curso = require('../models/cursos');
const { validationResult } = require('express-validator');

// @desc    Listar todos los cursos (con filtros opcionales)
// @route   GET /api/cursos
// @access  Public
exports.listarCursos = async (req, res) => {
    try {
        const { 
            pagina = 1, 
            limite = 20, 
            nivel, 
            idioma, 
            estado,
            search,
            sortBy = 'orden',
            sortOrder = 'ASC'
        } = req.query;

        // Validar parámetros de paginación
        const paginaNum = Math.max(1, parseInt(pagina));
        const limiteNum = Math.min(100, Math.max(1, parseInt(limite))); // Máximo 100 por página

        const filtros = {
            nivel,
            idioma,
            estado: estado || 'activo',
            search: search?.trim() || null
        };

        const opciones = {
            sortBy,
            sortOrder: sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
        };

        const resultado = await Curso.listar(paginaNum, limiteNum, filtros, opciones);

        res.json({
            success: true,
            data: resultado.cursos,
            paginacion: {
                ...resultado.paginacion,
                filtros_aplicados: Object.keys(filtros).filter(key => filtros[key])
            },
            metadata: {
                total_cursos: resultado.paginacion.total,
                niveles_disponibles: await Curso.obtenerNivelesDisponibles(),
                idiomas_disponibles: await Curso.obtenerIdiomasDisponibles()
            }
        });

    } catch (error) {
        console.error('❌ Error listando cursos:', error);
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                error: 'Parámetros de búsqueda inválidos',
                detalles: error.details
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al listar cursos',
            codigo: 'CURSOS_LIST_ERROR'
        });
    }
};

// @desc    Obtener cursos por nivel
// @route   GET /api/cursos/nivel/:nivel
// @access  Public
exports.obtenerCursosPorNivel = async (req, res) => {
    try {
        const { nivel } = req.params;
        const { 
            idioma = 'Inglés',
            incluir_inactivos = false 
        } = req.query;

        // Validar nivel
        const nivelesValidos = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        if (!nivelesValidos.includes(nivel.toUpperCase())) {
            return res.status(400).json({
                success: false,
                error: 'Nivel inválido',
                niveles_validos: nivelesValidos
            });
        }

        const cursos = await Curso.obtenerPorNivel(
            nivel.toUpperCase(), 
            idioma,
            incluir_inactivos === 'true'
        );

        res.json({
            success: true,
            data: cursos,
            metadata: {
                nivel: nivel.toUpperCase(),
                idioma,
                total_cursos: cursos.length,
                total_lecciones: cursos.reduce((sum, curso) => sum + (curso.total_lecciones || 0), 0)
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo cursos por nivel:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al obtener cursos por nivel',
            codigo: 'CURSOS_BY_LEVEL_ERROR'
        });
    }
};

// @desc    Obtener curso por ID
// @route   GET /api/cursos/:id
// @access  Public
exports.obtenerCurso = async (req, res) => {
    try {
        const cursoId = req.params.id;
        const { 
            incluir_lecciones = false,
            incluir_estadisticas = false 
        } = req.query;

        // Validar ID
        if (!cursoId || isNaN(parseInt(cursoId))) {
            return res.status(400).json({
                success: false,
                error: 'ID de curso inválido'
            });
        }

        const curso = await Curso.obtenerPorId(cursoId, {
            incluirLecciones: incluir_lecciones === 'true',
            incluirEstadisticas: incluir_estadisticas === 'true'
        });

        if (!curso) {
            return res.status(404).json({
                success: false,
                error: 'Curso no encontrado',
                codigo: 'CURSO_NOT_FOUND'
            });
        }

        // Si el curso está inactivo y el usuario no es admin
        if (curso.estado === 'inactivo' && (!req.user || req.user.rol !== 'admin')) {
            return res.status(403).json({
                success: false,
                error: 'Este curso no está disponible actualmente',
                codigo: 'CURSO_INACTIVO'
            });
        }

        res.json({
            success: true,
            data: curso,
            metadata: {
                estado: curso.estado,
                fecha_creacion: curso.fecha_creacion,
                ultima_actualizacion: curso.ultima_actualizacion
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo curso:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al obtener curso',
            codigo: 'CURSO_FETCH_ERROR'
        });
    }
};

// @desc    Obtener lecciones de un curso
// @route   GET /api/cursos/:id/lecciones
// @access  Private
exports.obtenerLeccionesCurso = async (req, res) => {
    try {
        const cursoId = req.params.id;
        const usuarioId = req.user.id;
        const { 
            incluir_contenido = false,
            solo_disponibles = true 
        } = req.query;

        // Verificar que el usuario esté inscrito en el curso
        const estaInscrito = await Curso.verificarInscripcion(usuarioId, cursoId);
        
        if (!estaInscrito && req.user.rol === 'alumno') {
            return res.status(403).json({
                success: false,
                error: 'Debes estar inscrito en el curso para ver sus lecciones',
                codigo: 'NOT_ENROLLED'
            });
        }

        const opciones = {
            incluirContenido: incluir_contenido === 'true',
            soloDisponibles: solo_disponibles !== 'false',
            usuarioId: req.user.rol === 'alumno' ? usuarioId : null
        };

        const lecciones = await Curso.obtenerLecciones(cursoId, opciones);

        res.json({
            success: true,
            data: lecciones,
            metadata: {
                total_lecciones: lecciones.length,
                lecciones_completadas: lecciones.filter(l => l.completada).length,
                progreso_curso: await Curso.calcularProgresoCurso(usuarioId, cursoId)
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo lecciones del curso:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al obtener lecciones',
            codigo: 'LECCIONES_FETCH_ERROR'
        });
    }
};

// @desc    Inscribir estudiante a un curso
// @route   POST /api/cursos/:id/inscribir
// @access  Private (Estudiante)
exports.inscribirEstudiante = async (req, res) => {
    try {
        const cursoId = req.params.id;
        const usuarioId = req.user.id;

        // Validar que el usuario sea estudiante
        if (req.user.rol !== 'alumno') {
            return res.status(403).json({
                success: false,
                error: 'Solo los estudiantes pueden inscribirse en cursos',
                codigo: 'INVALID_ROLE'
            });
        }

        // Verificar que el curso existe y está activo
        const curso = await Curso.obtenerPorId(cursoId);
        if (!curso) {
            return res.status(404).json({
                success: false,
                error: 'Curso no encontrado',
                codigo: 'CURSO_NOT_FOUND'
            });
        }

        if (curso.estado !== 'activo') {
            return res.status(400).json({
                success: false,
                error: 'Este curso no está disponible para inscripción',
                codigo: 'CURSO_NOT_AVAILABLE'
            });
        }

        // Verificar si ya está inscrito
        const yaInscrito = await Curso.verificarInscripcion(usuarioId, cursoId);
        if (yaInscrito) {
            return res.status(409).json({
                success: false,
                error: 'Ya estás inscrito en este curso',
                codigo: 'ALREADY_ENROLLED',
                data: {
                    curso_id: cursoId,
                    fecha_inscripcion: yaInscrito.fecha_inscripcion
                }
            });
        }

        const resultado = await Curso.inscribirEstudiante(usuarioId, cursoId);

        if (resultado.success) {
            res.status(201).json({
                success: true,
                mensaje: resultado.mensaje,
                data: {
                    curso_id: cursoId,
                    curso_nombre: curso.nombre,
                    fecha_inscripcion: resultado.fecha_inscripcion,
                    primera_leccion: resultado.primera_leccion
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: resultado.mensaje,
                codigo: 'ENROLLMENT_FAILED'
            });
        }

    } catch (error) {
        console.error('❌ Error inscribiendo estudiante:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                error: 'Ya estás inscrito en este curso',
                codigo: 'ALREADY_ENROLLED'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al inscribir',
            codigo: 'ENROLLMENT_ERROR'
        });
    }
};

// @desc    Obtener progreso del estudiante en un curso
// @route   GET /api/cursos/:id/progreso
// @access  Private (Estudiante)
exports.obtenerProgresoEstudiante = async (req, res) => {
    try {
        const cursoId = req.params.id;
        const usuarioId = req.user.id;

        // Verificar inscripción
        const estaInscrito = await Curso.verificarInscripcion(usuarioId, cursoId);
        if (!estaInscrito) {
            return res.status(404).json({
                success: false,
                error: 'No estás inscrito en este curso',
                codigo: 'NOT_ENROLLED',
                sugerencia: 'Inscríbete en el curso para acceder a tu progreso'
            });
        }

        const progreso = await Curso.obtenerProgresoEstudiante(usuarioId, cursoId);

        res.json({
            success: true,
            data: progreso,
            metadata: {
                curso_id: cursoId,
                usuario_id: usuarioId,
                fecha_inscripcion: estaInscrito.fecha_inscripcion,
                ultima_actividad: progreso.ultima_actividad
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo progreso:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al obtener progreso',
            codigo: 'PROGRESS_FETCH_ERROR'
        });
    }
};

// @desc    Obtener cursos del estudiante
// @route   GET /api/estudiante/mis-cursos
// @access  Private (Estudiante)
exports.obtenerMisCursos = async (req, res) => {
    try {
        const usuarioId = req.user.id;
        const { 
            estado = 'todos',
            ordenar_por = 'fecha_inscripcion',
            orden = 'DESC'
        } = req.query;

        // Validar que el usuario sea estudiante
        if (req.user.rol !== 'alumno') {
            return res.status(403).json({
                success: false,
                error: 'Solo los estudiantes pueden acceder a sus cursos',
                codigo: 'INVALID_ROLE'
            });
        }

        const filtros = {
            estado: ['activo', 'completado', 'en_curso'].includes(estado) ? estado : 'todos'
        };

        const opciones = {
            ordenarPor: ordenar_por,
            orden: orden.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
        };

        const cursos = await Curso.obtenerCursosEstudiante(usuarioId, filtros, opciones);

        // Calcular estadísticas generales
        const estadisticas = {
            total_cursos: cursos.length,
            cursos_activos: cursos.filter(c => c.estado_inscripcion === 'activo').length,
            cursos_completados: cursos.filter(c => c.estado_inscripcion === 'completado').length,
            progreso_promedio: cursos.reduce((sum, curso) => sum + (curso.progreso || 0), 0) / cursos.length || 0
        };

        res.json({
            success: true,
            data: cursos,
            estadisticas,
            metadata: {
                usuario_id: usuarioId,
                total_cursos_inscritos: estadisticas.total_cursos
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo cursos del estudiante:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            codigo: 'MY_COURSES_FETCH_ERROR'
        });
    }
};

// @desc    Obtener siguiente lección de un curso
// @route   GET /api/cursos/:id/siguiente-leccion
// @access  Private (Estudiante)
exports.obtenerSiguienteLeccion = async (req, res) => {
    try {
        const cursoId = req.params.id;
        const usuarioId = req.user.id;

        // Verificar inscripción
        const estaInscrito = await Curso.verificarInscripcion(usuarioId, cursoId);
        if (!estaInscrito) {
            return res.status(404).json({
                success: false,
                error: 'No estás inscrito en este curso',
                codigo: 'NOT_ENROLLED'
            });
        }

        const leccion = await Curso.obtenerSiguienteLeccion(usuarioId, cursoId);

        if (!leccion) {
            // Curso completado
            const progreso = await Curso.obtenerProgresoEstudiante(usuarioId, cursoId);
            
            return res.json({
                success: true,
                data: null,
                mensaje: '¡Felicidades! Has completado todas las lecciones de este curso',
                metadata: {
                    curso_completado: true,
                    progreso_final: progreso.progreso_porcentaje,
                    fecha_completado: progreso.fecha_completado
                }
            });
        }

        res.json({
            success: true,
            data: leccion,
            metadata: {
                es_primera_leccion: leccion.es_primera || false,
                lecciones_restantes: await Curso.obtenerLeccionesRestantes(usuarioId, cursoId)
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo siguiente lección:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            codigo: 'NEXT_LESSON_ERROR'
        });
    }
};

// @desc    Crear nuevo curso
// @route   POST /api/cursos
// @access  Private (Profesor/Admin)
exports.crearCurso = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Datos de entrada inválidos',
                detalles: errors.array()
            });
        }

        const {
            nombre,
            descripcion,
            nivel,
            idioma,
            icono,
            color,
            imagen_portada,
            orden,
            duracion_estimada,
            objetivos,
            requisitos,
            estado = 'activo'
        } = req.body;

        // Validar nivel
        const nivelesValidos = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        if (!nivelesValidos.includes(nivel.toUpperCase())) {
            return res.status(400).json({
                success: false,
                error: 'Nivel inválido',
                niveles_validos: nivelesValidos
            });
        }

        const cursoData = {
            nombre: nombre.trim(),
            descripcion: descripcion?.trim(),
            nivel: nivel.toUpperCase(),
            idioma: idioma || 'Inglés',
            icono: icono || '📚',
            color: color || '#6366f1',
            imagen_portada,
            orden: orden || 0,
            duracion_estimada: duracion_estimada || 0,
            objetivos: objetivos || [],
            requisitos: requisitos || [],
            estado,
            creado_por: req.user.id
        };

        const cursoId = await Curso.crear(cursoData);
        const cursoCreado = await Curso.obtenerPorId(cursoId);

        res.status(201).json({
            success: true,
            mensaje: 'Curso creado exitosamente',
            data: cursoCreado,
            metadata: {
                id: cursoId,
                fecha_creacion: cursoCreado.fecha_creacion
            }
        });

    } catch (error) {
        console.error('❌ Error creando curso:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                error: 'Ya existe un curso con ese nombre y nivel',
                codigo: 'DUPLICATE_COURSE'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al crear curso',
            codigo: 'COURSE_CREATION_ERROR'
        });
    }
};

// @desc    Actualizar curso
// @route   PUT /api/cursos/:id
// @access  Private (Profesor/Admin)
exports.actualizarCurso = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Datos de entrada inválidos',
                detalles: errors.array()
            });
        }

        const cursoId = req.params.id;
        const datosActualizacion = req.body;

        // Validar ID
        if (!cursoId || isNaN(parseInt(cursoId))) {
            return res.status(400).json({
                success: false,
                error: 'ID de curso inválido'
            });
        }

        // Verificar que el curso existe
        const cursoExistente = await Curso.obtenerPorId(cursoId);
        if (!cursoExistente) {
            return res.status(404).json({
                success: false,
                error: 'Curso no encontrado',
                codigo: 'CURSO_NOT_FOUND'
            });
        }

        // Verificar permisos
        const puedeEditar = cursoExistente.creado_por === req.user.id || 
                           req.user.rol === 'admin' || 
                           req.user.rol === 'profesor';

        if (!puedeEditar) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permisos para editar este curso',
                codigo: 'EDIT_PERMISSION_DENIED'
            });
        }

        // Normalizar datos antes de actualizar
        if (datosActualizacion.nivel) {
            datosActualizacion.nivel = datosActualizacion.nivel.toUpperCase();
        }
        if (datosActualizacion.nombre) {
            datosActualizacion.nombre = datosActualizacion.nombre.trim();
        }

        const actualizado = await Curso.actualizar(cursoId, datosActualizacion);

        if (actualizado) {
            const cursoActualizado = await Curso.obtenerPorId(cursoId);
            
            res.json({
                success: true,
                mensaje: 'Curso actualizado exitosamente',
                data: cursoActualizado,
                metadata: {
                    campos_actualizados: Object.keys(datosActualizacion),
                    ultima_actualizacion: cursoActualizado.ultima_actualizacion
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: 'No se pudo actualizar el curso',
                codigo: 'UPDATE_FAILED'
            });
        }

    } catch (error) {
        console.error('❌ Error actualizando curso:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al actualizar curso',
            codigo: 'COURSE_UPDATE_ERROR'
        });
    }
};

// @desc    Eliminar curso (soft delete)
// @route   DELETE /api/cursos/:id
// @access  Private (Admin)
exports.eliminarCurso = async (req, res) => {
    try {
        const cursoId = req.params.id;

        // Validar ID
        if (!cursoId || isNaN(parseInt(cursoId))) {
            return res.status(400).json({
                success: false,
                error: 'ID de curso inválido'
            });
        }

        // Verificar que el curso existe
        const cursoExistente = await Curso.obtenerPorId(cursoId);
        if (!cursoExistente) {
            return res.status(404).json({
                success: false,
                error: 'Curso no encontrado',
                codigo: 'CURSO_NOT_FOUND'
            });
        }

        // Verificar permisos de administrador
        if (req.user.rol !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Solo los administradores pueden eliminar cursos',
                codigo: 'DELETE_PERMISSION_DENIED'
            });
        }

        // Verificar si hay estudiantes inscritos
        const estudiantesInscritos = await Curso.obtenerEstudiantesInscritos(cursoId);
        if (estudiantesInscritos.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'No se puede eliminar el curso porque tiene estudiantes inscritos',
                codigo: 'COURSE_HAS_STUDENTS',
                data: {
                    total_estudiantes: estudiantesInscritos.length,
                    estudiantes: estudiantesInscritos.slice(0, 5) // Mostrar primeros 5
                }
            });
        }

        const eliminado = await Curso.eliminar(cursoId);

        if (eliminado) {
            res.json({
                success: true,
                mensaje: 'Curso eliminado exitosamente',
                metadata: {
                    curso_id: cursoId,
                    nombre: cursoExistente.nombre,
                    fecha_eliminacion: new Date().toISOString()
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: 'No se pudo eliminar el curso',
                codigo: 'DELETE_FAILED'
            });
        }

    } catch (error) {
        console.error('❌ Error eliminando curso:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al eliminar curso',
            codigo: 'COURSE_DELETE_ERROR'
        });
    }
};

// @desc    Obtener estadísticas generales de cursos
// @route   GET /api/cursos/admin/estadisticas
// @access  Private (Admin)
exports.obtenerEstadisticas = async (req, res) => {
    try {
        // Verificar permisos de administrador
        if (req.user.rol !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Solo los administradores pueden acceder a las estadísticas',
                codigo: 'STATS_PERMISSION_DENIED'
            });
        }

        const { periodo = '30d' } = req.query;
        const estadisticas = await Curso.obtenerEstadisticas(periodo);

        res.json({
            success: true,
            data: estadisticas,
            metadata: {
                periodo,
                fecha_consulta: new Date().toISOString(),
                total_cursos: estadisticas.total_cursos,
                cursos_activos: estadisticas.cursos_activos
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            codigo: 'STATS_FETCH_ERROR'
        });
    }
};

// @desc    Buscar cursos
// @route   GET /api/cursos/buscar
// @access  Public
exports.buscarCursos = async (req, res) => {
    try {
        const { 
            q,
            nivel,
            idioma,
            max_duracion,
            min_rating = 0
        } = req.query;

        if (!q?.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Término de búsqueda requerido'
            });
        }

        const resultados = await Curso.buscar({
            termino: q.trim(),
            nivel,
            idioma,
            max_duracion: parseInt(max_duracion),
            min_rating: parseFloat(min_rating)
        });

        res.json({
            success: true,
            data: resultados,
            metadata: {
                termino_busqueda: q,
                total_resultados: resultados.length,
                filtros_aplicados: {
                    nivel: nivel || 'todos',
                    idioma: idioma || 'todos',
                    min_rating
                }
            }
        });

    } catch (error) {
        console.error('❌ Error buscando cursos:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al buscar cursos',
            codigo: 'COURSE_SEARCH_ERROR'
        });
    }
};

// @desc    Obtener cursos recomendados para el usuario
// @route   GET /api/cursos/recomendados
// @access  Private (Estudiante)
exports.obtenerCursosRecomendados = async (req, res) => {
    try {
        const usuarioId = req.user.id;
        
        if (req.user.rol !== 'alumno') {
            return res.status(403).json({
                success: false,
                error: 'Solo los estudiantes pueden obtener recomendaciones',
                codigo: 'INVALID_ROLE'
            });
        }

        const recomendaciones = await Curso.obtenerRecomendaciones(usuarioId);

        res.json({
            success: true,
            data: recomendaciones,
            metadata: {
                usuario_id: usuarioId,
                total_recomendaciones: recomendaciones.length,
                criterios: {
                    basado_en_nivel: true,
                    basado_en_intereses: true,
                    cursos_populares: true
                }
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo cursos recomendados:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al obtener recomendaciones',
            codigo: 'RECOMMENDATIONS_ERROR'
        });
    }
};