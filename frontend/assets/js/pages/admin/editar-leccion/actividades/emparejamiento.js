/* ============================================
   SPEAKLEXI - EDITOR LECCIÓN - EMPAREJAMIENTO
   Archivo: assets/js/pages/admin/editor-leccion/actividades/emparejamiento.js
   ============================================ */

// Manager específico para actividades de emparejamiento
window.EmparejamientoManager = {
    crear() {
        return {
            id: 'actividad_' + Date.now(),
            tipo: 'emparejamiento',
            titulo: 'Nueva Actividad Emparejamiento',
            puntos: 10,
            orden: 0,
            contenido: {
                instrucciones: "Empareja cada elemento con su correspondiente",
                pares: [
                    { id: 1, izquierda: "", derecha: "", imagen_izquierda: null, imagen_derecha: null },
                    { id: 2, izquierda: "", derecha: "", imagen_izquierda: null, imagen_derecha: null }
                ],
                explicacion: ""
            },
            config: {
                tiempo_limite: null,
                intentos_permitidos: 1,
                mostrar_explicacion: true
            }
        };
    },

    generarCampos(actividad) {
        const pares = actividad.contenido.pares || [];
        
        return `
            <div class="space-y-4">
                <!-- Instrucciones -->
                <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <p class="text-sm text-purple-700 dark:text-purple-300">
                        💡 <strong>Instrucciones:</strong> Crea pares de elementos que los estudiantes deben emparejar.
                    </p>
                </div>

                <!-- Configuración general -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Instrucciones para el estudiante
                        </label>
                        <input type="text" value="${actividad.contenido.instrucciones}" 
                               oninput="EmparejamientoManager.actualizarInstrucciones('${actividad.id}', this.value)"
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                               placeholder="Instrucciones para el estudiante">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Número mínimo de pares
                        </label>
                        <input type="number" value="2" min="2" max="10" 
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                               disabled>
                    </div>
                </div>

                <!-- Lista de Pares -->
                <div class="campo-actividad">
                    <label class="flex items-center justify-between mb-3">
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Pares de Emparejamiento</span>
                        <span class="text-xs text-gray-500 dark:text-gray-400">${pares.length} pares creados</span>
                    </label>
                    
                    <div class="space-y-4" id="pares-emparejamiento-${actividad.id}">
                        ${pares.length > 0 ? 
                            pares.map((par, index) => this.generarParHTML(actividad.id, par, index)).join('') 
                        : this.generarPlaceholderPares()}
                    </div>
                    
                    <button type="button" onclick="EmparejamientoManager.agregarPar('${actividad.id}')" 
                            class="btn-agregar-opcion mt-4">
                        <i class="fas fa-plus"></i>
                        Agregar Par de Emparejamiento
                    </button>
                </div>

                <!-- Explicación -->
                <div class="campo-actividad">
                    <label>Explicación (Opcional)</label>
                    <textarea oninput="EmparejamientoManager.actualizarExplicacion('${actividad.id}', this.value)"
                              class="w-full h-16"
                              placeholder="Explica la relación entre los elementos...">${actividad.contenido.explicacion}</textarea>
                </div>
            </div>
        `;
    },

    generarParHTML(actividadId, par, index) {
        return `
            <div class="par-item bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600" data-par-id="${par.id}">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Par #${index + 1}</span>
                    <div class="flex gap-2">
                        <button type="button" onclick="EmparejamientoManager.moverPar('${actividadId}', ${par.id}, -1)"
                                class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 ${index === 0 ? 'invisible' : ''}">
                            <i class="fas fa-arrow-up"></i>
                        </button>
                        <button type="button" onclick="EmparejamientoManager.moverPar('${actividadId}', ${par.id}, 1)" 
                                class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 ${index === this.getActividad(actividadId).contenido.pares.length - 1 ? 'invisible' : ''}">
                            <i class="fas fa-arrow-down"></i>
                        </button>
                        <button type="button" onclick="EmparejamientoManager.eliminarPar('${actividadId}', ${par.id})"
                                class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                
                <div class="grid md:grid-cols-2 gap-4">
                    <!-- Columna Izquierda -->
                    <div class="space-y-3">
                        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400">Elemento Izquierdo *</label>
                        
                        ${par.imagen_izquierda ? `
                            <div class="preview-imagen">
                                <img src="${par.imagen_izquierda.url}" alt="Imagen izquierda" class="max-h-24 mx-auto">
                                <button type="button" onclick="EmparejamientoManager.eliminarImagenPar('${actividadId}', ${par.id}, 'izquierda')" 
                                        class="btn-eliminar-imagen">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        ` : ''}
                        
                        <textarea oninput="EmparejamientoManager.actualizarPar('${actividadId}', ${par.id}, 'izquierda', this.value)"
                                  class="w-full h-20 text-sm"
                                  placeholder="Texto del elemento izquierdo...">${par.izquierda || ''}</textarea>
                        
                        <div class="flex gap-2 justify-center">
                            <button type="button" onclick="EmparejamientoManager.agregarImagenPar('${actividadId}', ${par.id}, 'izquierda')"
                                    class="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                <i class="fas fa-image mr-1"></i>${par.imagen_izquierda ? 'Cambiar' : 'Agregar'} Imagen
                            </button>
                        </div>
                    </div>
                    
                    <!-- Columna Derecha -->
                    <div class="space-y-3">
                        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400">Elemento Derecho *</label>
                        
                        ${par.imagen_derecha ? `
                            <div class="preview-imagen">
                                <img src="${par.imagen_derecha.url}" alt="Imagen derecha" class="max-h-24 mx-auto">
                                <button type="button" onclick="EmparejamientoManager.eliminarImagenPar('${actividadId}', ${par.id}, 'derecha')" 
                                        class="btn-eliminar-imagen">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        ` : ''}
                        
                        <textarea oninput="EmparejamientoManager.actualizarPar('${actividadId}', ${par.id}, 'derecha', this.value)"
                                  class="w-full h-20 text-sm"
                                  placeholder="Texto del elemento derecho...">${par.derecha || ''}</textarea>
                        
                        <div class="flex gap-2 justify-center">
                            <button type="button" onclick="EmparejamientoManager.agregarImagenPar('${actividadId}', ${par.id}, 'derecha')"
                                    class="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                <i class="fas fa-image mr-1"></i>${par.imagen_derecha ? 'Cambiar' : 'Agregar'} Imagen
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    generarPlaceholderPares() {
        return `
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                <i class="fas fa-object-group text-3xl mb-3 opacity-50"></i>
                <p>No hay pares creados</p>
                <p class="text-sm">Agrega tu primer par de emparejamiento</p>
            </div>
        `;
    },

    // Funciones de gestión de pares
    agregarPar(actividadId) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            if (!actividad.contenido.pares) {
                actividad.contenido.pares = [];
            }
            
            const nuevoPar = {
                id: Date.now() + Math.random(),
                izquierda: "",
                derecha: "",
                imagen_izquierda: null,
                imagen_derecha: null
            };
            
            actividad.contenido.pares.push(nuevoPar);
            window.leccionEditor.recargarActividad(actividadId);
            window.leccionEditor.mostrarToast('➕ Nuevo par agregado', 'info');
        }
    },

    eliminarPar(actividadId, parId) {
        const actividad = this.getActividad(actividadId);
        if (actividad && actividad.contenido.pares) {
            actividad.contenido.pares = actividad.contenido.pares.filter(p => p.id !== parId);
            window.leccionEditor.recargarActividad(actividadId);
        }
    },

    moverPar(actividadId, parId, direccion) {
        const actividad = this.getActividad(actividadId);
        if (actividad && actividad.contenido.pares) {
            const index = actividad.contenido.pares.findIndex(p => p.id === parId);
            const nuevoIndex = index + direccion;
            
            if (nuevoIndex >= 0 && nuevoIndex < actividad.contenido.pares.length) {
                const [par] = actividad.contenido.pares.splice(index, 1);
                actividad.contenido.pares.splice(nuevoIndex, 0, par);
                window.leccionEditor.recargarActividad(actividadId);
            }
        }
    },

    actualizarPar(actividadId, parId, campo, valor) {
        const actividad = this.getActividad(actividadId);
        if (actividad && actividad.contenido.pares) {
            const par = actividad.contenido.pares.find(p => p.id === parId);
            if (par) {
                par[campo] = valor;
            }
        }
    },

    // Funciones de gestión de imágenes
    agregarImagenPar(actividadId, parId, lado) {
        window.currentImageContext = { 
            actividadId, 
            parId, 
            lado, 
            tipo: 'par',
            elemento: 'emparejamiento'
        };
        this.abrirSelectorImagen();
    },

    eliminarImagenPar(actividadId, parId, lado) {
        const actividad = this.getActividad(actividadId);
        if (actividad && actividad.contenido.pares) {
            const par = actividad.contenido.pares.find(p => p.id === parId);
            if (par) {
                if (lado === 'izquierda') {
                    par.imagen_izquierda = null;
                } else {
                    par.imagen_derecha = null;
                }
                window.leccionEditor.recargarActividad(actividadId);
            }
        }
    },

    // Funciones de gestión de contenido
    actualizarInstrucciones(actividadId, instrucciones) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.contenido.instrucciones = instrucciones;
        }
    },

    actualizarExplicacion(actividadId, explicacion) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.contenido.explicacion = explicacion;
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
        const { actividadId, parId, lado, elemento } = window.currentImageContext;

        if (elemento === 'emparejamiento') {
            const actividad = this.getActividad(actividadId);
            if (actividad && actividad.contenido.pares) {
                const par = actividad.contenido.pares.find(p => p.id === parId);
                if (par) {
                    if (lado === 'izquierda') {
                        par.imagen_izquierda = imagenData;
                    } else {
                        par.imagen_derecha = imagenData;
                    }
                }
            }
        }

        window.leccionEditor.recargarActividad(actividadId);
    }
};