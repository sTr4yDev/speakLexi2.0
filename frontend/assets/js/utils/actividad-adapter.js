// frontend/assets/js/utils/actividad-adapter.js
window.ActividadAdapter = {
    // Mapeo completo de tipos
    TIPO_MAPPING: {
        'seleccion_multiple': 'multiple_choice',
        'verdadero_falso': 'true_false', 
        'completar_espacios': 'fill_blank',
        'emparejamiento': 'matching',
        'escritura': 'writing',
        // Reverse mapping (por si acaso)
        'multiple_choice': 'multiple_choice',
        'true_false': 'true_false',
        'fill_blank': 'fill_blank',
        'matching': 'matching',
        'writing': 'writing'
    },

    // Convertir actividad del backend al formato frontend
    adaptarActividad(actividadBackend, index) {
        console.log(`🔄 Adaptando actividad ${index}:`, actividadBackend);
        
        const tipoFrontend = this.TIPO_MAPPING[actividadBackend.tipo] || 'multiple_choice';
        
        const actividadBase = {
            id: actividadBackend.id || `ej-${index}-${Date.now()}`,
            titulo: actividadBackend.titulo || `Ejercicio ${index + 1}`,
            descripcion: actividadBackend.descripcion || "",
            tipo: tipoFrontend,
            puntos_maximos: actividadBackend.puntos_maximos || actividadBackend.puntos || 10,
            orden: actividadBackend.orden || index + 1,
            estado: actividadBackend.estado || 'activo',
            contenido: this.adaptarContenido(actividadBackend, tipoFrontend),
            respuesta_correcta: this.adaptarRespuesta(actividadBackend, tipoFrontend),
            // 🆕 Mantener metadata original para debug
            _original: {
                tipo: actividadBackend.tipo,
                contenido: actividadBackend.contenido,
                respuesta: actividadBackend.respuesta_correcta
            }
        };

        console.log(`✅ Actividad ${index} adaptada:`, actividadBase);
        return actividadBase;
    },

    // Adaptar contenido según el tipo
    adaptarContenido(actividad, tipoFrontend) {
        const contenido = actividad.contenido || {};
        
        console.log(`📦 Adaptando contenido para ${actividad.tipo}:`, contenido);
        
        switch(actividad.tipo) {
            case 'seleccion_multiple':
                const contenidoMC = {
                    pregunta: contenido.pregunta || contenido.preguntas?.[0]?.pregunta || actividad.titulo,
                    opciones: contenido.opciones || contenido.preguntas?.[0]?.opciones || [],
                    explicacion: contenido.explicacion || ""
                };
                console.log(`🎯 MC adaptado:`, contenidoMC);
                return contenidoMC;

            case 'completar_espacios':
                const espacios = contenido.espacios || contenido.palabras_faltantes || [];
                const contenidoCE = {
                    texto: contenido.texto || "",
                    espacios: espacios,
                    explicacion: contenido.explicacion || "",
                    // 🆕 Para compatibilidad con el frontend existente
                    palabras_faltantes: espacios
                };
                console.log(`📝 Completar espacios adaptado:`, contenidoCE);
                return contenidoCE;

            case 'emparejamiento':
                const contenidoEM = {
                    pares: contenido.pares || [],
                    instrucciones: contenido.instrucciones || "Empareja cada elemento con su correspondiente",
                    explicacion: contenido.explicacion || ""
                };
                console.log(`🔗 Emparejamiento adaptado:`, contenidoEM);
                return contenidoEM;

            case 'verdadero_falso':
                const contenidoVF = {
                    afirmaciones: contenido.afirmaciones || [],
                    explicacion: contenido.explicacion || ""
                };
                console.log(`✅❌ Verdadero/Falso adaptado:`, contenidoVF);
                return contenidoVF;

            case 'escritura':
                const contenidoES = {
                    consigna: contenido.consigna || contenido.instrucciones || actividad.titulo,
                    placeholder: contenido.placeholder || "Escribe tu respuesta aquí...",
                    palabras_minimas: contenido.palabras_minimas || 50,
                    explicacion: contenido.explicacion || ""
                };
                console.log(`✍️ Escritura adaptada:`, contenidoES);
                return contenidoES;

            default:
                console.warn(`⚠️ Tipo desconocido: ${actividad.tipo}, usando contenido original`);
                return contenido;
        }
    },

    // Adaptar respuesta correcta
    adaptarRespuesta(actividad, tipoFrontend) {
        const respuesta = actividad.respuesta_correcta || {};
        const contenido = actividad.contenido || {};

        console.log(`🎯 Adaptando respuesta para ${actividad.tipo}:`, respuesta);
        
        switch(actividad.tipo) {
            case 'seleccion_multiple':
                const respMC = {
                    respuestas: respuesta.respuestas || [0],
                    tipo: respuesta.tipo || "indices"
                };
                console.log(`🎯 Respuesta MC:`, respMC);
                return respMC;

            case 'completar_espacios':
                const palabras = contenido.espacios || contenido.palabras_faltantes || [];
                const respCE = {
                    respuestas: respuesta.respuestas || palabras,
                    tipo: respuesta.tipo || "palabras"
                };
                console.log(`📝 Respuesta Completar:`, respCE);
                return respCE;

            case 'emparejamiento':
                const pares = contenido.pares || [];
                const respEM = {
                    respuestas: respuesta.respuestas || pares.map((_, index) => index),
                    tipo: respuesta.tipo || "pares_ordenados"
                };
                console.log(`🔗 Respuesta Emparejamiento:`, respEM);
                return respEM;

            case 'verdadero_falso':
                const respVF = {
                    respuestas: respuesta.respuestas || [],
                    tipo: respuesta.tipo || "booleanos"
                };
                console.log(`✅❌ Respuesta V/F:`, respVF);
                return respVF;

            case 'escritura':
                const respES = {
                    tipo: "evaluacion_manual",
                    criterios: respuesta.criterios || ["Claridad", "Precisión", "Coherencia"]
                };
                console.log(`✍️ Respuesta Escritura:`, respES);
                return respES;

            default:
                console.warn(`⚠️ Tipo desconocido para respuesta: ${actividad.tipo}, usando respuesta original`);
                return respuesta;
        }
    },

    // Método batch para adaptar todas las actividades
    adaptarTodasActividades(actividadesBackend) {
        console.log(`🔄 Iniciando adaptación de ${actividadesBackend.length} actividades`);
        
        const actividadesAdaptadas = actividadesBackend.map((actividad, index) => 
            this.adaptarActividad(actividad, index)
        );
        
        console.log(`✅ Adaptación completada:`, actividadesAdaptadas);
        return actividadesAdaptadas;
    },

    // Verificar si necesita adaptación
    necesitaAdaptacion(actividades) {
        if (!actividades || !actividades.length) {
            console.log('📭 No hay actividades para adaptar');
            return false;
        }
        
        const primeraActividad = actividades[0];
        const necesita = this.TIPO_MAPPING[primeraActividad.tipo] !== primeraActividad.tipo;
        
        console.log(`🔍 Verificación adaptación: ${necesita ? 'SÍ necesita' : 'NO necesita'}`, {
            tipo_original: primeraActividad.tipo,
            tipo_mapeado: this.TIPO_MAPPING[primeraActividad.tipo]
        });
        
        return necesita;
    },

    // 🆕 MÉTODOS NUEVOS PARA MEJOR DEBUGGING

    // Verificar estado del adaptador
    verificarEstado() {
        const tiposProblema = Object.entries(this.TIPO_MAPPING)
            .filter(([key, value]) => key !== value)
            .map(([key, value]) => `${key} → ${value}`);
            
        console.log('🔧 Estado del Adaptador:', {
            tiposMapeados: tiposProblema,
            totalTipos: Object.keys(this.TIPO_MAPPING).length
        });
        
        return tiposProblema;
    },

    // Diagnosticar actividades problemáticas
    diagnosticarActividades(actividades) {
        console.group('🔍 Diagnóstico de Actividades');
        
        actividades.forEach((act, index) => {
            const tipoAdaptado = this.TIPO_MAPPING[act.tipo];
            const problema = tipoAdaptado !== act.tipo;
            
            console.log(`📋 Actividad ${index}:`, {
                id: act.id,
                tipo_original: act.tipo,
                tipo_adaptado: tipoAdaptado,
                problema: problema ? '❌ Necesita adaptación' : '✅ OK',
                contenido: act.contenido ? '📦 Con contenido' : '📭 Sin contenido'
            });
        });
        
        console.groupEnd();
        
        return actividades.filter(act => this.TIPO_MAPPING[act.tipo] !== act.tipo);
    },

    // 🆕 Función simple de parche rápido (para implementación inmediata)
    parcheRapido(actividades) {
        console.log('⚡ Aplicando parche rápido de tipos...');
        return actividades.map(actividad => ({
            ...actividad,
            tipo: this.TIPO_MAPPING[actividad.tipo] || actividad.tipo
        }));
    }
};

// 🆕 INYECCIÓN AUTOMÁTICA PARA MODO DE DESARROLLO
(function autoInit() {
    console.log('🚀 ActividadAdapter cargado - Versión Mejorada 1.1');
    
    // Verificar si estamos en desarrollo
    const esDesarrollo = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname.includes('dev');
    
    if (esDesarrollo) {
        console.log('🔧 Modo desarrollo activado - Debugging habilitado');
        window.ActividadAdapter.verificarEstado();
    }
})();

// 🆕 POLYFILL para operador opcional (para navegadores viejos)
if (!String.prototype.replaceAll) {
    String.prototype.replaceAll = function(str, newStr) {
        return this.split(str).join(newStr);
    };
}