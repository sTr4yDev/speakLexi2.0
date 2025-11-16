// backend/controllers/cursosController.js
const Curso = require('../models/cursos');
const db = require('../config/database'); // Necesitamos importar db para el nuevo método

// @desc    Listar todos los cursos (con filtros opcionales)
// @route   GET /api/cursos
// @access  Public
exports.listarCursos = async (req, res) => {
    try {
        const { pagina = 1, limite = 20, nivel, idioma, estado } = req.query;

        const resultado = await Curso.listar(
            parseInt(pagina), 
            parseInt(limite), 
            { nivel, idioma, estado }
        );

        res.json({
            success: true,
            data: resultado.cursos,
            paginacion: resultado.paginacion
        });

    } catch (error) {
        console.error('Error listando cursos:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al listar cursos'
        });
    }
};

// @desc    Obtener cursos por nivel
// @route   GET /api/cursos/nivel/:nivel
// @access  Public
exports.obtenerCursosPorNivel = async (req, res) => {
    try {
        const { nivel } = req.params;
        const { idioma = 'Inglés' } = req.query;

        const cursos = await Curso.obtenerPorNivel(nivel, idioma);

        res.json({
            success: true,
            data: cursos
        });

    } catch (error) {
        console.error('Error obteniendo cursos por nivel:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al obtener cursos'
        });
    }
};

