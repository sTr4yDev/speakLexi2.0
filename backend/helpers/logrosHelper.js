const { pool } = require('../config/database');

// Catálogo de logros disponibles
const CATALOGO_LOGROS = {
    primera_leccion: {
        id: 'primera_leccion',
        titulo: '🎯 Primera Lección',
        descripcion: 'Completaste tu primera lección',
        icono: '🎯'
    },
    perfeccionista: {
        id: 'perfeccionista',
        titulo: '💯 Perfeccionista',
        descripcion: 'Obtuviste 100% en una lección',
        icono: '💯'
    },
    racha_3: {
        id: 'racha_3',
        titulo: '🔥 En Racha',
        descripcion: 'Completaste 3 lecciones en un día',
        icono: '🔥'
    },
    estudiante_dedicado: {
        id: 'estudiante_dedicado',
        titulo: '📚 Estudiante Dedicado',
        descripcion: 'Completaste 10 lecciones',
        icono: '📚'
    },
    maestro_a1: {
        id: 'maestro_a1',
        titulo: '🎓 Maestro A1',
        descripcion: 'Completaste todas las lecciones de nivel A1',
        icono: '🎓'
    },
    maestro_a2: {
        id: 'maestro_a2',
        titulo: '🎓 Maestro A2',
        descripcion: 'Completaste todas las lecciones de nivel A2',
        icono: '🎓'
    },
    maestro_b1: {
        id: 'maestro_b1',
        titulo: '🎓 Maestro B1',
        descripcion: 'Completaste todas las lecciones de nivel B1',
        icono: '🎓'
    },
    maestro_b2: {
        id: 'maestro_b2',
        titulo: '🎓 Maestro B2',
        descripcion: 'Completaste todas las lecciones de nivel B2',
        icono: '🎓'
    },
    maestro_c1: {
        id: 'maestro_c1',
        titulo: '🎓 Maestro C1',
        descripcion: 'Completaste todas las lecciones de nivel C1',
        icono: '🎓'
    },
    maestro_c2: {
        id: 'maestro_c2',
        titulo: '🎓 Maestro C2',
        descripcion: 'Completaste todas las lecciones de nivel C2',
        icono: '🎓'
    }
};

// Verificar y otorgar logros
async function verificarLogros(usuarioId, leccionCompletada) {
    try {
        const logrosNuevos = [];

        // 1. Obtener logros actuales del usuario
        const [perfil] = await pool.execute(
            'SELECT logros_desbloqueados FROM perfil_estudiantes WHERE usuario_id = ?',
            [usuarioId]
        );

        let logrosActuales = [];
        try {
            const logrosJson = perfil[0]?.logros_desbloqueados;
            logrosActuales = logrosJson ? JSON.parse(logrosJson) : [];
        } catch (e) {
            logrosActuales = [];
        }

        const tiposDesbloqueados = logrosActuales.map(l => l.tipo);

        // 2. Contar lecciones completadas
        const [stats] = await pool.execute(`
            SELECT COUNT(*) as total_completadas
            FROM progreso_lecciones
            WHERE usuario_id = ? AND completada = 1
        `, [usuarioId]);

        const totalCompletadas = stats[0].total_completadas;

        // 3. LOGRO: Primera lección
        if (totalCompletadas === 1 && !tiposDesbloqueados.includes('primera_leccion')) {
            logrosNuevos.push('primera_leccion');
        }

        // 4. LOGRO: Perfeccionista (si la lección actual fue 100%)
        if (leccionCompletada.porcentaje === 100 && !tiposDesbloqueados.includes('perfeccionista')) {
            logrosNuevos.push('perfeccionista');
        }

        // 5. LOGRO: Estudiante dedicado (10 lecciones)
        if (totalCompletadas === 10 && !tiposDesbloqueados.includes('estudiante_dedicado')) {
            logrosNuevos.push('estudiante_dedicado');
        }

        // 6. LOGRO: Racha de 3 lecciones en un día
        const [rachaHoy] = await pool.execute(`
            SELECT COUNT(*) as completadas_hoy
            FROM progreso_lecciones
            WHERE usuario_id = ? 
            AND completada = 1
            AND DATE(actualizado_en) = CURDATE()
        `, [usuarioId]);

        if (rachaHoy[0].completadas_hoy === 3 && !tiposDesbloqueados.includes('racha_3')) {
            logrosNuevos.push('racha_3');
        }

        // 7. LOGRO: Maestro de nivel
        const nivel = leccionCompletada.nivel;
        const logroNivel = `maestro_${nivel.toLowerCase()}`;

        if (!tiposDesbloqueados.includes(logroNivel)) {
            // Contar lecciones del nivel
            const [statsNivel] = await pool.execute(`
                SELECT 
                    COUNT(DISTINCT l.id) as total_nivel,
                    COUNT(DISTINCT CASE WHEN pl.completada = 1 THEN l.id END) as completadas_nivel
                FROM lecciones l
                LEFT JOIN progreso_lecciones pl ON l.id = pl.leccion_id AND pl.usuario_id = ?
                WHERE l.nivel = ? AND l.estado = 'activa'
            `, [usuarioId, nivel]);

            const { total_nivel, completadas_nivel } = statsNivel[0];

            if (completadas_nivel === total_nivel && total_nivel > 0) {
                logrosNuevos.push(logroNivel);
            }
        }

        // 8. Guardar nuevos logros
        if (logrosNuevos.length > 0) {
            const ahora = new Date().toISOString();
            const nuevosObjetos = logrosNuevos.map(tipo => ({
                tipo,
                fecha: ahora
            }));

            const logrosActualizados = [...logrosActuales, ...nuevosObjetos];

            await pool.execute(
                'UPDATE perfil_estudiantes SET logros_desbloqueados = ? WHERE usuario_id = ?',
                [JSON.stringify(logrosActualizados), usuarioId]
            );

            console.log(`🏆 Nuevos logros desbloqueados para usuario ${usuarioId}:`, logrosNuevos);
        }

        // 9. Retornar logros con detalles
        return logrosNuevos.map(tipo => CATALOGO_LOGROS[tipo]);

    } catch (error) {
        console.error('❌ Error verificando logros:', error);
        return [];
    }
}

// Obtener todos los logros del usuario
async function obtenerLogrosUsuario(usuarioId) {
    try {
        const [perfil] = await pool.execute(
            'SELECT logros_desbloqueados FROM perfil_estudiantes WHERE usuario_id = ?',
            [usuarioId]
        );

        let logros = [];
        try {
            const logrosJson = perfil[0]?.logros_desbloqueados;
            logros = logrosJson ? JSON.parse(logrosJson) : [];
        } catch (e) {
            logros = [];
        }
        
        return logros.map(logro => ({
            ...CATALOGO_LOGROS[logro.tipo],
            fecha: logro.fecha
        }));
    } catch (error) {
        console.error('❌ Error obteniendo logros:', error);
        return [];
    }
}

// Obtener progreso de logros (X/10 desbloqueados)
async function obtenerProgresoLogros(usuarioId) {
    const logrosUsuario = await obtenerLogrosUsuario(usuarioId);
    const totalLogros = Object.keys(CATALOGO_LOGROS).length;
    
    return {
        desbloqueados: logrosUsuario.length,
        total: totalLogros,
        porcentaje: Math.round((logrosUsuario.length / totalLogros) * 100),
        logros: logrosUsuario
    };
}

module.exports = {
    CATALOGO_LOGROS,
    verificarLogros,
    obtenerLogrosUsuario,
    obtenerProgresoLogros
};