// frontend/assets/js/pages/admin/editar-leccion/actividades/actividad-base.js
// Clase base para todas las actividades
class ActividadBase {
    constructor(tipo, config) {
        this.id = 'actividad_' + Date.now();
        this.tipo = tipo;
        this.titulo = `Nueva Actividad ${config.nombre}`;
        this.puntos = 10;
        this.orden = 0;
        this.contenido = {
            pregunta: "",
            explicacion: "",
            imagen: null
        };
        this.config = {
            tiempo_limite: null,
            intentos_permitidos: 1,
            mostrar_explicacion: true
        };
    }

    // Método para validar la actividad
    validar() {
        const errores = [];
        
        if (!this.titulo || !this.titulo.trim()) {
            errores.push('El título de la actividad es requerido');
        }
        
        if (this.puntos < 1 || this.puntos > 100) {
            errores.push('Los puntos deben estar entre 1 y 100');
        }
        
        return errores;
    }

    // Método para serializar para la base de datos
    serializar() {
        return {
            tipo: this.tipo,
            titulo: this.titulo,
            puntos: this.puntos,
            orden: this.orden,
            contenido: JSON.stringify(this.contenido),
            config: JSON.stringify(this.config)
        };
    }
}

// Mapeo de tipos para compatibilidad con Python/backend
const TIPO_ACTIVIDAD_MAPPING = {
    'seleccion_multiple': 'multiple_choice',
    'verdadero_falso': 'true_false',
    'completar_espacios': 'fill_blank',
    'emparejamiento': 'matching',
    'escritura': 'writing'
};

// Mapeo inverso para convertir de backend a frontend
const TIPO_ACTIVIDAD_MAPPING_INVERSO = {
    'multiple_choice': 'seleccion_multiple',
    'true_false': 'verdadero_falso',
    'fill_blank': 'completar_espacios',
    'matching': 'emparejamiento',
    'writing': 'escritura'
};

