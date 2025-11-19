/* ============================================
   SPEAKLEXI - COMPLETAR ESPACIOS (FORMATO PYTHON)
   Compatible con el sistema unificado
   ============================================ */

window.CompletarEspaciosManager = {
    crear() {
        return {
            id: 'actividad_' + Date.now(),
            tipo: 'fill_blank', // ✅ Formato Python unificado
            titulo: 'Completar Espacios',
            puntos_maximos: 10,
            orden: 0,
            contenido: {
                texto: ""
            },
            respuesta_correcta: {
                respuestas: [],
                tipo: "texto"
            }
        };
    },

    generarCampos(actividad) {
        return `
            <div class="space-y-6">
                ${this.generarHeaderActividad(actividad)}
                ${this.generarSeccionTexto(actividad)}
                ${this.generarSeccionPalabrasFaltantes(actividad)}
            </div>
        `;
    },

    generarHeaderActividad(actividad) {
        return `
            <div class="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-sm border border-blue-200 dark:border-blue-700">
                        <i class="fas fa-edit text-blue-600 dark:text-blue-400"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-gray-900 dark:text-white">Completar Espacios</h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Texto con palabras faltantes</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="px-3 py-1 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium border border-blue-200 dark:border-blue-700">
                        ${actividad.puntos_maximos} pts
                    </span>
                </div>
            </div>
        `;
    },

    generarSeccionTexto(actividad) {
        const palabrasCount = actividad.respuesta_correcta.respuestas.length;
        
        return `
            <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                        <h4 class="font-semibold text-gray-900 dark:text-white">Texto con Espacios</h4>
                    </div>
                    <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium">
                        ${palabrasCount} espacios
                    </span>
                </div>

                <!-- Instrucciones -->
                <div class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                    <div class="flex items-start gap-2">
                        <i class="fas fa-info-circle text-blue-500 mt-0.5"></i>
                        <p class="text-sm text-blue-700 dark:text-blue-300">
                            <strong>Formato:</strong> Usa <code class="bg-white dark:bg-gray-800 px-1 rounded">___</code> para marcar cada espacio. 
                            Ejemplo: "El ___ está sobre la ___"
                        </p>
                    </div>
                </div>

                <!-- Editor de texto -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Texto con espacios *
                    </label>
                    <textarea 
                        oninput="CompletarEspaciosManager.actualizarTexto('${actividad.id}', this.value)"
                        onblur="CompletarEspaciosManager.actualizarPalabrasFaltantes('${actividad.id}')"
                        placeholder="Escribe tu texto aquí. Usa ___ para marcar los espacios faltantes. Ejemplo: El gato está sobre la ___"
                        class="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    >${actividad.contenido.texto}</textarea>
                    
                    <div class="flex items-center justify-between mt-2">
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                            Los espacios se detectan automáticamente al salir del campo
                        </p>
                        <button type="button" 
                                onclick="CompletarEspaciosManager.actualizarPalabrasFaltantes('${actividad.id}')"
                                class="text-xs px-3 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded transition-colors">
                            Actualizar espacios
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    generarSeccionPalabrasFaltantes(actividad) {
        const palabras = actividad.respuesta_correcta.respuestas || [];
        
        return `
            <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                        <h4 class="font-semibold text-gray-900 dark:text-white">Respuestas Correctas</h4>
                    </div>
                    <span class="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-sm font-medium">
                        ${palabras.length} detectadas
                    </span>
                </div>

                <div id="palabras-faltantes-${actividad.id}" class="space-y-3">
                    ${palabras.length > 0 ? 
                        palabras.map((palabra, index) => this.generarPalabraHTML(actividad.id, palabra, index)).join('') 
                    : `
                        <div class="text-center py-6 text-gray-500 dark:text-gray-400">
                            <i class="fas fa-search text-2xl mb-2 opacity-50"></i>
                            <p class="font-medium">No se detectaron espacios</p>
                            <p class="text-sm">Usa ___ en el texto para crear espacios</p>
                        </div>
                    `}
                </div>
            </div>
        `;
    },

    generarPalabraHTML(actividadId, palabra, index) {
        return `
            <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <!-- Número de espacio -->
                <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center font-semibold text-blue-600 dark:text-blue-400 text-sm">
                    ${index + 1}
                </div>

                <!-- Campo de respuesta correcta -->
                <div class="flex-1">
                    <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Respuesta para espacio ${index + 1}
                    </label>
                    <input type="text" 
                           value="${palabra}" 
                           oninput="CompletarEspaciosManager.actualizarRespuesta('${actividadId}', ${index}, this.value)"
                           placeholder="Escribe la respuesta correcta..."
                           class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent">
                </div>

                <!-- Controles -->
                <button type="button" 
                        onclick="CompletarEspaciosManager.eliminarRespuesta('${actividadId}', ${index})"
                        class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Eliminar este espacio">
                    <i class="fas fa-times text-sm"></i>
                </button>
            </div>
        `;
    },

    // ========== FUNCIONES DE GESTIÓN ==========

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
            // Detectar espacios (___)
            const espacios = texto.match(/___/g) || [];
            
            // Si hay espacios, inicializar respuestas
            if (espacios.length > 0) {
                // Mantener respuestas existentes o inicializar array vacío
                if (!actividad.respuesta_correcta.respuestas || 
                    actividad.respuesta_correcta.respuestas.length !== espacios.length) {
                    actividad.respuesta_correcta.respuestas = Array(espacios.length).fill("");
                }
            } else {
                actividad.respuesta_correcta.respuestas = [];
            }
            
            window.leccionEditor.recargarActividad(actividadId);
        }
    },

    actualizarRespuesta(actividadId, index, respuesta) {
        const actividad = this.getActividad(actividadId);
        if (actividad && actividad.respuesta_correcta.respuestas) {
            actividad.respuesta_correcta.respuestas[index] = respuesta;
        }
    },

    eliminarRespuesta(actividadId, index) {
        const actividad = this.getActividad(actividadId);
        if (actividad && actividad.respuesta_correcta.respuestas) {
            // Eliminar la respuesta del array
            actividad.respuesta_correcta.respuestas.splice(index, 1);
            
            // Actualizar el texto removiendo un espacio
            if (actividad.contenido.texto) {
                let count = 0;
                actividad.contenido.texto = actividad.contenido.texto.replace(/___/g, (match) => {
                    if (count === index) {
                        count++;
                        return ""; // Remover este espacio
                    }
                    count++;
                    return match;
                });
                
                // Limpiar espacios vacíos consecutivos
                actividad.contenido.texto = actividad.contenido.texto.replace(/\s+/g, ' ').trim();
            }
            
            window.leccionEditor.recargarActividad(actividadId);
        }
    },

    // ========== FUNCIONES AUXILIARES ==========

    getActividad(actividadId) {
        return window.leccionEditor.getActividades().find(a => a.id === actividadId);
    },

    // ========== VALIDACIÓN ==========

    validar(actividad) {
        const errores = [];

        if (!actividad.contenido.texto || !actividad.contenido.texto.trim()) {
            errores.push('El texto con espacios es requerido');
        }

        const espaciosDetectados = (actividad.contenido.texto.match(/___/g) || []).length;
        if (espaciosDetectados === 0) {
            errores.push('Debe incluir al menos un espacio usando ___');
        }

        if (!actividad.respuesta_correcta.respuestas || actividad.respuesta_correcta.respuestas.length === 0) {
            errores.push('No se detectaron respuestas para los espacios');
        }

        // Verificar que todas las respuestas tengan contenido
        if (actividad.respuesta_correcta.respuestas) {
            const respuestasVacias = actividad.respuesta_correcta.respuestas.filter(r => !r.trim());
            if (respuestasVacias.length > 0) {
                errores.push(`Hay ${respuestasVacias.length} respuestas sin completar`);
            }
        }

        if (actividad.puntos_maximos < 1 || actividad.puntos_maximos > 100) {
            errores.push('Los puntos deben estar entre 1 y 100');
        }

        return errores;
    },

    // ========== FORMATO PARA GUARDAR ==========
    
    obtenerDatosGuardar(actividad) {
        // ✅ Estructura compatible con formato Python
        return {
            tipo: "fill_blank", // ✅ Formato unificado
            titulo: actividad.titulo,
            contenido: {
                texto: actividad.contenido.texto
            },
            respuesta_correcta: {
                respuestas: actividad.respuesta_correcta.respuestas || [],
                tipo: "texto"
            },
            puntos_maximos: actividad.puntos_maximos,
            orden: actividad.orden
        };
    }
};

console.log('✅ CompletarEspaciosManager (Formato Python) cargado');