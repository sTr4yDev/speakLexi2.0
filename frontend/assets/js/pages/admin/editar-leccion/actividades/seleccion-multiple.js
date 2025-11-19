/* ============================================
   SPEAKLEXI - SELECCIÓN MÚLTIPLE (FORMATO PYTHON)
   Compatible con el sistema unificado
   ============================================ */

window.SeleccionMultipleManager = {
    crear() {
        return {
            id: 'actividad_' + Date.now(),
            tipo: 'multiple_choice', // ✅ Formato Python unificado
            titulo: 'Pregunta de Selección Múltiple',
            puntos_maximos: 10,
            orden: 0,
            contenido: {
                preguntas: [{
                    pregunta: "",
                    opciones: ["", "", "", ""]
                }]
            },
            respuesta_correcta: {
                respuestas: [0], // ✅ Índice de la respuesta correcta
                tipo: "indices"
            }
        };
    },

    generarCampos(actividad) {
        const pregunta = actividad.contenido.preguntas[0];
        const opciones = pregunta.opciones || [];
        const respuestaCorrecta = actividad.respuesta_correcta.respuestas[0] || 0;
        
        return `
            <div class="space-y-6">
                ${this.generarHeaderActividad(actividad)}
                ${this.generarSeccionPregunta(actividad)}
                ${this.generarSeccionOpciones(actividad)}
            </div>
        `;
    },

    generarHeaderActividad(actividad) {
        return `
            <div class="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-sm border border-blue-200 dark:border-blue-700">
                        <i class="fas fa-list-ul text-blue-600 dark:text-blue-400"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-gray-900 dark:text-white">Selección Múltiple</h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Pregunta con opciones de respuesta</p>
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

    generarSeccionPregunta(actividad) {
        const pregunta = actividad.contenido.preguntas[0];
        
        return `
            <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div class="flex items-center gap-2 mb-4">
                    <h4 class="font-semibold text-gray-900 dark:text-white">Pregunta</h4>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Enunciado de la pregunta *
                    </label>
                    <textarea 
                        oninput="SeleccionMultipleManager.actualizarPregunta('${actividad.id}', this.value)"
                        placeholder="Escribe una pregunta clara y concisa..."
                        class="w-full h-24 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    >${pregunta.pregunta}</textarea>
                </div>
            </div>
        `;
    },

    generarSeccionOpciones(actividad) {
        const pregunta = actividad.contenido.preguntas[0];
        const opciones = pregunta.opciones || [];
        const respuestaCorrecta = actividad.respuesta_correcta.respuestas[0] || 0;
        
        return `
            <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                        <h4 class="font-semibold text-gray-900 dark:text-white">Opciones de Respuesta</h4>
                    </div>
                    <span class="text-sm text-gray-500 dark:text-gray-400">
                        ${opciones.length} opciones
                    </span>
                </div>

                <div class="space-y-4" id="opciones-${actividad.id}">
                    ${opciones.map((opcion, index) => this.generarOpcionHTML(actividad.id, opcion, index, respuestaCorrecta)).join('')}
                </div>

                ${opciones.length < 6 ? `
                    <button type="button" 
                            onclick="SeleccionMultipleManager.agregarOpcion('${actividad.id}')"
                            class="w-full mt-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-blue-400 dark:hover:border-blue-500 transition-all group">
                        <i class="fas fa-plus-circle mr-2 group-hover:text-blue-500 transition-colors"></i>
                        Agregar otra opción
                    </button>
                ` : ''}

                <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                    <div class="flex items-start gap-2">
                        <i class="fas fa-info-circle text-blue-500 mt-0.5"></i>
                        <p class="text-sm text-blue-700 dark:text-blue-300">
                            <strong>Formato:</strong> Marca una opción como correcta. Los estudiantes seleccionarán una respuesta.
                        </p>
                    </div>
                </div>
            </div>
        `;
    },

    generarOpcionHTML(actividadId, texto, index, respuestaCorrecta) {
        const letra = String.fromCharCode(65 + index);
        const esCorrecta = index === respuestaCorrecta;
        
        return `
            <div class="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 ${esCorrecta ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}">
                <!-- Indicador de letra -->
                <div class="w-8 h-8 flex items-center justify-center rounded-lg ${
                    esCorrecta 
                        ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500 text-green-700 dark:text-green-400' 
                        : 'bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                } font-semibold flex-shrink-0">
                    ${letra}
                </div>

                <!-- Campo de texto de la opción -->
                <div class="flex-1 min-w-0">
                    <input type="text" 
                           value="${texto}"
                           oninput="SeleccionMultipleManager.actualizarTextoOpcion('${actividadId}', ${index}, this.value)"
                           placeholder="Escribe el texto de esta opción..."
                           class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                </div>

                <!-- Radio button para marcar como correcta -->
                <div class="flex items-center gap-3 flex-shrink-0">
                    <input type="radio" 
                           name="correcta-${actividadId}" 
                           ${esCorrecta ? 'checked' : ''}
                           onchange="SeleccionMultipleManager.marcarOpcionCorrecta('${actividadId}', ${index})"
                           class="w-5 h-5 text-green-500 focus:ring-green-500 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Correcta</span>
                </div>

                <!-- Botón eliminar (solo si hay más de 2 opciones) -->
                ${index >= 2 ? `
                    <button type="button" 
                            onclick="SeleccionMultipleManager.eliminarOpcion('${actividadId}', ${index})"
                            class="w-8 h-8 flex items-center justify-center text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-400 transition-colors rounded hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
                            title="Eliminar opción">
                        <i class="fas fa-times text-sm"></i>
                    </button>
                ` : ''}
            </div>
        `;
    },

    // ========== FUNCIONES DE GESTIÓN ==========

    agregarOpcion(actividadId) {
        const actividad = this.getActividad(actividadId);
        if (actividad && actividad.contenido.preguntas[0].opciones.length < 6) {
            actividad.contenido.preguntas[0].opciones.push("");
            window.leccionEditor.recargarActividad(actividadId);
        }
    },

    eliminarOpcion(actividadId, index) {
        const actividad = this.getActividad(actividadId);
        if (actividad && actividad.contenido.preguntas[0].opciones.length > 2) {
            const opciones = actividad.contenido.preguntas[0].opciones;
            
            // Si eliminamos la opción correcta, marcar la primera como correcta
            if (actividad.respuesta_correcta.respuestas[0] === index) {
                actividad.respuesta_correcta.respuestas[0] = 0;
            }
            // Ajustar índice si la opción eliminada estaba antes de la correcta
            else if (actividad.respuesta_correcta.respuestas[0] > index) {
                actividad.respuesta_correcta.respuestas[0]--;
            }
            
            opciones.splice(index, 1);
            window.leccionEditor.recargarActividad(actividadId);
        }
    },

    marcarOpcionCorrecta(actividadId, index) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.respuesta_correcta.respuestas[0] = index;
            window.leccionEditor.recargarActividad(actividadId);
        }
    },

    actualizarPregunta(actividadId, pregunta) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.contenido.preguntas[0].pregunta = pregunta;
        }
    },

    actualizarTextoOpcion(actividadId, index, texto) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.contenido.preguntas[0].opciones[index] = texto;
        }
    },

    // ========== FUNCIONES AUXILIARES ==========

    getActividad(actividadId) {
        return window.leccionEditor.getActividades().find(a => a.id === actividadId);
    },

    // ========== VALIDACIÓN ==========

    validar(actividad) {
        const errores = [];
        const pregunta = actividad.contenido.preguntas[0];

        if (!pregunta.pregunta || !pregunta.pregunta.trim()) {
            errores.push('La pregunta es requerida');
        }

        const opcionesValidas = pregunta.opciones.filter(opcion => 
            opcion && opcion.trim()
        );

        if (opcionesValidas.length < 2) {
            errores.push('Se requieren al menos 2 opciones con texto');
        }

        // Verificar que haya una respuesta correcta definida
        if (actividad.respuesta_correcta.respuestas.length === 0 || 
            actividad.respuesta_correcta.respuestas[0] >= pregunta.opciones.length) {
            errores.push('Debe seleccionar una opción correcta');
        }

        // Verificar que la opción correcta tenga texto
        const indiceCorrecto = actividad.respuesta_correcta.respuestas[0];
        if (pregunta.opciones[indiceCorrecto] && !pregunta.opciones[indiceCorrecto].trim()) {
            errores.push('La opción correcta debe tener texto');
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
            tipo: "multiple_choice", // ✅ Formato unificado
            titulo: actividad.titulo,
            contenido: {
                preguntas: actividad.contenido.preguntas
            },
            respuesta_correcta: {
                respuestas: actividad.respuesta_correcta.respuestas,
                tipo: "indices"
            },
            puntos_maximos: actividad.puntos_maximos,
            orden: actividad.orden
        };
    }
};

console.log('✅ SeleccionMultipleManager (Formato Python) cargado');