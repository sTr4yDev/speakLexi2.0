/* ============================================
   SPEAKLEXI - EDITOR LECCIÓN - ESCRITURA
   Archivo: assets/js/pages/admin/editor-leccion/actividades/escritura.js
   ============================================ */

// Manager específico para actividades de escritura
window.EscrituraManager = {
    crear() {
        return {
            id: 'actividad_' + Date.now(),
            tipo: 'escritura',
            titulo: 'Nueva Actividad Escritura',
            puntos: 10,
            orden: 0,
            contenido: {
                consigna: "",
                longitud_minima: 50,
                tiempo_sugerido: 10,
                criterios: [],
                ejemplo_respuesta: "",
                explicacion: "",
                imagen: null
            },
            config: {
                tiempo_limite: null,
                intentos_permitidos: 1,
                mostrar_explicacion: true
            }
        };
    },

    generarCampos(actividad) {
        const tieneImagen = actividad.contenido.imagen;
        const criterios = actividad.contenido.criterios || [];
        
        return `
            <div class="space-y-4">
                <!-- Imagen de consigna -->
                <div class="campo-actividad">
                    <label class="flex items-center justify-between">
                        <span>Imagen de referencia (Opcional)</span>
                        ${tieneImagen ? `
                            <button type="button" onclick="EscrituraManager.eliminarImagen('${actividad.id}')" 
                                    class="text-red-500 hover:text-red-700 text-sm">
                                <i class="fas fa-trash mr-1"></i>Eliminar
                            </button>
                        ` : ''}
                    </label>
                    ${tieneImagen ? `
                        <div class="preview-imagen">
                            <img src="${actividad.contenido.imagen.url}" alt="Imagen de consigna" class="max-h-48 mx-auto">
                            <button type="button" onclick="EscrituraManager.eliminarImagen('${actividad.id}')" 
                                    class="btn-eliminar-imagen">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    ` : `
                        <div class="flex gap-2">
                            <button type="button" onclick="EscrituraManager.agregarImagen('${actividad.id}')"
                                    class="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                <i class="fas fa-image mr-2"></i>Subir Imagen
                            </button>
                        </div>
                    `}
                </div>

                <!-- Consigna -->
                <div class="campo-actividad">
                    <label>Consigna de Escritura *</label>
                    <div class="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 mb-3">
                        <p class="text-sm text-indigo-700 dark:text-indigo-300">
                            ✍️ <strong>Tip:</strong> Escribe una consigna clara que guíe al estudiante.
                        </p>
                    </div>
                    <textarea oninput="EscrituraManager.actualizarConsigna('${actividad.id}', this.value)"
                              class="w-full h-32"
                              placeholder="Ej: Escribe un párrafo de al menos 100 palabras describiendo tu rutina diaria...">${actividad.contenido.consigna}</textarea>
                </div>

                <!-- Configuración de escritura -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Longitud Mínima (palabras)
                        </label>
                        <input type="number" value="${actividad.contenido.longitud_minima}" min="1" max="1000"
                               oninput="EscrituraManager.actualizarLongitud('${actividad.id}', parseInt(this.value))"
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Tiempo Sugerido (minutos)
                        </label>
                        <input type="number" value="${actividad.contenido.tiempo_sugerido || 10}" min="1" max="120"
                               oninput="EscrituraManager.actualizarTiempo('${actividad.id}', parseInt(this.value))"
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                               placeholder="Tiempo sugerido">
                    </div>
                </div>

                <!-- Criterios de evaluación -->
                <div class="campo-actividad">
                    <label class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Criterios de Evaluación</span>
                        <button type="button" onclick="EscrituraManager.agregarCriterio('${actividad.id}')" 
                                class="text-xs text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300">
                            <i class="fas fa-plus mr-1"></i>Agregar Criterio
                        </button>
                    </label>
                    
                    <div class="space-y-2" id="criterios-escritura-${actividad.id}">
                        ${criterios.length > 0 ? 
                            criterios.map((criterio, index) => this.generarCriterioHTML(actividad.id, criterio, index)).join('') 
                        : this.generarPlaceholderCriterios()}
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Los criterios ayudan a los estudiantes a entender cómo serán evaluados
                    </p>
                </div>

                <!-- Ejemplo de respuesta -->
                <div class="campo-actividad">
                    <label>Ejemplo de Respuesta (Opcional)</label>
                    <textarea oninput="EscrituraManager.actualizarEjemplo('${actividad.id}', this.value)"
                              class="w-full h-24"
                              placeholder="Proporciona un ejemplo de una buena respuesta...">${actividad.contenido.ejemplo_respuesta}</textarea>
                </div>

                <!-- Retroalimentación -->
                <div class="campo-actividad">
                    <label>Retroalimentación General (Opcional)</label>
                    <textarea oninput="EscrituraManager.actualizarExplicacion('${actividad.id}', this.value)"
                              class="w-full h-16"
                              placeholder="Retroalimentación que recibirá el estudiante...">${actividad.contenido.explicacion}</textarea>
                </div>
            </div>
        `;
    },

    generarCriterioHTML(actividadId, criterio, index) {
        return `
            <div class="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-700">
                <input type="text" value="${criterio}" 
                       oninput="EscrituraManager.actualizarCriterio('${actividadId}', ${index}, this.value)"
                       class="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm"
                       placeholder="Ej: Uso correcto del vocabulario">
                <button type="button" onclick="EscrituraManager.eliminarCriterio('${actividadId}', ${index})"
                        class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    },

    generarPlaceholderCriterios() {
        return `
            <div class="text-center py-3 text-gray-500 dark:text-gray-400 text-sm">
                <i class="fas fa-clipboard-list mr-2"></i>
                No hay criterios definidos
            </div>
        `;
    },

    // Funciones de gestión de criterios
    agregarCriterio(actividadId) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            if (!actividad.contenido.criterios) {
                actividad.contenido.criterios = [];
            }
            
            actividad.contenido.criterios.push("");
            window.leccionEditor.recargarActividad(actividadId);
        }
    },

    eliminarCriterio(actividadId, index) {
        const actividad = this.getActividad(actividadId);
        if (actividad && actividad.contenido.criterios) {
            actividad.contenido.criterios.splice(index, 1);
            window.leccionEditor.recargarActividad(actividadId);
        }
    },

    actualizarCriterio(actividadId, index, valor) {
        const actividad = this.getActividad(actividadId);
        if (actividad && actividad.contenido.criterios) {
            actividad.contenido.criterios[index] = valor;
        }
    },

    // Funciones de gestión de contenido
    actualizarConsigna(actividadId, consigna) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.contenido.consigna = consigna;
        }
    },

    actualizarLongitud(actividadId, longitud) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.contenido.longitud_minima = longitud;
        }
    },

    actualizarTiempo(actividadId, tiempo) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.contenido.tiempo_sugerido = tiempo;
        }
    },

    actualizarEjemplo(actividadId, ejemplo) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.contenido.ejemplo_respuesta = ejemplo;
        }
    },

    actualizarExplicacion(actividadId, explicacion) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.contenido.explicacion = explicacion;
        }
    },

    // Funciones de gestión de imágenes
    agregarImagen(actividadId) {
        window.currentImageContext = { actividadId, tipoCampo: 'pregunta' };
        this.abrirSelectorImagen();
    },

    eliminarImagen(actividadId) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.contenido.imagen = null;
            window.leccionEditor.recargarActividad(actividadId);
        }
    },

    // Helper functions
    getActividad(actividadId) {
        return window.leccionEditor.getActividades().find(a => a.id === actividadId);
    },

    abrirSelectorImagen() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => this.manejarSeleccionImagen(e.target.files[0]);
        input.click();
    },

    async manejarSeleccionImagen(file) {
        if (!window.currentImageContext || !file) return;

        const imagenData = {
            id: 'temp_' + Date.now(),
            url: URL.createObjectURL(file),
            nombre: file.name,
            tipo: file.type,
            tamaño: file.size
        };

        this.asignarImagenSegunContexto(imagenData);
        window.leccionEditor.mostrarToast('✅ Imagen agregada (modo desarrollo)', 'success');
    },

    asignarImagenSegunContexto(imagenData) {
        const { actividadId, tipoCampo } = window.currentImageContext;

        if (tipoCampo === 'pregunta') {
            const actividad = this.getActividad(actividadId);
            if (actividad) {
                actividad.contenido.imagen = imagenData;
            }
        }

        window.leccionEditor.recargarActividad(actividadId);
    }
};