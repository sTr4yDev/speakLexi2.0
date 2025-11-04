/* ============================================
   SPEAKLEXI - EDITOR LECCIÓN - VERDADERO/FALSO
   Archivo: assets/js/pages/admin/editor-leccion/actividades/verdadero-falso.js
   ============================================ */

// Manager específico para actividades de verdadero/falso
window.VerdaderoFalsoManager = {
    crear() {
        return {
            id: 'actividad_' + Date.now(),
            tipo: 'verdadero_falso',
            titulo: 'Nueva Actividad Verdadero/Falso',
            puntos: 10,
            orden: 0,
            contenido: {
                afirmacion: "",
                respuesta_correcta: true,
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
                <!-- Imagen -->
                <div class="campo-actividad">
                    <label class="flex items-center justify-between">
                        <span>Imagen (Opcional)</span>
                        ${tieneImagen ? `
                            <button type="button" onclick="VerdaderoFalsoManager.eliminarImagen('${actividad.id}')" 
                                    class="text-red-500 hover:text-red-700 text-sm">
                                <i class="fas fa-trash mr-1"></i>Eliminar
                            </button>
                        ` : ''}
                    </label>
                    ${tieneImagen ? `
                        <div class="preview-imagen">
                            <img src="${actividad.contenido.imagen.url}" alt="Imagen de afirmación">
                            <button type="button" onclick="VerdaderoFalsoManager.eliminarImagen('${actividad.id}')" 
                                    class="btn-eliminar-imagen">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    ` : `
                        <div class="flex gap-2">
                            <button type="button" onclick="VerdaderoFalsoManager.agregarImagen('${actividad.id}')"
                                    class="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                <i class="fas fa-image mr-2"></i>Subir Imagen
                            </button>
                        </div>
                    `}
                </div>

                <!-- Afirmación -->
                <div class="campo-actividad">
                    <label>Afirmación *</label>
                    <textarea oninput="VerdaderoFalsoManager.actualizarAfirmacion('${actividad.id}', this.value)"
                              class="w-full h-20"
                              placeholder="Escribe la afirmación...">${actividad.contenido.afirmacion}</textarea>
                </div>

                <!-- Respuesta correcta -->
                <div class="campo-actividad">
                    <label>Respuesta Correcta *</label>
                    <div class="flex gap-4">
                        <label class="flex items-center gap-2">
                            <input type="radio" name="respuesta-${actividad.id}" 
                                   ${actividad.contenido.respuesta_correcta === true ? 'checked' : ''}
                                   onchange="VerdaderoFalsoManager.actualizarRespuesta('${actividad.id}', true)"
                                   class="text-green-500 focus:ring-green-500">
                            <span class="text-green-600 dark:text-green-400 font-medium">
                                <i class="fas fa-check-circle mr-1"></i>Verdadero
                            </span>
                        </label>
                        <label class="flex items-center gap-2">
                            <input type="radio" name="respuesta-${actividad.id}" 
                                   ${actividad.contenido.respuesta_correcta === false ? 'checked' : ''}
                                   onchange="VerdaderoFalsoManager.actualizarRespuesta('${actividad.id}', false)"
                                   class="text-red-500 focus:ring-red-500">
                            <span class="text-red-600 dark:text-red-400 font-medium">
                                <i class="fas fa-times-circle mr-1"></i>Falso
                            </span>
                        </label>
                    </div>
                </div>

                <!-- Explicación -->
                <div class="campo-actividad">
                    <label>Explicación (Opcional)</label>
                    <textarea oninput="VerdaderoFalsoManager.actualizarExplicacion('${actividad.id}', this.value)"
                              class="w-full h-16"
                              placeholder="Explica por qué esta respuesta es correcta...">${actividad.contenido.explicacion}</textarea>
                </div>
            </div>
        `;
    },

    // Funciones de gestión de contenido
    actualizarAfirmacion(actividadId, afirmacion) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.contenido.afirmacion = afirmacion;
        }
    },

    actualizarRespuesta(actividadId, respuesta) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.contenido.respuesta_correcta = respuesta;
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