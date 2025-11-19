/* ============================================
   SPEAKLEXI - VERDADERO/FALSO (FORMATO PYTHON)
   Compatible con el sistema unificado
   ============================================ */

window.VerdaderoFalsoManager = {
    crear() {
        return {
            id: 'actividad_' + Date.now(),
            tipo: 'true_false', // ✅ Formato Python unificado
            titulo: 'Verdadero o Falso',
            puntos_maximos: 10,
            orden: 0,
            contenido: {
                afirmaciones: [""] // ✅ Array de afirmaciones
            },
            respuesta_correcta: {
                respuestas: [true], // ✅ Array de booleanos
                tipo: "booleanos"
            }
        };
    },

    generarCampos(actividad) {
        const afirmaciones = actividad.contenido.afirmaciones || [""];
        const respuestas = actividad.respuesta_correcta.respuestas || [true];
        
        return `
            <div class="space-y-6">
                ${this.generarHeaderActividad(actividad)}
                ${this.generarSeccionAfirmaciones(actividad)}
            </div>
        `;
    },

    generarHeaderActividad(actividad) {
        return `
            <div class="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-sm border border-green-200 dark:border-green-700">
                        <i class="fas fa-check-circle text-green-600 dark:text-green-400"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-gray-900 dark:text-white">Verdadero/Falso</h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Afirmaciones para evaluar</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="px-3 py-1 bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 rounded-full text-sm font-medium border border-green-200 dark:border-green-700">
                        ${actividad.puntos_maximos} pts
                    </span>
                </div>
            </div>
        `;
    },

    generarSeccionAfirmaciones(actividad) {
        const afirmaciones = actividad.contenido.afirmaciones || [""];
        const respuestas = actividad.respuesta_correcta.respuestas || [true];
        
        return `
            <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                        <h4 class="font-semibold text-gray-900 dark:text-white">Afirmaciones</h4>
                    </div>
                    <span class="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-sm font-medium">
                        ${afirmaciones.length} afirmación(es)
                    </span>
                </div>

                <!-- Instrucciones -->
                <div class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                    <div class="flex items-start gap-2">
                        <i class="fas fa-info-circle text-blue-500 mt-0.5"></i>
                        <p class="text-sm text-blue-700 dark:text-blue-300">
                            <strong>Formato:</strong> Los estudiantes marcarán cada afirmación como Verdadera o Falsa.
                        </p>
                    </div>
                </div>

                <div class="space-y-4" id="afirmaciones-${actividad.id}">
                    ${afirmaciones.map((afirmacion, index) => 
                        this.generarAfirmacionHTML(actividad.id, afirmacion, index, respuestas[index])
                    ).join('')}
                </div>
                
                <button type="button" 
                        onclick="VerdaderoFalsoManager.agregarAfirmacion('${actividad.id}')" 
                        class="mt-4 w-full py-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-700 transition-colors font-medium">
                    <i class="fas fa-plus mr-2"></i>
                    Agregar Afirmación
                </button>
            </div>
        `;
    },

    generarAfirmacionHTML(actividadId, texto, index, respuestaCorrecta) {
        const esVerdadero = respuestaCorrecta === true;
        
        return `
            <div class="afirmacion-item bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Afirmación #${index + 1}</span>
                    ${index > 0 ? `
                        <button type="button" 
                                onclick="VerdaderoFalsoManager.eliminarAfirmacion('${actividadId}', ${index})"
                                class="w-8 h-8 flex items-center justify-center text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-400 transition-colors rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                title="Eliminar afirmación">
                            <i class="fas fa-times text-sm"></i>
                        </button>
                    ` : ''}
                </div>
                
                <!-- Campo de texto de la afirmación -->
                <div class="mb-4">
                    <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Texto de la afirmación *
                    </label>
                    <textarea 
                        oninput="VerdaderoFalsoManager.actualizarAfirmacion('${actividadId}', ${index}, this.value)"
                        placeholder="Escribe una afirmación clara y verificable..."
                        class="w-full h-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    >${texto}</textarea>
                </div>

                <!-- Selector de respuesta correcta -->
                <div>
                    <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Respuesta correcta
                    </label>
                    <div class="flex gap-4">
                        <button type="button" 
                                onclick="VerdaderoFalsoManager.seleccionarRespuesta('${actividadId}', ${index}, true)"
                                class="flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                                    esVerdadero 
                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-green-300 dark:hover:border-green-700'
                                }">
                            <div class="flex items-center justify-center gap-2">
                                <div class="w-4 h-4 rounded-full border-2 ${
                                    esVerdadero 
                                        ? 'bg-green-500 border-green-500' 
                                        : 'border-gray-400 dark:border-gray-500'
                                }"></div>
                                <span class="font-medium">Verdadero</span>
                            </div>
                        </button>
                        
                        <button type="button" 
                                onclick="VerdaderoFalsoManager.seleccionarRespuesta('${actividadId}', ${index}, false)"
                                class="flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                                    !esVerdadero 
                                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' 
                                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-red-300 dark:hover:border-red-700'
                                }">
                            <div class="flex items-center justify-center gap-2">
                                <div class="w-4 h-4 rounded-full border-2 ${
                                    !esVerdadero 
                                        ? 'bg-red-500 border-red-500' 
                                        : 'border-gray-400 dark:border-gray-500'
                                }"></div>
                                <span class="font-medium">Falso</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // ========== FUNCIONES DE GESTIÓN ==========

    agregarAfirmacion(actividadId) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            if (!actividad.contenido.afirmaciones) {
                actividad.contenido.afirmaciones = [""];
            }
            if (!actividad.respuesta_correcta.respuestas) {
                actividad.respuesta_correcta.respuestas = [true];
            }
            
            actividad.contenido.afirmaciones.push("");
            actividad.respuesta_correcta.respuestas.push(true); // Por defecto verdadero
            
            window.leccionEditor.recargarActividad(actividadId);
        }
    },

    eliminarAfirmacion(actividadId, index) {
        const actividad = this.getActividad(actividadId);
        if (actividad && actividad.contenido.afirmaciones.length > 1) {
            actividad.contenido.afirmaciones.splice(index, 1);
            actividad.respuesta_correcta.respuestas.splice(index, 1);
            window.leccionEditor.recargarActividad(actividadId);
        }
    },

    seleccionarRespuesta(actividadId, index, respuesta) {
        const actividad = this.getActividad(actividadId);
        if (actividad && actividad.respuesta_correcta.respuestas) {
            actividad.respuesta_correcta.respuestas[index] = respuesta;
            window.leccionEditor.recargarActividad(actividadId);
        }
    },

    actualizarAfirmacion(actividadId, index, texto) {
        const actividad = this.getActividad(actividadId);
        if (actividad && actividad.contenido.afirmaciones) {
            actividad.contenido.afirmaciones[index] = texto;
        }
    },

    // ========== FUNCIONES AUXILIARES ==========

    getActividad(actividadId) {
        return window.leccionEditor.getActividades().find(a => a.id === actividadId);
    },

    // ========== VALIDACIÓN ==========

    validar(actividad) {
        const errores = [];

        if (!actividad.contenido.afirmaciones || actividad.contenido.afirmaciones.length === 0) {
            errores.push('Se requiere al menos una afirmación');
        }

        if (actividad.contenido.afirmaciones) {
            const afirmacionesVacias = actividad.contenido.afirmaciones.filter(a => !a.trim());
            if (afirmacionesVacias.length > 0) {
                errores.push(`Hay ${afirmacionesVacias.length} afirmaciones sin texto`);
            }
        }

        if (!actividad.respuesta_correcta.respuestas || 
            actividad.respuesta_correcta.respuestas.length !== actividad.contenido.afirmaciones.length) {
            errores.push('Cada afirmación debe tener una respuesta correcta definida');
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
            tipo: "true_false", // ✅ Formato unificado
            titulo: actividad.titulo,
            contenido: {
                afirmaciones: actividad.contenido.afirmaciones || []
            },
            respuesta_correcta: {
                respuestas: actividad.respuesta_correcta.respuestas || [],
                tipo: "booleanos"
            },
            puntos_maximos: actividad.puntos_maximos,
            orden: actividad.orden
        };
    }
};

console.log('✅ VerdaderoFalsoManager (Formato Python) cargado');