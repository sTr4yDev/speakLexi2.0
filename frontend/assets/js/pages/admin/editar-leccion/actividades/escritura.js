/* ============================================
   SPEAKLEXI - ESCRITURA (FORMATO PYTHON)
   Compatible con el sistema unificado
   ============================================ */

window.EscrituraManager = {
    crear() {
        return {
            id: 'actividad_' + Date.now(),
            tipo: 'writing', // ✅ Formato Python unificado
            titulo: 'Actividad de Escritura',
            puntos_maximos: 20,
            orden: 0,
            contenido: {
                instrucciones: "",
                palabras_minimas: 50
            },
            respuesta_correcta: {
                tipo: "evaluacion_manual",
                criterios: ["Claridad", "Gramática", "Vocabulario"]
            }
        };
    },

    generarCampos(actividad) {
        const criterios = actividad.respuesta_correcta.criterios || [];
        
        return `
            <div class="space-y-6">
                ${this.generarHeaderActividad(actividad)}
                ${this.generarSeccionInstrucciones(actividad)}
                ${this.generarSeccionConfiguracion(actividad)}
                ${this.generarSeccionCriterios(actividad)}
            </div>
        `;
    },

    generarHeaderActividad(actividad) {
        return `
            <div class="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-sm border border-purple-200 dark:border-purple-700">
                        <i class="fas fa-pen text-purple-600 dark:text-purple-400"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-gray-900 dark:text-white">Escritura</h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Ejercicio de expresión escrita</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="px-3 py-1 bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 rounded-full text-sm font-medium border border-purple-200 dark:border-purple-700">
                        ${actividad.puntos_maximos} pts
                    </span>
                </div>
            </div>
        `;
    },

    generarSeccionInstrucciones(actividad) {
        return `
            <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div class="flex items-center gap-2 mb-4">
                    <h4 class="font-semibold text-gray-900 dark:text-white">Instrucciones de Escritura</h4>
                </div>

                <!-- Instrucciones -->
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Consigna para el estudiante *
                    </label>
                    <textarea 
                        oninput="EscrituraManager.actualizarInstrucciones('${actividad.id}', this.value)"
                        placeholder="Ej: Escribe un párrafo describiendo tu rutina diaria. Incluye al menos 50 palabras..."
                        class="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                    >${actividad.contenido.instrucciones}</textarea>
                </div>

                <!-- Ejemplos -->
                <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                    <div class="flex items-start gap-2">
                        <i class="fas fa-lightbulb text-blue-500 mt-0.5"></i>
                        <div class="text-sm text-blue-700 dark:text-blue-300">
                            <strong>Ejemplos de consignas:</strong>
                            <ul class="mt-1 space-y-1">
                                <li>• Describe tu ciudad ideal usando al menos 10 adjetivos</li>
                                <li>• Escribe una carta formal solicitando información</li>
                                <li>• Narra una experiencia personal importante</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    generarSeccionConfiguracion(actividad) {
        return `
            <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div class="flex items-center gap-2 mb-4">
                    <h4 class="font-semibold text-gray-900 dark:text-white">Configuración</h4>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Palabras mínimas
                        </label>
                        <input type="number" 
                               value="${actividad.contenido.palabras_minimas || 50}"
                               oninput="EscrituraManager.actualizarPalabrasMinimas('${actividad.id}', parseInt(this.value))"
                               min="10" max="1000"
                               class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Puntos máximos
                        </label>
                        <input type="number" 
                               value="${actividad.puntos_maximos}"
                               oninput="EscrituraManager.actualizarPuntos('${actividad.id}', parseInt(this.value))"
                               min="5" max="100"
                               class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    </div>
                </div>
            </div>
        `;
    },

    generarSeccionCriterios(actividad) {
        const criterios = actividad.respuesta_correcta.criterios || [];
        
        return `
            <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                        <h4 class="font-semibold text-gray-900 dark:text-white">Criterios de Evaluación</h4>
                    </div>
                    <span class="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-sm font-medium">
                        ${criterios.length} criterios
                    </span>
                </div>

                <div class="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                    <div class="flex items-start gap-2">
                        <i class="fas fa-info-circle text-green-500 mt-0.5"></i>
                        <p class="text-sm text-green-700 dark:text-green-300">
                            Los criterios ayudan a evaluar la escritura de manera consistente
                        </p>
                    </div>
                </div>

                <div class="space-y-3" id="criterios-escritura-${actividad.id}">
                    ${criterios.length > 0 ? 
                        criterios.map((criterio, index) => this.generarCriterioHTML(actividad.id, criterio, index)).join('') 
                    : this.generarPlaceholderCriterios()}
                </div>
                
                <button type="button" 
                        onclick="EscrituraManager.agregarCriterio('${actividad.id}')" 
                        class="mt-4 w-full py-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-700 transition-colors font-medium">
                    <i class="fas fa-plus mr-2"></i>
                    Agregar Criterio
                </button>
            </div>
        `;
    },

    generarCriterioHTML(actividadId, criterio, index) {
        return `
            <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <!-- Número -->
                <div class="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded flex items-center justify-center font-semibold text-green-600 dark:text-green-400 text-sm">
                    ${index + 1}
                </div>

                <!-- Campo de criterio -->
                <div class="flex-1">
                    <input type="text" 
                           value="${criterio}"
                           oninput="EscrituraManager.actualizarCriterio('${actividadId}', ${index}, this.value)"
                           placeholder="Ej: Claridad, Gramática, Vocabulario..."
                           class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent">
                </div>

                <!-- Controles -->
                <button type="button" 
                        onclick="EscrituraManager.eliminarCriterio('${actividadId}', ${index})"
                        class="w-8 h-8 flex items-center justify-center text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-400 transition-colors rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Eliminar criterio">
                    <i class="fas fa-times text-sm"></i>
                </button>
            </div>
        `;
    },

    generarPlaceholderCriterios() {
        return `
            <div class="text-center py-6 text-gray-500 dark:text-gray-400">
                <i class="fas fa-clipboard-list text-2xl mb-2 opacity-50"></i>
                <p class="font-medium">No hay criterios definidos</p>
                <p class="text-sm">Agrega criterios para evaluar la escritura</p>
            </div>
        `;
    },

    // ========== FUNCIONES DE GESTIÓN ==========

    actualizarInstrucciones(actividadId, instrucciones) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.contenido.instrucciones = instrucciones;
        }
    },

    actualizarPalabrasMinimas(actividadId, palabras) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.contenido.palabras_minimas = palabras;
        }
    },

    actualizarPuntos(actividadId, puntos) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.puntos_maximos = puntos;
        }
    },

    // ========== GESTIÓN DE CRITERIOS ==========

    agregarCriterio(actividadId) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            if (!actividad.respuesta_correcta.criterios) {
                actividad.respuesta_correcta.criterios = [];
            }
            
            actividad.respuesta_correcta.criterios.push("Nuevo criterio");
            window.leccionEditor.recargarActividad(actividadId);
        }
    },

    eliminarCriterio(actividadId, index) {
        const actividad = this.getActividad(actividadId);
        if (actividad && actividad.respuesta_correcta.criterios) {
            actividad.respuesta_correcta.criterios.splice(index, 1);
            window.leccionEditor.recargarActividad(actividadId);
        }
    },

    actualizarCriterio(actividadId, index, valor) {
        const actividad = this.getActividad(actividadId);
        if (actividad && actividad.respuesta_correcta.criterios) {
            actividad.respuesta_correcta.criterios[index] = valor;
        }
    },

    // ========== FUNCIONES AUXILIARES ==========

    getActividad(actividadId) {
        return window.leccionEditor.getActividades().find(a => a.id === actividadId);
    },

    // ========== VALIDACIÓN ==========

    validar(actividad) {
        const errores = [];

        if (!actividad.contenido.instrucciones || !actividad.contenido.instrucciones.trim()) {
            errores.push('Las instrucciones de escritura son requeridas');
        }

        if (!actividad.contenido.palabras_minimas || actividad.contenido.palabras_minimas < 10) {
            errores.push('La longitud mínima debe ser de al menos 10 palabras');
        }

        if (!actividad.respuesta_correcta.criterios || actividad.respuesta_correcta.criterios.length === 0) {
            errores.push('Se requieren al menos 1 criterio de evaluación');
        }

        if (actividad.respuesta_correcta.criterios) {
            const criteriosVacios = actividad.respuesta_correcta.criterios.filter(c => !c.trim());
            if (criteriosVacios.length > 0) {
                errores.push(`Hay ${criteriosVacios.length} criterios sin completar`);
            }
        }

        if (actividad.puntos_maximos < 5 || actividad.puntos_maximos > 100) {
            errores.push('Los puntos deben estar entre 5 y 100');
        }

        return errores;
    },

    // ========== FORMATO PARA GUARDAR ==========
    
    obtenerDatosGuardar(actividad) {
        // ✅ Estructura compatible con formato Python
        return {
            tipo: "writing", // ✅ Formato unificado
            titulo: actividad.titulo,
            contenido: {
                instrucciones: actividad.contenido.instrucciones,
                palabras_minimas: actividad.contenido.palabras_minimas
            },
            respuesta_correcta: {
                tipo: "evaluacion_manual",
                criterios: actividad.respuesta_correcta.criterios || []
            },
            puntos_maximos: actividad.puntos_maximos,
            orden: actividad.orden
        };
    }
};

console.log('✅ EscrituraManager (Formato Python) cargado');