// @desc    Obtener lecciones por nivel e idioma (NUEVO MÉTODO)
// @route   GET /api/cursos/nivel/:nivel/idioma/:idioma
// @access  Private
// Función: Obtiene lecciones filtradas por nivel e idioma del usuario, incluyendo progreso individual
exports.obtenerLeccionesPorNivelIdioma = async (req, res) => {
    try {
        const { nivel, idioma } = req.params;
        const [lecciones] = await db.query(
            `SELECT l.*, 
                    COALESCE(pl.progreso, 0) as progreso,
                    COALESCE(pl.completada, false) as completada
             FROM lecciones l
             LEFT JOIN progreso_lecciones pl ON l.id = pl.leccion_id AND pl.usuario_id = ?
             WHERE l.nivel = ? AND l.idioma = ? AND l.estado = 'activa'
             ORDER BY l.orden`,
            [req.user.id, nivel, idioma]
        );        res.json(lecciones);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Obtener curso por ID
// @route   GET /api/cursos/:id
// @access  Public
exports.obtenerCurso = async (req, res) => {
    try {
        const cursoId = req.params.id;
        const curso = await Curso.obtenerPorId(cursoId);

        if (!curso) {
            return res.status(404).json({
                success: false,
                error: 'Curso no encontrado'
            });
        }

        res.json({
            success: true,
            data: curso
        });

    } catch (error) {
        console.error('Error obteniendo curso:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al obtener curso'
        });
    }
};

// @desc    Obtener lecciones de un curso
// @route   GET /api/cursos/:id/lecciones
// @access  Private
exports.obtenerLeccionesCurso = async (req, res) => {
    try {
        const cursoId = req.params.id;
        const usuarioId = req.user ? req.user.id : null;

        const lecciones = await Curso.obtenerLecciones(cursoId, usuarioId);

        res.json({
            success: true,
            data: lecciones
        });

    } catch (error) {
        console.error('Error obteniendo lecciones del curso:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al obtener lecciones'
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

        // Verificar que el curso existe
        const curso = await Curso.obtenerPorId(cursoId);
        if (!curso) {
            return res.status(404).json({
                success: false,
                error: 'Curso no encontrado'
            });
        }

        const resultado = await Curso.inscribirEstudiante(usuarioId, cursoId);

        if (resultado.success) {
            res.status(201).json({
                success: true,
                mensaje: resultado.mensaje
            });
        } else {
            res.status(400).json({
                success: false,
                error: resultado.mensaje
            });
        }

    } catch (error) {
        console.error('Error inscribiendo estudiante:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al inscribir'
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

        const progreso = await Curso.obtenerProgresoEstudiante(usuarioId, cursoId);

        if (!progreso) {
            return res.status(404).json({
                success: false,
                error: 'No estás inscrito en este curso'
            });
        }

        res.json({
            success: true,
            data: progreso
        });

    } catch (error) {
        console.error('Error obteniendo progreso:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al obtener progreso'
        });
    }
};

// @desc    Obtener cursos del estudiante
// @route   GET /api/estudiante/mis-cursos
// @access  Private (Estudiante)
exports.obtenerMisCursos = async (req, res) => {
    try {
        const usuarioId = req.user.id;

        const cursos = await Curso.obtenerCursosEstudiante(usuarioId);

        res.json({
            success: true,
            data: cursos
        });

    } catch (error) {
        console.error('Error obteniendo cursos del estudiante:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
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

        const leccion = await Curso.obtenerSiguienteLeccion(usuarioId, cursoId);

        if (!leccion) {
            return res.json({
                success: true,
                data: null,
                mensaje: 'Has completado todas las lecciones de este curso'
            });
        }

        res.json({
            success: true,
            data: leccion
        });

    } catch (error) {
        console.error('Error obteniendo siguiente lección:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
};

// @desc    Crear nuevo curso
// @route   POST /api/cursos
// @access  Private (Profesor/Admin)
exports.crearCurso = async (req, res) => {
    try {
        const {
            nombre,
            descripcion,
            nivel,
            idioma,
            icono,
            color,
            imagen_portada,
            orden
        } = req.body;

        // Validar datos requeridos
        if (!nombre || !nivel) {
            return res.status(400).json({
                success: false,
                error: 'Nombre y nivel son requeridos'
            });
        }

        const cursoData = {
            nombre,
            descripcion,
            nivel,
            idioma: idioma || 'Inglés',
            icono: icono || '📚',
            color: color || '#6366f1',
            imagen_portada,
            orden: orden || 0,
            creado_por: req.user.id
        };

        const cursoId = await Curso.crear(cursoData);

        res.status(201).json({
            success: true,
            mensaje: 'Curso creado exitosamente',
            data: {
                id: cursoId,
                ...cursoData
            }
        });

    } catch (error) {
        console.error('Error creando curso:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al crear curso'
        });
    }
};

// @desc    Actualizar curso
// @route   PUT /api/cursos/:id
// @access  Private (Profesor/Admin)
exports.actualizarCurso = async (req, res) => {
    try {
        const cursoId = req.params.id;
        const datosActualizacion = req.body;

        // Verificar que el curso existe
        const cursoExistente = await Curso.obtenerPorId(cursoId);
        if (!cursoExistente) {
            return res.status(404).json({
                success: false,
                error: 'Curso no encontrado'
            });
        }

        // Verificar permisos
        if (cursoExistente.creado_por !== req.user.id && req.user.rol !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'No tienes permisos para editar este curso'
            });
        }

        const actualizado = await Curso.actualizar(cursoId, datosActualizacion);

        if (actualizado) {
            res.json({
                success: true,
                mensaje: 'Curso actualizado exitosamente'
            });
        } else {
            res.status(400).json({
                success: false,
                error: 'No se pudo actualizar el curso'
            });
        }

    } catch (error) {
        console.error('Error actualizando curso:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al actualizar curso'
        });
    }
};

// @desc    Eliminar curso
// @route   DELETE /api/cursos/:id
// @access  Private (Admin)
exports.eliminarCurso = async (req, res) => {
    try {
        const cursoId = req.params.id;

        // Verificar que el curso existe
        const cursoExistente = await Curso.obtenerPorId(cursoId);
        if (!cursoExistente) {
            return res.status(404).json({
                success: false,
                error: 'Curso no encontrado'
            });
        }

        const eliminado = await Curso.eliminar(cursoId);

        if (eliminado) {
            res.json({
                success: true,
                mensaje: 'Curso eliminado exitosamente'
            });
        } else {
            res.status(400).json({
                success: false,
                error: 'No se pudo eliminar el curso'
            });
        }

    } catch (error) {
        console.error('Error eliminando curso:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al eliminar curso'
        });
    }
};

// @desc    Obtener estadísticas generales de cursos
// @route   GET /api/cursos/stats
// @access  Private (Admin)
exports.obtenerEstadisticas = async (req, res) => {
    try {
        const estadisticas = await Curso.obtenerEstadisticas();

        res.json({
            success: true,
            data: estadisticas
        });

    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
};

// @desc    Obtener cursos del estudiante
// @route   GET /api/cursos/estudiante/mis-cursos
// @access  Private (Estudiante)
exports.obtenerMisCursos = async (req, res) => {
    try {
        const usuarioId = req.user.id;
        const cursos = await Curso.obtenerCursosEstudiante(usuarioId);

        res.json({
            success: true,
            data: cursos
        });
    } catch (error) {
        console.error('Error obteniendo mis cursos:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
};