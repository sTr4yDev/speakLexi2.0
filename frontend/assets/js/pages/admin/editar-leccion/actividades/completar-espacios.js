/* ============================================
   SPEAKLEXI - EDITOR LECCIÓN - COMPLETAR ESPACIOS
   Archivo: assets/js/pages/admin/editor-leccion/actividades/completar-espacios.js
   ============================================ */

// Manager específico para actividades de completar espacios
window.CompletarEspaciosManager = {
    crear() {
        return {
            id: 'actividad_' + Date.now(),
            tipo: 'completar_espacios',
            titulo: 'Nueva Actividad Completar Espacios',
            puntos: 10,
            orden: 0,
            contenido: {
                texto: "",
                palabras_faltantes: [],
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
        const palabras = actividad.contenido.palabras_faltantes || [];
        
        return `
            <div class="space-y-4">
                <!-- Imagen -->
                <div class="campo-actividad">
                    <label class="flex items-center justify-between">
                        <span>Imagen (Opcional)</span>
                        ${tieneImagen ? `
                            <button type="button" onclick="CompletarEspaciosManager.eliminarImagen('${actividad.id}')" 
                                    class="text-red-500 hover:text-red-700 text-sm">
                                <i class="fas fa-trash mr-1"></i>Eliminar
                            </button>
                        ` : ''}
                    </label>
                    ${tieneImagen ? `
                        <div class="preview-imagen">
                            <img src="${actividad.contenido.imagen.url}" alt="Imagen del texto">
                            <button type="button" onclick="CompletarEspaciosManager.eliminarImagen('${actividad.id}')" 
                                    class="btn-eliminar-imagen">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    ` : `
                        <button type="button" onclick="CompletarEspaciosManager.agregarImagen('${actividad.id}')"
                                class="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                            <i class="fas fa-image mr-2"></i>Subir Imagen
                        </button>
                    `}
                </div>

                <!-- Texto con espacios -->
                <div class="campo-actividad">
                    <label>Texto con Espacios *</label>
                    <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-3">
                        <p class="text-sm text-yellow-700 dark:text-yellow-300">
                            💡 <strong>Instrucciones:</strong> Encierra las palabras faltantes con doble corchete: [[palabra]]
                        </p>
                        <p class="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                            Ejemplo: "El [[gato]] está sobre la [[mesa]]"
                        </p>
                    </div>
                    <textarea oninput="CompletarEspaciosManager.actualizarTexto('${actividad.id}', this.value)" 
                              onblur="CompletarEspaciosManager.actualizarPalabrasFaltantes('${actividad.id}')"
                              class="w-full h-32 font-mono text-sm"
                              placeholder="Escribe el texto con palabras faltantes...">${actividad.contenido.texto}</textarea>
                </div>

                <!-- Palabras faltantes detectadas -->
                <div class="campo-actividad">
                    <label>Palabras Faltantes Detectadas</label>
                    <div id="palabras-faltantes-${actividad.id}" class="space-y-2">
                        ${palabras.length > 0 ? 
                            palabras.map(palabra => this.generarPalabraHTML(actividad.id, palabra)).join('') 
                        : '<p class="text-gray-500 dark:text-gray-400 text-sm">No se detectaron palabras faltantes. Usa [[palabra]] en el texto.</p>'}
                    </div>
                </div>

                <!-- Explicación -->
                <div class="campo-actividad">
                    <label>Explicación (Opcional)</label>
                    <textarea oninput="CompletarEspaciosManager.actualizarExplicacion('${actividad.id}', this.value)"
                              class="w-full h-16"
                              placeholder="Explicación adicional...">${actividad.contenido.explicacion}</textarea>
                </div>
            </div>
        `;
    },

    generarPalabraHTML(actividadId, palabra) {
        return `
            <div class="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-700">
                <span class="font-mono bg-white dark:bg-gray-700 px-2 py-1 rounded border text-sm">${palabra}</span>
                <span class="text-gray-500 dark:text-gray-400">→</span>
                <input type="text" value="${palabra}" 
                       oninput="CompletarEspaciosManager.actualizarPalabra('${actividad.id}', '${palabra}', this.value)"
                       class="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm"
                       placeholder="Palabra correcta">
            </div>
        `;
    },

    // Funciones de gestión de contenido
    actualizarTexto(actividadId, texto) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.contenido.texto = texto;
        }
    },

    actualizarPalabrasFaltantes(actividadId) {
        const actividad = this.getActividad(actividadId);
        if (actividad && actividad.contenido.texto) {
            const texto = actividad.contenido.texto;
            const palabras = texto.match(/\[\[(.*?)\]\]/g) || [];
            const palabrasUnicas = [...new Set(palabras.map(p => p.replace(/\[\[|\]\]/g, '')))];
            
            actividad.contenido.palabras_faltantes = palabrasUnicas;
            window.leccionEditor.recargarActividad(actividadId);
        }
    },

    actualizarPalabra(actividadId, palabraVieja, palabraNueva) {
        const actividad = this.getActividad(actividadId);
        if (actividad && actividad.contenido.palabras_faltantes) {
            // Actualizar en el array
            const index = actividad.contenido.palabras_faltantes.indexOf(palabraVieja);
            if (index !== -1) {
                actividad.contenido.palabras_faltantes[index] = palabraNueva;
            }
            
            // Actualizar en el texto
            if (actividad.contenido.texto) {
                actividad.contenido.texto = actividad.contenido.texto.replace(
                    new RegExp(`\\[\\[${palabraVieja}\\]\\]`, 'g'), 
                    `[[${palabraNueva}]]`
                );
            }
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