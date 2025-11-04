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

// Manager global de actividades
window.ActividadManager = {
    actividades: [],
    
    // Tipos de actividad disponibles
    tipos: {
        seleccion_multiple: {
            nombre: "Selección Múltiple",
            icono: "list-ul",
            color: "blue",
            puedeImagenes: true
        },
        verdadero_falso: {
            nombre: "Verdadero/Falso",
            icono: "check-circle", 
            color: "green",
            puedeImagenes: true
        },
        completar_espacios: {
            nombre: "Completar Espacios",
            icono: "edit",
            color: "yellow",
            puedeImagenes: true
        },
        emparejamiento: {
            nombre: "Emparejamiento",
            icono: "object-group",
            color: "purple",
            puedeImagenes: true
        },
        escritura: {
            nombre: "Escritura",
            icono: "keyboard",
            color: "indigo",
            puedeImagenes: true
        }
    },

    // Inicializar el manager
    init() {
        this.actividades = window.leccionEditor.getActividades();
        this.setupEventListeners();
    },

    setupEventListeners() {
        // Event listeners para los tipos de actividad
        document.querySelectorAll('.tipo-actividad-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const tipo = e.currentTarget.dataset.tipo;
                this.crearActividad(tipo);
            });
        });
    },

    // Mostrar modal de selección de tipo
    mostrarModalTipo() {
        document.getElementById('modal-tipo-actividad').classList.remove('hidden');
    },

    // Ocultar modal de selección de tipo
    ocultarModalTipo() {
        document.getElementById('modal-tipo-actividad').classList.add('hidden');
    },

    // Crear nueva actividad
    crearActividad(tipo) {
        this.ocultarModalTipo();
        
        let nuevaActividad;
        
        switch(tipo) {
            case 'seleccion_multiple':
                if (window.SeleccionMultipleManager) {
                    nuevaActividad = window.SeleccionMultipleManager.crear();
                }
                break;
            case 'verdadero_falso':
                if (window.VerdaderoFalsoManager) {
                    nuevaActividad = window.VerdaderoFalsoManager.crear();
                }
                break;
            case 'completar_espacios':
                if (window.CompletarEspaciosManager) {
                    nuevaActividad = window.CompletarEspaciosManager.crear();
                }
                break;
            case 'emparejamiento':
                if (window.EmparejamientoManager) {
                    nuevaActividad = window.EmparejamientoManager.crear();
                }
                break;
            case 'escritura':
                if (window.EscrituraManager) {
                    nuevaActividad = window.EscrituraManager.crear();
                }
                break;
            default:
                console.error('Tipo de actividad no soportado:', tipo);
                return;
        }
        
        if (nuevaActividad) {
            this.agregarActividad(nuevaActividad);
        }
    },

    // Agregar actividad a la lista
    agregarActividad(actividad) {
        actividad.orden = this.actividades.length + 1;
        this.actividades.push(actividad);
        window.leccionEditor.setActividades(this.actividades);
        
        this.mostrarActividad(actividad);
        this.actualizarUI();
        
        // Mostrar mensaje de éxito
        const config = this.tipos[actividad.tipo];
        if (this.actividades.length === 1) {
            window.leccionEditor.mostrarToast('🎉 ¡Primera actividad creada! Sigue así.', 'success');
        } else {
            window.leccionEditor.mostrarToast(`➕ Actividad ${config.nombre} agregada`, 'info');
        }
    },

    // Mostrar actividad en el editor
    mostrarActividad(actividad) {
        const lista = document.getElementById('lista-actividades');
        const placeholder = document.getElementById('placeholder-actividades');
        
        if (placeholder) {
            placeholder.style.display = 'none';
        }
        
        const actividadHTML = this.generarHTMLActividad(actividad);
        lista.insertAdjacentHTML('beforeend', actividadHTML);
        
        // Inicializar componentes específicos
        this.inicializarComponentesActividad(actividad.id);
        
        // Animar entrada
        const nuevaActividad = document.querySelector(`[data-actividad-id="${actividad.id}"]`);
        if (nuevaActividad) {
            nuevaActividad.classList.add('animate-bounce-in');
        }
    },

    // Generar HTML base para la actividad
    generarHTMLActividad(actividad) {
        const config = this.tipos[actividad.tipo];
        const color = config.color;
        const icono = config.icono;
        
        return `
            <div class="actividad-item expanded" data-actividad-id="${actividad.id}" data-tipo="${actividad.tipo}">
                <div class="actividad-header">
                    <div class="flex items-center gap-3">
                        <button type="button" onclick="ActividadManager.toggleExpandir('${actividad.id}')" 
                                class="btn-expandir text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                            <i class="fas fa-chevron-down"></i>
                        </button>
                        <div class="w-10 h-10 bg-${color}-100 dark:bg-${color}-900/30 rounded-xl flex items-center justify-center">
                            <i class="fas fa-${icono} text-${color}-600 dark:text-${color}-400"></i>
                        </div>
                        <div class="flex-1">
                            <input type="text" value="${actividad.titulo}" 
                                   oninput="ActividadManager.actualizarTitulo('${actividad.id}', this.value)"
                                   class="text-lg font-semibold bg-transparent border-none focus:ring-0 p-0 text-gray-900 dark:text-white placeholder-gray-500"
                                   placeholder="Título de la actividad">
                            <p class="text-sm text-gray-600 dark:text-gray-400 capitalize">${config.nombre}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="px-2 py-1 text-xs bg-${color}-100 dark:bg-${color}-900/30 text-${color}-600 dark:text-${color}-400 rounded-full">
                            ${actividad.puntos} pts
                        </span>
                        <button type="button" onclick="ActividadManager.duplicar('${actividad.id}')" 
                                class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors" title="Duplicar">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button type="button" onclick="ActividadManager.eliminar('${actividad.id}')" 
                                class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="actividad-contenido mt-4">
                    <div class="editor-actividad">
                        ${this.generarCamposEspecificos(actividad)}
                        
                        <!-- Configuraciones comunes -->
                        <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div class="grid grid-cols-3 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Puntos</label>
                                    <input type="number" value="${actividad.puntos}" min="1" max="100"
                                           oninput="ActividadManager.actualizarPuntos('${actividad.id}', parseInt(this.value))"
                                           class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Orden</label>
                                    <input type="number" value="${actividad.orden}" min="1"
                                           oninput="ActividadManager.actualizarOrden('${actividad.id}', parseInt(this.value))" 
                                           class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tiempo (min)</label>
                                    <input type="number" value="${actividad.config.tiempo_limite || ''}" 
                                           oninput="ActividadManager.actualizarTiempoLimite('${actividad.id}', this.value ? parseInt(this.value) : null)"
                                           class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
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
        switch(actividad.tipo) {
            case 'seleccion_multiple':
                return window.SeleccionMultipleManager ? 
                    window.SeleccionMultipleManager.generarCampos(actividad) : 
                    '<p class="text-gray-500">Módulo de selección múltiple no cargado</p>';
            case 'verdadero_falso':
                return window.VerdaderoFalsoManager ? 
                    window.VerdaderoFalsoManager.generarCampos(actividad) : 
                    '<p class="text-gray-500">Módulo de verdadero/falso no cargado</p>';
            case 'completar_espacios':
                return window.CompletarEspaciosManager ? 
                    window.CompletarEspaciosManager.generarCampos(actividad) : 
                    '<p class="text-gray-500">Módulo de completar espacios no cargado</p>';
            case 'emparejamiento':
                return window.EmparejamientoManager ? 
                    window.EmparejamientoManager.generarCampos(actividad) : 
                    '<p class="text-gray-500">Módulo de emparejamiento no cargado</p>';
            case 'escritura':
                return window.EscrituraManager ? 
                    window.EscrituraManager.generarCampos(actividad) : 
                    '<p class="text-gray-500">Módulo de escritura no cargado</p>';
            default:
                return '<p class="text-gray-500">Tipo de actividad no soportado</p>';
        }
    },

    // Funciones comunes de gestión
    toggleExpandir(actividadId) {
        const elemento = document.querySelector(`[data-actividad-id="${actividadId}"]`);
        if (elemento) {
            elemento.classList.toggle('expanded');
            elemento.classList.toggle('collapsed');
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
            actividad.puntos = puntos;
        }
    },

    actualizarOrden(actividadId, orden) {
        const actividad = this.actividades.find(a => a.id === actividadId);
        if (actividad) {
            actividad.orden = orden;
        }
    },

    actualizarTiempoLimite(actividadId, tiempo) {
        const actividad = this.actividades.find(a => a.id === actividadId);
        if (actividad) {
            actividad.config.tiempo_limite = tiempo;
        }
    },

    eliminar(actividadId) {
        if (!confirm('¿Estás seguro de que quieres eliminar esta actividad?')) return;
        
        this.actividades = this.actividades.filter(a => a.id !== actividadId);
        window.leccionEditor.setActividades(this.actividades);
        
        const elemento = document.querySelector(`[data-actividad-id="${actividadId}"]`);
        if (elemento) {
            elemento.remove();
        }
        
        this.actualizarUI();
        window.leccionEditor.mostrarToast('🗑️ Actividad eliminada', 'success');
    },

    duplicar(actividadId) {
        const original = this.actividades.find(a => a.id === actividadId);
        if (original) {
            const duplicado = JSON.parse(JSON.stringify(original));
            duplicado.id = 'actividad_' + Date.now();
            duplicado.titulo = original.titulo + ' (Copia)';
            duplicado.orden = this.actividades.length + 1;
            
            this.agregarActividad(duplicado);
            window.leccionEditor.mostrarToast('📋 Actividad duplicada', 'info');
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

    inicializarComponentesActividad(actividadId) {
        // Los managers específicos pueden sobrescribir esto
    },

    actualizarUI() {
        window.leccionEditor.actualizarContadorActividades();
        window.leccionEditor.actualizarProgreso();
        window.leccionEditor.marcarModuloCompletado('actividades');
    }
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.ActividadManager.init();
    });
} else {
    window.ActividadManager.init();
}