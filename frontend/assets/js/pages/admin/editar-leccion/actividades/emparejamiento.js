/* ============================================
   SPEAKLEXI - EMPAREJAMIENTO (FORMATO PYTHON)
   Compatible con el sistema unificado
   ============================================ */

window.EmparejamientoManager = {
    crear() {
        return {
            id: 'actividad_' + Date.now(),
            tipo: 'matching', // ✅ Formato Python unificado
            titulo: 'Actividad de Emparejamiento',
            puntos_maximos: 10,
            orden: 0,
            contenido: {
                pares: [
                    { izquierda: "", derecha: "" },
                    { izquierda: "", derecha: "" }
                ]
            },
            respuesta_correcta: {
                respuestas: [0, 1], // ✅ Índices correctos en orden
                tipo: "indices"
            }
        };
    },

    generarCampos(actividad) {
        const pares = actividad.contenido.pares || [];
        
        return `
            <div class="space-y-6">
                ${this.generarHeaderActividad(actividad)}
                ${this.generarSeccionPares(actividad)}
            </div>
        `;
    },

    generarHeaderActividad(actividad) {
        return `
            <div class="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-sm border border-green-200 dark:border-green-700">
                        <i class="fas fa-link text-green-600 dark:text-green-400"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-gray-900 dark:text-white">Emparejamiento</h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Conectar elementos relacionados</p>
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

    generarSeccionPares(actividad) {
        const pares = actividad.contenido.pares || [];
        
        return `
            <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                        <h4 class="font-semibold text-gray-900 dark:text-white">Pares para Emparejar</h4>
                    </div>
                    <span class="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-sm font-medium">
                        ${pares.length} pares
                    </span>
                </div>

                <!-- Instrucciones -->
                <div class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                    <div class="flex items-start gap-2">
                        <i class="fas fa-info-circle text-blue-500 mt-0.5"></i>
                        <p class="text-sm text-blue-700 dark:text-blue-300">
                            <strong>Formato:</strong> Los estudiantes verán los elementos mezclados y deberán conectarlos correctamente.
                        </p>
                    </div>
                </div>

                <!-- Lista de Pares -->
                <div class="space-y-4" id="pares-emparejamiento-${actividad.id}">
                    ${pares.length > 0 ? 
                        pares.map((par, index) => this.generarParHTML(actividad.id, par, index)).join('') 
                    : this.generarPlaceholderPares()}
                </div>
                
                <!-- Botón Agregar -->
                <button type="button" 
                        onclick="EmparejamientoManager.agregarPar('${actividad.id}')" 
                        class="mt-4 w-full py-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-700 transition-colors font-medium">
                    <i class="fas fa-plus mr-2"></i>
                    Agregar Par
                </button>

                <!-- Validación mínima -->
                ${pares.length < 2 ? `
                    <div class="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                        <p class="text-sm text-yellow-700 dark:text-yellow-300">
                            <i class="fas fa-exclamation-triangle mr-1"></i>
                            Se requieren al menos 2 pares para esta actividad
                        </p>
                    </div>
                ` : ''}
            </div>
        `;
    },

    generarParHTML(actividadId, par, index) {
        return `
            <div class="par-item bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Par #${index + 1}</span>
                    <div class="flex gap-2">
                        ${index > 0 ? `
                            <button type="button" 
                                    onclick="EmparejamientoManager.moverPar('${actividadId}', ${index}, -1)"
                                    class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    title="Mover arriba">
                                <i class="fas fa-arrow-up text-xs"></i>
                            </button>
                        ` : ''}
                        <button type="button" 
                                onclick="EmparejamientoManager.eliminarPar('${actividadId}', ${index})"
                                class="w-8 h-8 flex items-center justify-center text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title="Eliminar par">
                            <i class="fas fa-times text-sm"></i>
                        </button>
                    </div>
                </div>
                
                <div class="grid md:grid-cols-2 gap-4">
                    <!-- Elemento Izquierdo -->
                    <div>
                        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                            Elemento A
                        </label>
                        <input type="text" 
                               value="${par.izquierda || ''}"
                               oninput="EmparejamientoManager.actualizarPar('${actividadId}', ${index}, 'izquierda', this.value)"
                               placeholder="Palabra, concepto, definición..."
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                    
                    <!-- Elemento Derecho -->
                    <div>
                        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                            Elemento B (Correspondiente)
                        </label>
                        <input type="text" 
                               value="${par.derecha || ''}"
                               oninput="EmparejamientoManager.actualizarPar('${actividadId}', ${index}, 'derecha', this.value)"
                               placeholder="Significado, traducción, match..."
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    </div>
                </div>
            </div>
        `;
    },

    generarPlaceholderPares() {
        return `
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                <i class="fas fa-link text-2xl mb-2 opacity-50"></i>
                <p class="font-medium">No hay pares creados</p>
                <p class="text-sm">Agrega pares para que los estudiantes los conecten</p>
            </div>
        `;
    },

    // ========== FUNCIONES DE GESTIÓN ==========

    agregarPar(actividadId) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            if (!actividad.contenido.pares) {
                actividad.contenido.pares = [];
            }
            
            actividad.contenido.pares.push({
                izquierda: "",
                derecha: ""
            });
            
            // Actualizar respuestas correctas (índices en orden)
            actividad.respuesta_correcta.respuestas = Array.from(
                { length: actividad.contenido.pares.length }, 
                (_, i) => i
            );
            
            window.leccionEditor.recargarActividad(actividadId);
        }
    },

    eliminarPar(actividadId, index) {
        const actividad = this.getActividad(actividadId);
        if (actividad && actividad.contenido.pares) {
            actividad.contenido.pares.splice(index, 1);
            
            // Actualizar respuestas correctas
            if (actividad.contenido.pares.length > 0) {
                actividad.respuesta_correcta.respuestas = Array.from(
                    { length: actividad.contenido.pares.length }, 
                    (_, i) => i
                );
            } else {
                actividad.respuesta_correcta.respuestas = [];
            }
            
            window.leccionEditor.recargarActividad(actividadId);
        }
    },

    moverPar(actividadId, index, direccion) {
        const actividad = this.getActividad(actividadId);
        if (actividad && actividad.contenido.pares) {
            const nuevoIndex = index + direccion;
            
            if (nuevoIndex >= 0 && nuevoIndex < actividad.contenido.pares.length) {
                const [par] = actividad.contenido.pares.splice(index, 1);
                actividad.contenido.pares.splice(nuevoIndex, 0, par);
                
                // Los índices de respuesta se mantienen igual (solo cambia el orden visual)
                window.leccionEditor.recargarActividad(actividadId);
            }
        }
    },

    actualizarPar(actividadId, index, campo, valor) {
        const actividad = this.getActividad(actividadId);
        if (actividad && actividad.contenido.pares) {
            const par = actividad.contenido.pares[index];
            if (par) {
                par[campo] = valor;
            }
        }
    },

    // ========== FUNCIONES AUXILIARES ==========

    getActividad(actividadId) {
        return window.leccionEditor.getActividades().find(a => a.id === actividadId);
    },

    // ========== VALIDACIÓN ==========

    validar(actividad) {
        const errores = [];

        if (!actividad.contenido.pares || actividad.contenido.pares.length < 2) {
            errores.push('Se requieren al menos 2 pares para emparejar');
        }

        if (actividad.contenido.pares) {
            const paresIncompletos = actividad.contenido.pares.filter(par => 
                !par.izquierda?.trim() || !par.derecha?.trim()
            );
            
            if (paresIncompletos.length > 0) {
                errores.push(`Hay ${paresIncompletos.length} pares incompletos`);
            }

            const izquierdas = actividad.contenido.pares.map(p => p.izquierda.trim().toLowerCase());
            const duplicadosIzq = izquierdas.filter((item, index) => izquierdas.indexOf(item) !== index);
            
            if (duplicadosIzq.length > 0) {
                errores.push('Hay elementos izquierdos duplicados');
            }
        }

        if (!actividad.respuesta_correcta.respuestas || 
            actividad.respuesta_correcta.respuestas.length !== actividad.contenido.pares.length) {
            errores.push('Configuración de respuestas incorrecta');
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
            tipo: "matching", // ✅ Formato unificado
            titulo: actividad.titulo,
            contenido: {
                pares: actividad.contenido.pares || []
            },
            respuesta_correcta: {
                respuestas: actividad.respuesta_correcta.respuestas || [],
                tipo: "indices"
            },
            puntos_maximos: actividad.puntos_maximos,
            orden: actividad.orden
        };
    }
};

console.log('✅ EmparejamientoManager (Formato Python) cargado');