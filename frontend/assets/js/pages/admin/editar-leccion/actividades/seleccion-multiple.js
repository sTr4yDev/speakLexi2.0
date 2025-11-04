// Manager específico para actividades de selección múltiple
window.SeleccionMultipleManager = {
    crear() {
        return {
            id: 'actividad_' + Date.now(),
            tipo: 'seleccion_multiple',
            titulo: 'Nueva Actividad Selección Múltiple',
            puntos: 10,
            orden: 0,
            contenido: {
                pregunta: "",
                opciones: [
                    { id: 1, texto: "", correcta: false, imagen: null },
                    { id: 2, texto: "", correcta: false, imagen: null }
                ],
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
        
        return `
            <div class="space-y-4">
                <!-- Imagen de la pregunta -->
                <div class="campo-actividad">
                    <label class="flex items-center justify-between">
                        <span>Imagen de la pregunta (Opcional)</span>
                        ${tieneImagen ? `
                            <button type="button" onclick="SeleccionMultipleManager.eliminarImagenPregunta('${actividad.id}')" 
                                    class="text-red-500 hover:text-red-700 text-sm">
                                <i class="fas fa-trash mr-1"></i>Eliminar
                            </button>
                        ` : ''}
                    </label>
                    ${tieneImagen ? `
                        <div class="preview-imagen">
                            <img src="${actividad.contenido.imagen.url}" alt="Imagen de pregunta">
                            <button type="button" onclick="SeleccionMultipleManager.eliminarImagenPregunta('${actividad.id}')" 
                                    class="btn-eliminar-imagen">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    ` : `
                        <div class="flex gap-2">
                            <button type="button" onclick="SeleccionMultipleManager.agregarImagenPregunta('${actividad.id}')"
                                    class="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                <i class="fas fa-image mr-2"></i>Subir Imagen
                            </button>
                        </div>
                    `}
                </div>

                <!-- Pregunta -->
                <div class="campo-actividad">
                    <label>Pregunta *</label>
                    <textarea oninput="SeleccionMultipleManager.actualizarPregunta('${actividad.id}', this.value)"
                              class="w-full h-20"
                              placeholder="Escribe tu pregunta aquí...">${actividad.contenido.pregunta}</textarea>
                </div>

                <!-- Opciones -->
                <div class="campo-actividad">
                    <label>Opciones de Respuesta *</label>
                    <div class="space-y-3" id="opciones-${actividad.id}">
                        ${actividad.contenido.opciones.map((opcion, index) => this.generarOpcionHTML(actividad.id, opcion, index)).join('')}
                    </div>
                    
                    <button type="button" onclick="SeleccionMultipleManager.agregarOpcion('${actividad.id}')" 
                            class="btn-agregar-opcion mt-3">
                        <i class="fas fa-plus"></i>
                        Agregar Opción
                    </button>
                </div>

                <!-- Explicación -->
                <div class="campo-actividad">
                    <label>Explicación (Opcional)</label>
                    <textarea oninput="SeleccionMultipleManager.actualizarExplicacion('${actividad.id}', this.value)"
                              class="w-full h-16"
                              placeholder="Explica por qué esta respuesta es correcta...">${actividad.contenido.explicacion}</textarea>
                </div>
            </div>
        `;
    },

    generarOpcionHTML(actividadId, opcion, index) {
        return `
            <div class="opcion-item" data-opcion-id="${opcion.id}">
                <div class="flex items-center gap-2">
                    <input type="radio" name="correcta-${actividadId}" 
                           ${opcion.correcta ? 'checked' : ''}
                           onchange="SeleccionMultipleManager.marcarOpcionCorrecta('${actividadId}', ${opcion.id})"
                           class="text-green-500 focus:ring-green-500">
                </div>
                
                <!-- Imagen de la opción -->
                <div class="flex-1">
                    ${opcion.imagen ? `
                        <div class="preview-imagen mb-2">
                            <img src="${opcion.imagen.url}" alt="Imagen opción">
                            <button type="button" onclick="SeleccionMultipleManager.eliminarImagenOpcion('${actividadId}', ${opcion.id})" 
                                    class="btn-eliminar-imagen">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    ` : `
                        <div class="flex gap-2 mb-2">
                            <button type="button" onclick="SeleccionMultipleManager.agregarImagenOpcion('${actividadId}', ${opcion.id})"
                                    class="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                <i class="fas fa-image mr-1"></i>Imagen
                            </button>
                        </div>
                    `}
                    
                    <textarea oninput="SeleccionMultipleManager.actualizarTextoOpcion('${actividadId}', ${opcion.id}, this.value)"
                              class="w-full"
                              placeholder="Texto de la opción...">${opcion.texto}</textarea>
                </div>
                
                <div class="flex items-center gap-2">
                    <button type="button" onclick="SeleccionMultipleManager.moverOpcion('${actividadId}', ${opcion.id}, -1)"
                            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 ${index === 0 ? 'invisible' : ''}">
                        <i class="fas fa-arrow-up"></i>
                    </button>
                    <button type="button" onclick="SeleccionMultipleManager.moverOpcion('${actividadId}', ${opcion.id}, 1)" 
                            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 ${index === this.getActividad(actividadId).contenido.opciones.length - 1 ? 'invisible' : ''}">
                        <i class="fas fa-arrow-down"></i>
                    </button>
                    <button type="button" onclick="SeleccionMultipleManager.eliminarOpcion('${actividadId}', ${opcion.id})"
                            class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
    },

    // Funciones de gestión de opciones
    agregarOpcion(actividadId) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            const nuevaOpcion = {
                id: Date.now() + Math.random(),
                texto: "",
                correcta: false,
                imagen: null
            };
            actividad.contenido.opciones.push(nuevaOpcion);
            window.leccionEditor.recargarActividad(actividadId);
        }
    },

    eliminarOpcion(actividadId, opcionId) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.contenido.opciones = actividad.contenido.opciones.filter(o => o.id !== opcionId);
            
            // Si era la opción correcta, marcar la primera como correcta
            const opcionEliminada = actividad.contenido.opciones.find(o => o.id === opcionId);
            if (opcionEliminada && opcionEliminada.correcta && actividad.contenido.opciones.length > 0) {
                actividad.contenido.opciones[0].correcta = true;
            }
            
            window.leccionEditor.recargarActividad(actividadId);
        }
    },

    marcarOpcionCorrecta(actividadId, opcionId) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.contenido.opciones.forEach(opcion => {
                opcion.correcta = opcion.id === opcionId;
            });
        }
    },

    moverOpcion(actividadId, opcionId, direccion) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            const index = actividad.contenido.opciones.findIndex(o => o.id === opcionId);
            const nuevoIndex = index + direccion;
            
            if (nuevoIndex >= 0 && nuevoIndex < actividad.contenido.opciones.length) {
                const [opcion] = actividad.contenido.opciones.splice(index, 1);
                actividad.contenido.opciones.splice(nuevoIndex, 0, opcion);
                window.leccionEditor.recargarActividad(actividadId);
            }
        }
    },

    actualizarTextoOpcion(actividadId, opcionId, texto) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            const opcion = actividad.contenido.opciones.find(o => o.id === opcionId);
            if (opcion) {
                opcion.texto = texto;
            }
        }
    },

    // Funciones de gestión de imágenes
    agregarImagenPregunta(actividadId) {
        window.currentImageContext = { actividadId, tipoCampo: 'pregunta' };
        this.abrirSelectorImagen();
    },

    agregarImagenOpcion(actividadId, opcionId) {
        window.currentImageContext = { 
            actividadId, 
            opcionId, 
            tipo: 'opcion',
            elemento: 'seleccion_multiple'
        };
        this.abrirSelectorImagen();
    },

    eliminarImagenPregunta(actividadId) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.contenido.imagen = null;
            window.leccionEditor.recargarActividad(actividadId);
        }
    },

    eliminarImagenOpcion(actividadId, opcionId) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            const opcion = actividad.contenido.opciones.find(o => o.id === opcionId);
            if (opcion) {
                opcion.imagen = null;
                window.leccionEditor.recargarActividad(actividadId);
            }
        }
    },

    // Funciones de actualización de contenido
    actualizarPregunta(actividadId, pregunta) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.contenido.pregunta = pregunta;
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

        // Aquí iría la lógica de subida de imágenes
        // Por ahora usamos una URL local para desarrollo
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
        const { actividadId, tipoCampo, opcionId, tipo, elemento } = window.currentImageContext;

        if (elemento === 'seleccion_multiple' && tipo === 'opcion') {
            const actividad = this.getActividad(actividadId);
            if (actividad) {
                const opcion = actividad.contenido.opciones.find(o => o.id === opcionId);
                if (opcion) {
                    opcion.imagen = imagenData;
                }
            }
        } else if (tipoCampo === 'pregunta') {
            const actividad = this.getActividad(actividadId);
            if (actividad) {
                actividad.contenido.imagen = imagenData;
            }
        }

        window.leccionEditor.recargarActividad(actividadId);
    }
};