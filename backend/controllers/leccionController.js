// backend/controllers/leccionController.js
const Leccion = require('../models/lecciones');
const Multimedia = require('../models/multimedia');

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

        if (progreso < 0 || progreso > 100) {
            return res.status(400).json({
                success: false,
                error: 'El progreso debe estar entre 0 y 100'
            });
        }

        // Verificar que la lección existe
        const leccionExistente = await Leccion.obtenerPorId(leccionId);
        if (!leccionExistente) {
            return res.status(404).json({
                success: false,
                error: 'Lección no encontrada'
            });
        }

        await Leccion.registrarProgreso(usuarioId, leccionId, progreso);

        res.json({
            success: true,
            mensaje: 'Progreso registrado exitosamente',
            data: {
                progreso,
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