// Manager global de actividades
window.ActividadManager = {
    actividades: [],
    
    // Tipos de actividad disponibles (CON CLASES COMPLETAS)
    tipos: {
        seleccion_multiple: {
            nombre: "Selección Múltiple",
            icono: "list-ul",
            color: "blue",
            bgColor: "bg-blue-100 dark:bg-blue-900/30",
            textColor: "text-blue-600 dark:text-blue-400",
            badgeColor: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
            puedeImagenes: true,
            tipo_final: "multiple_choice"
        },
        verdadero_falso: {
            nombre: "Verdadero/Falso",
            icono: "check-circle", 
            color: "green",
            bgColor: "bg-green-100 dark:bg-green-900/30",
            textColor: "text-green-600 dark:text-green-400",
            badgeColor: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
            puedeImagenes: true,
            tipo_final: "true_false"
        },
        completar_espacios: {
            nombre: "Completar Espacios",
            icono: "edit",
            color: "yellow",
            bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
            textColor: "text-yellow-600 dark:text-yellow-400",
            badgeColor: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
            puedeImagenes: true,
            tipo_final: "fill_blank"
        },
        emparejamiento: {
            nombre: "Emparejamiento",
            icono: "object-group",
            color: "purple",
            bgColor: "bg-purple-100 dark:bg-purple-900/30",
            textColor: "text-purple-600 dark:text-purple-400",
            badgeColor: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
            puedeImagenes: true,
            tipo_final: "matching"
        },
        escritura: {
            nombre: "Escritura",
            icono: "keyboard",
            color: "indigo",
            bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
            textColor: "text-indigo-600 dark:text-indigo-400",
            badgeColor: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
            puedeImagenes: true,
            tipo_final: "writing"
        }
    },

    // Inicializar el manager
    init() {
        this.actividades = window.leccionEditor ? window.leccionEditor.getActividades() : [];
        this.setupEventListeners();
        console.log('✅ ActividadManager inicializado con', this.actividades.length, 'actividades');
    },

    setupEventListeners() {
        // Event listeners para los tipos de actividad
        document.querySelectorAll('.tipo-actividad-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const tipo = e.currentTarget.dataset.tipo;
                this.crearActividad(tipo);
            });
        });

        // Botón cancelar modal
        document.getElementById('btn-cancelar-tipo')?.addEventListener('click', () => {
            this.ocultarModalTipo();
        });

        // Botón agregar actividad
        document.getElementById('btn-agregar-actividad')?.addEventListener('click', () => {
            this.mostrarModalTipo();
        });

        console.log('✅ Event listeners configurados para ActividadManager');
    },

    // Mostrar modal de selección de tipo
    mostrarModalTipo() {
        const modal = document.getElementById('modal-tipo-actividad');
        if (modal) {
            modal.classList.remove('hidden');
            console.log('📱 Modal de tipos mostrado');
        }
    },

    // Ocultar modal de selección de tipo
    ocultarModalTipo() {
        const modal = document.getElementById('modal-tipo-actividad');
        if (modal) {
            modal.classList.add('hidden');
            console.log('📱 Modal de tipos ocultado');
        }
    },

    // Crear nueva actividad
    crearActividad(tipo) {
        console.log('🆕 Creando actividad de tipo:', tipo);
        this.ocultarModalTipo();
        
        let nuevaActividad;
        
        switch(tipo) {
            case 'seleccion_multiple':
                nuevaActividad = window.SeleccionMultipleManager?.crear();
                break;
            case 'verdadero_falso':
                nuevaActividad = window.VerdaderoFalsoManager?.crear();
                break;
            case 'completar_espacios':
                nuevaActividad = window.CompletarEspaciosManager?.crear();
                break;
            case 'emparejamiento':
                nuevaActividad = window.EmparejamientoManager?.crear();
                break;
            case 'escritura':
                nuevaActividad = window.EscrituraManager?.crear();
                break;
            default:
                console.error('❌ Tipo de actividad no soportado:', tipo);
                this.mostrarError('Tipo de actividad no disponible');
                return;
        }
        
        if (nuevaActividad) {
            // 🎯 Asegurar que el tipo esté en español para el frontend
            nuevaActividad.tipo = tipo;
            
            // 🎯 CORRECCIÓN CRÍTICA: Asegurar valores numéricos válidos
            this.asegurarValoresNumericos(nuevaActividad);
            
            this.agregarActividad(nuevaActividad);
        } else {
            console.error('❌ No se pudo crear actividad:', tipo);
            this.mostrarError('Error al crear la actividad');
        }
    },

    // 🎯 NUEVO MÉTODO: Asegurar valores numéricos válidos
    asegurarValoresNumericos(actividad) {
        // 🎯 CORREGIR ERROR: Valores undefined/NaN
        actividad.puntos = parseInt(actividad.puntos) || 10;
        actividad.orden = parseInt(actividad.orden) || 0;
        actividad.puntos_maximos = parseInt(actividad.puntos_maximos) || 10;
        
        // 🎯 Asegurar que config tenga valores válidos
        if (!actividad.config) {
            actividad.config = {};
        }
        if (actividad.config.tiempo_limite !== null && actividad.config.tiempo_limite !== undefined) {
            actividad.config.tiempo_limite = parseInt(actividad.config.tiempo_limite) || null;
        }
        actividad.config.intentos_permitidos = parseInt(actividad.config.intentos_permitidos) || 1;
        
        console.log('🔢 Valores numéricos asegurados para:', actividad.id, {
            puntos: actividad.puntos,
            orden: actividad.orden,
            puntos_maximos: actividad.puntos_maximos
        });
    },

    // Agregar actividad a la lista
    agregarActividad(actividad) {
        // 🎯 CORREGIDO: Convertir tipo si viene en formato Python
        actividad.tipo = this.convertirTipoParaFrontend(actividad.tipo);
        
        // 🎯 CORRECCIÓN: Asegurar valores antes de agregar
        this.asegurarValoresNumericos(actividad);
        
        actividad.orden = this.actividades.length + 1;
        this.actividades.push(actividad);
        
        if (window.leccionEditor) {
            window.leccionEditor.setActividades(this.actividades);
        }
        
        this.mostrarActividad(actividad);
        this.actualizarUI();
        
        // Mostrar mensaje de éxito
        const config = this.tipos[actividad.tipo];
        if (config) {
            if (this.actividades.length === 1) {
                this.mostrarExito('🎉 ¡Primera actividad creada! Sigue así.');
            } else {
                this.mostrarInfo(`➕ Actividad ${config.nombre} agregada`);
            }
        } else {
            console.warn('⚠️ Configuración no encontrada para tipo:', actividad.tipo);
            this.mostrarInfo('➕ Nueva actividad agregada');
        }
    },

    // 🎯 NUEVO: Convertir tipo de backend a frontend
    convertirTipoParaFrontend(tipo) {
        if (TIPO_ACTIVIDAD_MAPPING_INVERSO[tipo]) {
            return TIPO_ACTIVIDAD_MAPPING_INVERSO[tipo];
        }
        return tipo; // Si no está en el mapeo, mantener original
    },

    // Mostrar actividad en el editor
    mostrarActividad(actividad) {
        const lista = document.getElementById('lista-actividades');
        const placeholder = document.getElementById('placeholder-actividades');
        
        if (!lista) {
            console.error('❌ No se encontró la lista de actividades');
            return;
        }
        
        if (placeholder) {
            placeholder.style.display = 'none';
        }
        
        // 🎯 CORRECCIÓN CRÍTICA: Asegurar valores antes de mostrar
        this.asegurarValoresNumericos(actividad);
        
        const actividadHTML = this.generarHTMLActividad(actividad);
        lista.insertAdjacentHTML('beforeend', actividadHTML);
        
        // Animar entrada
        const nuevaActividad = document.querySelector(`[data-actividad-id="${actividad.id}"]`);
        if (nuevaActividad) {
            nuevaActividad.classList.add('animate-bounce-in');
        }

        console.log('✅ Actividad mostrada:', actividad.id, 'Tipo:', actividad.tipo);
    },

    // ✅ CORREGIDO: Generar HTML base para la actividad (CLASES COMPLETAS)
    generarHTMLActividad(actividad) {
        const config = this.tipos[actividad.tipo];
        if (!config) {
            console.error('❌ Configuración no encontrada para tipo:', actividad.tipo);
            return `
                <div class="actividad-item bg-white dark:bg-gray-800 rounded-xl p-6 border border-red-200 dark:border-red-700 shadow-sm mb-4" 
                     data-actividad-id="${activity.id}" data-tipo="${actividad.tipo}">
                    <div class="text-red-500 text-center py-4">
                        <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                        <p>Error: Tipo de actividad no válido</p>
                        <p class="text-sm">Tipo: ${actividad.tipo}</p>
                    </div>
                </div>
            `;
        }

        const { bgColor, textColor, badgeColor, icono, nombre } = config;
        
        // 🎯 CORRECCIÓN: Usar valores numéricos asegurados
        const puntos = actividad.puntos || 10;
        const orden = actividad.orden || 0;
        const tiempoLimite = actividad.config?.tiempo_limite || '';
        
        return `
            <div class="actividad-item expanded bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm mb-4" 
                 data-actividad-id="${actividad.id}" data-tipo="${actividad.tipo}">
                <div class="actividad-header flex items-center justify-between mb-4">
                    <div class="flex items-center gap-3">
                        <button type="button" onclick="ActividadManager.toggleExpandir('${actividad.id}')" 
                                class="btn-expandir text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors">
                            <i class="fas fa-chevron-down"></i>
                        </button>
                        <div class="w-10 h-10 ${bgColor} rounded-xl flex items-center justify-center">
                            <i class="fas fa-${icono} ${textColor}"></i>
                        </div>
                        <div class="flex-1">
                            <input type="text" value="${actividad.titulo}" 
                                   oninput="ActividadManager.actualizarTitulo('${actividad.id}', this.value)"
                                   class="text-lg font-semibold bg-transparent border-none focus:ring-0 p-0 text-gray-900 dark:text-white placeholder-gray-500 w-full"
                                   placeholder="Título de la actividad">
                            <p class="text-sm text-gray-600 dark:text-gray-400 capitalize">${nombre}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="px-3 py-1 text-sm ${badgeColor} rounded-full font-medium">
                            ${puntos} pts
                        </span>
                        <button type="button" onclick="ActividadManager.duplicar('${actividad.id}')" 
                                class="w-8 h-8 flex items-center justify-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors rounded hover:bg-blue-50 dark:hover:bg-blue-900/20" 
                                title="Duplicar">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button type="button" onclick="ActividadManager.eliminar('${actividad.id}')" 
                                class="w-8 h-8 flex items-center justify-center text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors rounded hover:bg-red-50 dark:hover:bg-red-900/20" 
                                title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="actividad-contenido">
                    <div class="editor-actividad">
                        ${this.generarCamposEspecificos(actividad)}
                        
                        <!-- Configuraciones comunes -->
                        <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Puntos</label>
                                    <input type="number" value="${puntos}" min="1" max="100"
                                           oninput="ActividadManager.actualizarPuntos('${actividad.id}', this.validity.valid ? parseInt(this.value) : ${puntos})"
                                           class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Orden</label>
                                    <input type="number" value="${orden}" min="1"
                                           oninput="ActividadManager.actualizarOrden('${actividad.id}', this.validity.valid ? parseInt(this.value) : ${orden})" 
                                           class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tiempo límite (seg)</label>
                                    <input type="number" value="${tiempoLimite}" 
                                           oninput="ActividadManager.actualizarTiempoLimite('${actividad.id}', this.value ? parseInt(this.value) : null)"
                                           class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                           placeholder="Ilimitado">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Delegar a los managers específicos
    generarCamposEspecificos(actividad) {
        const manager = this.getManagerForType(actividad.tipo);
        if (manager && manager.generarCampos) {
            return manager.generarCampos(actividad);
        }
        return '<p class="text-gray-500 text-center py-4">Módulo de actividad no disponible</p>';
    },

    getManagerForType(tipo) {
        const managers = {
            'seleccion_multiple': window.SeleccionMultipleManager,
            'verdadero_falso': window.VerdaderoFalsoManager,
            'completar_espacios': window.CompletarEspaciosManager,
            'emparejamiento': window.EmparejamientoManager,
            'escritura': window.EscrituraManager
        };
        return managers[tipo];
    },

    // Funciones comunes de gestión
    toggleExpandir(actividadId) {
        const elemento = document.querySelector(`[data-actividad-id="${actividadId}"]`);
        if (elemento) {
            const estaExpandido = elemento.classList.contains('expanded');
            elemento.classList.toggle('expanded', !estaExpandido);
            elemento.classList.toggle('collapsed', estaExpandido);
            
            const icono = elemento.querySelector('.btn-expandir i');
            if (icono) {
                icono.style.transform = estaExpandido ? 'rotate(-90deg)' : 'rotate(0deg)';
                icono.style.transition = 'transform 0.3s ease';
            }
        }
    },

    actualizarTitulo(actividadId, titulo) {
        const actividad = this.actividades.find(a => a.id === actividadId);
        if (actividad) {
            actividad.titulo = titulo;
        }
    },

    actualizarPuntos(actividadId, puntos) {
        const actividad = this.actividades.find(a => a.id === actividadId);
        if (actividad) {
            // 🎯 CORRECCIÓN: Validar y asegurar valor numérico
            const puntosValidados = parseInt(puntos) || 10;
            actividad.puntos = Math.max(1, Math.min(100, puntosValidados));
            
            // Actualizar UI inmediatamente
            const badge = document.querySelector(`[data-actividad-id="${actividadId}"] .px-3.py-1`);
            if (badge) {
                badge.textContent = `${actividad.puntos} pts`;
            }
        }
    },

    actualizarOrden(actividadId, orden) {
        const actividad = this.actividades.find(a => a.id === actividadId);
        if (actividad) {
            // 🎯 CORRECCIÓN: Validar y asegurar valor numérico
            actividad.orden = parseInt(orden) || 0;
        }
    },

    actualizarTiempoLimite(actividadId, tiempo) {
        const actividad = this.actividades.find(a => a.id === actividadId);
        if (actividad) {
            if (!actividad.config) actividad.config = {};
            // 🎯 CORRECCIÓN: Validar y asegurar valor numérico
            actividad.config.tiempo_limite = tiempo !== null ? parseInt(tiempo) || null : null;
        }
    },

    eliminar(actividadId) {
        if (!confirm('¿Estás seguro de que quieres eliminar esta actividad?')) return;
        
        this.actividades = this.actividades.filter(a => a.id !== actividadId);
        
        if (window.leccionEditor) {
            window.leccionEditor.setActividades(this.actividades);
        }
        
        const elemento = document.querySelector(`[data-actividad-id="${actividadId}"]`);
        if (elemento) {
            elemento.remove();
        }
        
        this.actualizarUI();
        this.mostrarExito('🗑️ Actividad eliminada');
    },

    duplicar(actividadId) {
        const original = this.actividades.find(a => a.id === actividadId);
        if (original) {
            const duplicado = JSON.parse(JSON.stringify(original));
            duplicado.id = 'actividad_' + Date.now();
            duplicado.titulo = original.titulo + ' (Copia)';
            duplicado.orden = this.actividades.length + 1;
            
            // 🎯 CORRECCIÓN: Asegurar valores del duplicado
            this.asegurarValoresNumericos(duplicado);
            
            this.agregarActividad(duplicado);
            this.mostrarInfo('📋 Actividad duplicada');
        }
    },

    recargarActividad(actividadId) {
        const actividad = this.actividades.find(a => a.id === actividadId);
        if (actividad) {
            const elemento = document.querySelector(`[data-actividad-id="${actividadId}"]`);
            if (elemento) {
                elemento.remove();
                this.mostrarActividad(actividad);
            }
        }
    },

    actualizarUI() {
        if (window.leccionEditor) {
            window.leccionEditor.actualizarContadorActividades();
            window.leccionEditor.actualizarProgreso();
            window.leccionEditor.marcarModuloCompletado('actividades');
        }
    },

    // 🆕 MÉTODO MEJORADO: Serializar para backend
    serializarParaBackend() {
        console.log('🔄 Serializando actividades para backend:', this.actividades);
        
        return this.actividades.map(actividad => {
            const configTipo = this.tipos[actividad.tipo];
            const tipoFinal = configTipo?.tipo_final || TIPO_ACTIVIDAD_MAPPING[actividad.tipo] || actividad.tipo;
            
            // 🎯 CORRECCIÓN: Asegurar valores antes de serializar
            this.asegurarValoresNumericos(actividad);
            
            // Estructura compatible con Python/backend
            const actividadSerializada = {
                id: actividad.id,
                tipo: tipoFinal, // 🎯 Tipo convertido
                titulo: actividad.titulo,
                descripcion: actividad.descripcion || "",
                contenido: this.prepararContenidoParaBackend(actividad),
                respuesta_correcta: this.prepararRespuestaParaBackend(actividad),
                puntos_maximos: actividad.puntos || actividad.puntos_maximos || 10,
                orden: actividad.orden || 0,
                estado: actividad.estado || 'activo',
                // 🎯 Campos específicos para cada tipo
                explicacion: actividad.contenido?.explicacion || "",
                tiempo_limite: actividad.config?.tiempo_limite || null,
                intentos_permitidos: actividad.config?.intentos_permitidos || 1
            };

            console.log(`✅ Actividad ${actividad.id} serializada:`, actividadSerializada);
            return actividadSerializada;
        });
    },

    // 🆕 Preparar contenido según el tipo de actividad
    prepararContenidoParaBackend(actividad) {
        console.log(`🔄 Preparando contenido para ${actividad.tipo}:`, actividad.contenido);

        let contenidoPreparado = {};

        switch(actividad.tipo) {
            case 'seleccion_multiple':
                contenidoPreparado = {
                    pregunta: actividad.contenido?.pregunta || actividad.titulo,
                    opciones: actividad.contenido?.opciones || [],
                    explicacion: actividad.contenido?.explicacion || ""
                };
                break;
                
            case 'completar_espacios':
                contenidoPreparado = {
                    texto: actividad.contenido?.texto || "",
                    espacios: actividad.contenido?.palabras_faltantes || actividad.contenido?.espacios || [],
                    explicacion: actividad.contenido?.explicacion || ""
                };
                break;
                
            case 'emparejamiento':
                contenidoPreparado = {
                    pares: actividad.contenido?.pares || [],
                    instrucciones: actividad.contenido?.instrucciones || "Empareja cada elemento con su correspondiente",
                    explicacion: actividad.contenido?.explicacion || ""
                };
                break;
                
            case 'verdadero_falso':
                contenidoPreparado = {
                    afirmaciones: actividad.contenido?.afirmaciones || [],
                    explicacion: actividad.contenido?.explicacion || ""
                };
                break;
                
            case 'escritura':
                contenidoPreparado = {
                    consigna: actividad.contenido?.consigna || actividad.titulo,
                    placeholder: actividad.contenido?.placeholder || "Escribe tu respuesta...",
                    palabras_minimas: actividad.contenido?.palabras_minimas || 20,
                    explicacion: actividad.contenido?.explicacion || ""
                };
                break;
                
            default:
                contenidoPreparado = actividad.contenido || {};
                console.warn(`⚠️ Tipo no reconocido: ${actividad.tipo}, usando contenido original`);
        }

        console.log(`✅ Contenido preparado para ${actividad.tipo}:`, contenidoPreparado);
        return contenidoPreparado;
    },

    // 🆕 Preparar respuesta correcta según el tipo
    prepararRespuestaParaBackend(actividad) {
        console.log(`🔄 Preparando respuesta para ${actividad.tipo}:`, actividad.respuesta_correcta);

        let respuestaPreparada = {};

        switch(actividad.tipo) {
            case 'seleccion_multiple':
                respuestaPreparada = {
                    respuestas: actividad.respuesta_correcta?.respuestas || [0],
                    tipo: "indices"
                };
                break;
                
            case 'completar_espacios':
                respuestaPreparada = {
                    respuestas: actividad.contenido?.palabras_faltantes || actividad.contenido?.espacios || [],
                    tipo: "palabras"
                };
                break;
                
            case 'emparejamiento':
                const pares = actividad.contenido?.pares || [];
                respuestaPreparada = {
                    respuestas: pares.map((par, index) => index),
                    tipo: "pares_ordenados"
                };
                break;
                
            case 'verdadero_falso':
                respuestaPreparada = {
                    respuestas: actividad.respuesta_correcta?.respuestas || [],
                    tipo: "booleanos"
                };
                break;
                
            case 'escritura':
                respuestaPreparada = {
                    tipo: "evaluacion_manual",
                    criterios: actividad.respuesta_correcta?.criterios || ["Claridad", "Precisión", "Coherencia"]
                };
                break;
                
            default:
                respuestaPreparada = actividad.respuesta_correcta || {};
                console.warn(`⚠️ Tipo no reconocido para respuesta: ${actividad.tipo}, usando respuesta original`);
        }

        console.log(`✅ Respuesta preparada para ${actividad.tipo}:`, respuestaPreparada);
        return respuestaPreparada;
    },

    // 🆕 Método para validar todas las actividades antes de guardar
    validarActividades() {
        const errores = [];
        
        if (this.actividades.length === 0) {
            errores.push('Debe agregar al menos una actividad');
            return errores;
        }

        this.actividades.forEach((actividad, index) => {
            const erroresActividad = this.validarActividad(actividad, index);
            errores.push(...erroresActividad);
        });

        return errores;
    },

    // 🆕 Validar actividad individual
    validarActividad(actividad, index) {
        const errores = [];
        const numeroActividad = index + 1;

        if (!actividad.titulo || !actividad.titulo.trim()) {
            errores.push(`Actividad ${numeroActividad}: El título es requerido`);
        }

        if (actividad.puntos < 1 || actividad.puntos > 100) {
            errores.push(`Actividad ${numeroActividad}: Los puntos deben estar entre 1 y 100`);
        }

        // Validaciones específicas por tipo
        switch(actividad.tipo) {
            case 'seleccion_multiple':
                if (!actividad.contenido?.pregunta) {
                    errores.push(`Actividad ${numeroActividad}: La pregunta es requerida`);
                }
                if (!actividad.contenido?.opciones || actividad.contenido.opciones.length < 2) {
                    errores.push(`Actividad ${numeroActividad}: Debe tener al menos 2 opciones`);
                }
                break;
                
            case 'completar_espacios':
                if (!actividad.contenido?.texto) {
                    errores.push(`Actividad ${numeroActividad}: El texto es requerido`);
                }
                if (!actividad.contenido?.palabras_faltantes || actividad.contenido.palabras_faltantes.length === 0) {
                    errores.push(`Actividad ${numeroActividad}: Debe tener al menos un espacio para completar`);
                }
                break;
                
            case 'emparejamiento':
                if (!actividad.contenido?.pares || actividad.contenido.pares.length < 2) {
                    errores.push(`Actividad ${numeroActividad}: Debe tener al menos 2 pares para emparejar`);
                }
                break;
                
            case 'verdadero_falso':
                if (!actividad.contenido?.afirmaciones || actividad.contenido.afirmaciones.length === 0) {
                    errores.push(`Actividad ${numeroActividad}: Debe tener al menos una afirmación`);
                }
                break;
                
            case 'escritura':
                if (!actividad.contenido?.consigna) {
                    errores.push(`Actividad ${numeroActividad}: La consigna es requerida`);
                }
                break;
        }

        return errores;
    },

    // Métodos de utilidad para mostrar mensajes
    mostrarExito(mensaje) {
        if (window.leccionEditor) {
            window.leccionEditor.mostrarToast(mensaje, 'success');
        } else if (window.toastManager) {
            window.toastManager.success(mensaje);
        } else {
            console.log('✅', mensaje);
        }
    },

    mostrarInfo(mensaje) {
        if (window.leccionEditor) {
            window.leccionEditor.mostrarToast(mensaje, 'info');
        } else if (window.toastManager) {
            window.toastManager.info(mensaje);
        } else {
            console.log('ℹ️', mensaje);
        }
    },

    mostrarError(mensaje) {
        if (window.leccionEditor) {
            window.leccionEditor.mostrarToast(mensaje, 'error');
        } else if (window.toastManager) {
            window.toastManager.error(mensaje);
        } else {
            console.error('❌', mensaje);
        }
    }
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🚀 Inicializando ActividadManager...');
        setTimeout(() => {
            window.ActividadManager.init();
        }, 100);
    });
} else {
    console.log('🚀 Inicializando ActividadManager (DOM ya listo)...');
    setTimeout(() => {
        window.ActividadManager.init();
    }, 100);
}

// 🆕 Hacer disponible el mapeo globalmente para otros módulos
window.TIPO_ACTIVIDAD_MAPPING = TIPO_ACTIVIDAD_MAPPING;
window.TIPO_ACTIVIDAD_MAPPING_INVERSO = TIPO_ACTIVIDAD_MAPPING_INVERSO;

console.log('✅ actividad-base.js cargado con compatibilidad para Python/backend');