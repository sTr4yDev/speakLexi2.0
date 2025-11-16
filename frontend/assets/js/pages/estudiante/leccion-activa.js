// frontend/assets/js/pages/estudiante/leccion-activa.js

class LeccionActiva {
    constructor() {
        this.leccionId = null;
        this.leccionData = null;
        this.ejercicios = [];
        this.ejercicioActualIndex = 0;
        this.respuestasUsuario = {};
        this.ejerciciosCompletados = new Set();
        
        // 🎯 TRACKING DE XP Y PROGRESO
        this.xpAcumulado = 0;
        this.ejerciciosCorrectos = 0;
        this.ejerciciosValidados = [];
        
        console.log('🎯 Inicializando LeccionActiva...');
        
        // Verificar que apiClient esté disponible
        if (!window.apiClient) {
            console.error('❌ apiClient no disponible');
            this.mostrarError('Error de configuración del sistema. apiClient no cargado.');
            return;
        }
        
        this.init();
    }

    async init() {
        try {
            // Obtener ID de lección desde URL
            const urlParams = new URLSearchParams(window.location.search);
            this.leccionId = urlParams.get('id');
            
            if (!this.leccionId) {
                this.mostrarError('No se especificó una lección. Por favor, selecciona una lección desde el dashboard.');
                return;
            }

            console.log(`📚 Cargando lección ID: ${this.leccionId}`);
            
            // Cargar datos de la lección y ejercicios
            await this.cargarLeccion();
            await this.cargarEjercicios();
            
            // Renderizar interfaz
            this.renderizarInterfaz();
            
        } catch (error) {
            console.error('❌ Error inicializando:', error);
            this.mostrarError('Error al cargar la lección: ' + error.message);
        }
    }

    async cargarLeccion() {
        try {
            console.log('📖 Cargando datos de lección...');
            
            // ✅ URL CORREGIDA - sin /api/ duplicado
            const response = await window.apiClient.get(`/lecciones/${this.leccionId}`);
            
            if (response && response.success) {
                this.leccionData = response.data;
                console.log('✅ Lección cargada:', this.leccionData);
            } else {
                const errorMsg = response ? response.error : 'No response from server';
                throw new Error(errorMsg || 'Error al cargar lección');
            }
        } catch (error) {
            console.error('❌ Error cargando lección:', error);
            throw new Error('No se pudo cargar la lección: ' + error.message);
        }
    }

    async cargarEjercicios() {
        try {
            console.log('📝 Cargando ejercicios...');
            
            const response = await window.apiClient.get(`/ejercicios/leccion/${this.leccionId}`);
            
            console.log('📦 Respuesta completa de ejercicios:', response);
            
            if (response && response.success) {
                // ✅ CORRECCIÓN: El backend devuelve {success: true, data: [...]}
                // y api-client lo envuelve en {success: true, data: {success: true, data: [...]}}
                // Entonces necesitamos acceder a response.data.data
                if (response.data && response.data.success) {
                    this.ejercicios = response.data.data || [];
                } else {
                    this.ejercicios = response.data || [];
                }
                
                console.log(`✅ ${this.ejercicios.length} ejercicios cargados:`, this.ejercicios);
                
                if (this.ejercicios.length === 0) {
                    throw new Error('No se encontraron ejercicios para esta lección');
                }
            } else {
                const errorMsg = response ? response.error : 'No response from server';
                throw new Error(errorMsg || 'Error al cargar ejercicios');
            }
        } catch (error) {
            console.error('❌ Error cargando ejercicios:', error);
            throw new Error('No se pudieron cargar los ejercicios: ' + error.message);
        }
    }

    renderizarInterfaz() {
        const loadingState = document.getElementById('loading-state');
        const contenidoLeccion = document.getElementById('contenido-leccion');
        
        // Ocultar loading, mostrar contenido
        if (loadingState) loadingState.classList.add('hidden');
        if (contenidoLeccion) contenidoLeccion.classList.remove('hidden');
        
        // Renderizar header de lección
        contenidoLeccion.innerHTML = this.renderizarHeader();
        
        // Renderizar primer ejercicio
        this.renderizarEjercicioActual();
        
        // Agregar event listeners
        this.agregarEventListeners();
    }

    renderizarHeader() {
        const progreso = ((this.ejercicioActualIndex + 1) / this.ejercicios.length) * 100;
        
        return `
            <div class="mb-8">
                <div class="flex justify-between items-start mb-6">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            ${this.leccionData?.titulo || 'Lección ' + this.leccionId}
                        </h1>
                        <p class="text-gray-600 dark:text-gray-300 mb-3">
                            ${this.leccionData?.descripcion || 'Practica tus habilidades con estos ejercicios'}
                        </p>
                        <div class="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span class="flex items-center gap-1">
                                <i class="fas fa-layer-group"></i>
                                Nivel: ${this.leccionData?.nivel || 'N/A'}
                            </span>
                            <span class="flex items-center gap-1">
                                <i class="fas fa-language"></i>
                                Idioma: ${this.leccionData?.idioma || 'N/A'}
                            </span>
                            <span class="flex items-center gap-1">
                                <i class="fas fa-list-check"></i>
                                Ejercicios: ${this.ejercicios.length}
                            </span>
                        </div>
                    </div>
                    
                    <div class="text-right">
                        <div class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-semibold mb-2">
                            Ejercicio ${this.ejercicioActualIndex + 1} de ${this.ejercicios.length}
                        </div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">
                            ${this.ejerciciosCompletados.size} completados
                        </div>
                    </div>
                </div>
                
                <!-- Barra de progreso -->
                <div class="mb-6">
                    <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span>Progreso de la lección</span>
                        <span>${Math.round(progreso)}%</span>
                    </div>
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div id="barra-progreso" 
                             class="bg-blue-500 h-3 rounded-full transition-all duration-500"
                             style="width: ${progreso}%">
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Contenedor para ejercicios -->
            <div id="ejercicio-actual" class="ejercicio-container"></div>
        `;
    }

    renderizarEjercicioActual() {
        const ejercicio = this.ejercicios[this.ejercicioActualIndex];
        if (!ejercicio) {
            console.error('❌ No hay ejercicio en el índice:', this.ejercicioActualIndex);
            return;
        }

        console.log(`🎨 Renderizando ejercicio ${this.ejercicioActualIndex + 1}:`, ejercicio.tipo);

        const ejercicioContainer = document.getElementById('ejercicio-actual');
        if (!ejercicioContainer) {
            console.error('❌ No se encontró el contenedor de ejercicios');
            return;
        }
        
        // Verificar que EjercicioRenderer esté disponible
        if (typeof EjercicioRenderer === 'undefined') {
            ejercicioContainer.innerHTML = `
                <div class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                    <p class="text-red-700 dark:text-red-300">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        Error: EjercicioRenderer no está cargado
                    </p>
                </div>
            `;
            return;
        }
        
        // Usar EjercicioRenderer para renderizar el ejercicio
        const renderer = new EjercicioRenderer(ejercicio, ejercicioContainer);
        ejercicioContainer.innerHTML = renderer.renderizar();

        // Agregar controles de navegación
        ejercicioContainer.innerHTML += this.renderizarControles();

        // Actualizar barra de progreso
        this.actualizarBarraProgreso();
    }

    renderizarControles() {
        const esPrimero = this.ejercicioActualIndex === 0;
        const esUltimo = this.ejercicioActualIndex === this.ejercicios.length - 1;
        const estaCompletado = this.ejerciciosCompletados.has(this.ejercicioActualIndex);

        return `
            <div class="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button 
                    id="btn-anterior"
                    class="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    ${esPrimero ? 'disabled' : ''}
                >
                    <i class="fas fa-arrow-left"></i>
                    Anterior
                </button>
                
                <div class="flex gap-3">
                    <button 
                        id="btn-validar"
                        class="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                    >
                        <i class="fas fa-check-circle"></i>
                        Validar Respuesta
                    </button>
                    
                    <button 
                        id="btn-saltar"
                        class="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-2"
                    >
                        <i class="fas fa-forward"></i>
                        Saltar
                    </button>
                </div>
                
                <button 
                    id="btn-siguiente"
                    class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    ${esUltimo ? 'disabled' : ''}
                >
                    Siguiente
                    <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        `;
    }

    agregarEventListeners() {
        // Navegación
        setTimeout(() => {
            const btnAnterior = document.getElementById('btn-anterior');
            const btnSiguiente = document.getElementById('btn-siguiente');
            const btnValidar = document.getElementById('btn-validar');
            const btnSaltar = document.getElementById('btn-saltar');
            
            if (btnAnterior) {
                btnAnterior.onclick = () => this.navegarEjercicio(-1);
            }
            if (btnSiguiente) {
                btnSiguiente.onclick = () => this.navegarEjercicio(1);
            }
            if (btnValidar) {
                btnValidar.onclick = () => this.validarEjercicio();
            }
            if (btnSaltar) {
                btnSaltar.onclick = () => this.saltarEjercicio();
            }
        }, 100);
    }

    navegarEjercicio(direccion) {
        const nuevoIndex = this.ejercicioActualIndex + direccion;
        
        if (nuevoIndex >= 0 && nuevoIndex < this.ejercicios.length) {
            this.ejercicioActualIndex = nuevoIndex;
            
            // Actualizar header completo
            const contenidoLeccion = document.getElementById('contenido-leccion');
            if (contenidoLeccion) {
                contenidoLeccion.innerHTML = this.renderizarHeader();
                this.renderizarEjercicioActual();
                this.agregarEventListeners();
            }
        }
    }

    async validarEjercicio() {
        const ejercicio = this.ejercicios[this.ejercicioActualIndex];
        if (!ejercicio) return;

        try {
            console.log('🔍 Validando ejercicio...', ejercicio.id);

            // Recolectar respuestas del usuario
            const renderer = new EjercicioRenderer(ejercicio);
            const respuestasUsuario = renderer.recolectarRespuestas();
            
            if (!respuestasUsuario) {
                this.mostrarToast('Por favor, completa el ejercicio antes de validar.', 'warning');
                return;
            }

            // Mostrar loading
            const btnValidar = document.getElementById('btn-validar');
            if (btnValidar) {
                btnValidar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validando...';
                btnValidar.disabled = true;
            }

            // ✅ URL CORREGIDA - sin /api/ duplicado
            const response = await window.apiClient.post(`/ejercicios/${ejercicio.id}/validar`, respuestasUsuario);
            
            console.log('📨 Respuesta completa del servidor:', response);
            
            if (response && response.success) {
                // ✅ CORRECCIÓN: Extraer data del wrapper de api-client
                const resultadoReal = response.data || response;
                
                console.log('📦 Resultado extraído:', resultadoReal);
                
                // Mostrar resultados en los ejercicios
                renderer.mostrarResultados(resultadoReal);
                
                // Mostrar panel de resultados
                this.mostrarPanelResultados(resultadoReal, ejercicio);
                
                // Marcar como completado
                this.ejerciciosCompletados.add(this.ejercicioActualIndex);

                // 🎯 TRACKING: Guardar resultado y XP
                const esCorrecta = resultadoReal.esCorrecta || resultadoReal.data?.correcto;
                const puntuacion = resultadoReal.puntuacion || resultadoReal.data?.puntuacion_obtenida || 0;
                const puntosMaximos = resultadoReal.puntuacionMaxima || resultadoReal.data?.puntuacion_maxima || ejercicio.puntos_maximos || 10;

                this.ejerciciosValidados.push({
                    ejercicio_id: ejercicio.id,
                    correcto: esCorrecta,
                    puntuacion: puntuacion
                });

                if (esCorrecta) {
                    this.ejerciciosCorrectos++;
                    this.xpAcumulado += puntuacion;
                    console.log(`🎉 XP acumulado: ${this.xpAcumulado} (+${puntuacion})`);
                }

                // 🎯 DETECTAR ÚLTIMO EJERCICIO
                const esUltimo = this.ejercicioActualIndex === this.ejercicios.length - 1;
                if (esUltimo && this.ejerciciosValidados.length === this.ejercicios.length) {
                    console.log('🏁 Último ejercicio completado - preparando finalización...');
                    setTimeout(() => this.finalizarLeccion(), 2000);
                }

                console.log('📊 Datos para toast:', {esCorrecta, puntuacion, puntosMaximos});
                
                if (esCorrecta) {
                    this.mostrarToast(`✅ ¡Correcto! Obtuviste ${puntuacion}/${puntosMaximos} puntos.`, 'success');
                } else {
                    this.mostrarToast(`📝 Obtuviste ${puntuacion}/${puntosMaximos} puntos. Revisa las respuestas correctas.`, 'warning');
                }
                
            } else {
                const errorMsg = response ? response.error : 'Error desconocido';
                this.mostrarToast(errorMsg || 'Error al validar el ejercicio', 'error');
            }

        } catch (error) {
            console.error('❌ Error validando ejercicio:', error);
            this.mostrarToast('Error al validar el ejercicio: ' + error.message, 'error');
        } finally {
            // Restaurar botón
            const btnValidar = document.getElementById('btn-validar');
            if (btnValidar) {
                btnValidar.innerHTML = '<i class="fas fa-check-circle"></i> Validar Respuesta';
                btnValidar.disabled = false;
            }
        }
    }

    mostrarPanelResultados(resultado, ejercicio) {
        console.log('🎨 mostrarPanelResultados - resultado completo:', resultado);
        console.log('🎨 mostrarPanelResultados - ejercicio:', ejercicio);
        
        const esCorrecta = resultado.esCorrecta || resultado.data?.correcto;
        const puntuacion = resultado.puntuacion || resultado.data?.puntuacion_obtenida || 0;
        const puntosMaximos = resultado.puntuacionMaxima || resultado.data?.puntuacion_maxima || ejercicio.puntos_maximos || 10;
        const porcentaje = Math.round((puntuacion / puntosMaximos) * 100);
        
        console.log('📊 Valores extraídos:');
        console.log('  - esCorrecta:', esCorrecta);
        console.log('  - puntuacion:', puntuacion);
        console.log('  - puntosMaximos:', puntosMaximos);
        console.log('  - porcentaje:', porcentaje);
        
        const ejercicioContainer = document.getElementById('ejercicio-actual');
        if (!ejercicioContainer) {
            console.error('❌ No se encontró ejercicioContainer');
            return;
        }
        
        // Remover panel de resultados previo si existe
        const panelExistente = ejercicioContainer.querySelector('.panel-resultados');
        if (panelExistente) {
            panelExistente.remove();
        }
        
        // Crear panel de resultados
        const panelResultados = document.createElement('div');
        panelResultados.className = `panel-resultados mt-6 p-6 rounded-lg border-2 ${
            esCorrecta 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-500' 
                : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
        }`;
        
        panelResultados.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <div class="text-4xl">
                        ${esCorrecta ? '🎉' : '📝'}
                    </div>
                    <div>
                        <h3 class="text-xl font-bold ${esCorrecta ? 'text-green-700 dark:text-green-400' : 'text-yellow-700 dark:text-yellow-400'}">
                            ${esCorrecta ? '¡Excelente trabajo!' : '¡Buen intento!'}
                        </h3>
                        <p class="text-gray-600 dark:text-gray-300 mt-1">
                            ${esCorrecta 
                                ? 'Has completado este ejercicio correctamente' 
                                : 'Revisa las respuestas marcadas en verde para aprender'}
                        </p>
                    </div>
                </div>
                <div class="text-center">
                    <div class="text-3xl font-bold ${esCorrecta ? 'text-green-600' : 'text-yellow-600'}">
                        ${puntuacion}/${puntosMaximos}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                        ${porcentaje}% correcto
                    </div>
                </div>
            </div>
            ${resultado.explicacion || resultado.data?.explicacion ? `
                <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p class="text-sm text-gray-600 dark:text-gray-300">
                        <i class="fas fa-lightbulb mr-2"></i>
                        ${resultado.explicacion || resultado.data?.explicacion}
                    </p>
                </div>
            ` : ''}
        `;
        
        // Insertar antes de los controles
        const controles = ejercicioContainer.querySelector('.flex.justify-between.items-center.mt-8');
        if (controles) {
            controles.parentNode.insertBefore(panelResultados, controles);
            console.log('✅ Panel de resultados insertado correctamente');
        } else {
            console.error('❌ No se encontraron los controles');
        }
    }

    saltarEjercicio() {
        if (confirm('¿Estás seguro de que quieres saltar este ejercicio? Podrás volver a intentarlo más tarde.')) {
            this.navegarEjercicio(1);
        }
    }

    async finalizarLeccion() {
        try {
            console.log('🏁 Finalizando lección...');
            
            const totalEjercicios = this.ejercicios.length;
            const porcentaje = Math.round((this.ejerciciosCorrectos / totalEjercicios) * 100);
            
            console.log(`📊 Estadísticas finales:`);
            console.log(`   - Correctos: ${this.ejerciciosCorrectos}/${totalEjercicios}`);
            console.log(`   - Porcentaje: ${porcentaje}%`);
            console.log(`   - XP acumulado: ${this.xpAcumulado}`);
            
            // Llamar al endpoint de completar lección
            const response = await window.apiClient.post(`/lecciones/${this.leccionId}/completar`, {
                ejercicios_correctos: this.ejerciciosCorrectos,
                total_ejercicios: totalEjercicios,
                xp_acumulado: this.xpAcumulado
            });
            
            console.log('📨 Respuesta completar lección:', response);
            
            if (response && response.success) {
                // ✅ SOLUCIÓN CORREGIDA - Manejar estructura anidada
                const respuestaBackend = response.data;
                
                console.log('📦 Respuesta del backend:', respuestaBackend);
                
                // Extraer aprobado del primer nivel y datos del nivel interno
                const aprobado = respuestaBackend.aprobado;
                const datos = respuestaBackend.data || {};
                
                console.log('✅ Aprobado:', aprobado);
                console.log('📊 Datos completos:', datos);
                
                // Combinar datos esenciales para el modal
                const datosModal = {
                    porcentaje: datos.porcentaje || porcentaje,
                    ejercicios_correctos: datos.ejercicios_correctos || this.ejerciciosCorrectos,
                    total_ejercicios: datos.total_ejercicios || totalEjercicios,
                    xp_total: datos.xp_total || datos.xp_ejercicios || this.xpAcumulado,
                    xp_bonus: datos.xp_bonus || 0,
                    xp_ejercicios: datos.xp_ejercicios || this.xpAcumulado,
                    logros_desbloqueados: datos.logros_desbloqueados || [],
                    hint_ganado: datos.hint_ganado || false,
                    // Preservar otros datos que puedan venir del backend
                    ...datos
                };
                
                console.log('🎯 Datos para modal:', datosModal);
                
                if (aprobado) {
                    this.mostrarModalAprobado(datosModal);
                } else {
                    this.mostrarModalReprobado(datosModal);
                }
            } else {
                console.error('❌ Error en respuesta del servidor:', response);
                
                // ✅ FALLBACK: Usar datos locales si el servidor falla
                const datosFallback = {
                    porcentaje: porcentaje,
                    ejercicios_correctos: this.ejerciciosCorrectos,
                    total_ejercicios: totalEjercicios,
                    xp_total: this.xpAcumulado,
                    xp_ejercicios: this.xpAcumulado,
                    xp_bonus: 0,
                    logros_desbloqueados: [],
                    hint_ganado: false
                };
                
                // Determinar aprobación local (60% mínimo)
                const aprobadoLocal = porcentaje >= 60;
                
                if (aprobadoLocal) {
                    this.mostrarModalAprobado(datosFallback);
                } else {
                    this.mostrarModalReprobado(datosFallback);
                }
            }
            
        } catch (error) {
            console.error('❌ Error finalizando lección:', error);
            
            // ✅ FALLBACK: Usar datos locales en caso de error
            const totalEjercicios = this.ejercicios.length;
            const porcentaje = Math.round((this.ejerciciosCorrectos / totalEjercicios) * 100);
            
            const datosFallback = {
                porcentaje: porcentaje,
                ejercicios_correctos: this.ejerciciosCorrectos,
                total_ejercicios: totalEjercicios,
                xp_total: this.xpAcumulado,
                xp_ejercicios: this.xpAcumulado,
                xp_bonus: 0,
                logros_desbloqueados: [],
                hint_ganado: false
            };
            
            const aprobadoLocal = porcentaje >= 60;
            
            if (aprobadoLocal) {
                this.mostrarModalAprobado(datosFallback);
            } else {
                this.mostrarModalReprobado(datosFallback);
            }
            
            this.mostrarToast('Error al finalizar la lección: ' + error.message, 'error');
        }
    }

    mostrarModalAprobado(datos) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 animate-bounce-in">
                <div class="text-center">
                    <div class="text-6xl mb-4">🎉</div>
                    <h2 class="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                        ¡Felicidades!
                    </h2>
                    <p class="text-xl text-gray-700 dark:text-gray-300 mb-2">
                        Lección Completada
                    </p>
                    <p class="text-gray-600 dark:text-gray-400 mb-6">
                        Has aprobado con ${datos.porcentaje}%
                    </p>
                    
                    <!-- Logros desbloqueados -->
                    ${datos.logros_desbloqueados && datos.logros_desbloqueados.length > 0 ? `
                        <div class="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 rounded-lg p-4 mb-4">
                            <div class="text-lg font-bold text-yellow-700 dark:text-yellow-300 mb-2">
                                🏆 ¡Nuevos Logros Desbloqueados!
                            </div>
                            ${datos.logros_desbloqueados.map(logro => `
                                <div class="flex items-center gap-3 bg-white dark:bg-gray-700 rounded-lg p-3 mb-2">
                                    <div class="text-3xl">${logro.icono}</div>
                                    <div class="text-left">
                                        <div class="font-bold text-gray-800 dark:text-white">${logro.titulo}</div>
                                        <div class="text-sm text-gray-600 dark:text-gray-300">${logro.descripcion}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6">
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <div class="text-gray-500 dark:text-gray-400">Ejercicios correctos</div>
                                <div class="text-xl font-bold text-green-600">${datos.ejercicios_correctos}/${datos.total_ejercicios}</div>
                            </div>
                            <div>
                                <div class="text-gray-500 dark:text-gray-400">XP ganado</div>
                                <div class="text-xl font-bold text-purple-600">+${datos.xp_total}</div>
                            </div>
                        </div>
                        ${datos.xp_bonus > 0 ? `
                            <div class="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
                                <div class="text-sm text-green-600 dark:text-green-400 font-semibold">
                                    🎁 Bonus: +${datos.xp_bonus} XP
                                </div>
                            </div>
                        ` : ''}
                        ${datos.hint_ganado ? `
                            <div class="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
                                <div class="text-sm text-blue-600 dark:text-blue-400 font-semibold flex items-center justify-center gap-2">
                                    💡 +1 Hint desbloqueado
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="flex gap-3">
                        <button onclick="window.location.href='http://127.0.0.1:3000/pages/estudiante/lecciones.html'" 
                                class="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold">
                            🚀 Seguir Aprendiendo
                        </button>
                        <button onclick="window.location.reload()" 
                                class="flex-1 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                            🔄 Reintentar
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Cerrar modal al hacer click fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    mostrarModalReprobado(datos) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4">
                <div class="text-center">
                    <div class="text-6xl mb-4">📝</div>
                    <h2 class="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
                        ¡Sigue Practicando!
                    </h2>
                    <p class="text-gray-600 dark:text-gray-300 mb-6">
                        Obtuviste ${datos.porcentaje}% - Necesitas 60% para aprobar
                    </p>
                    
                    <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-6">
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <div class="text-gray-500 dark:text-gray-400">Ejercicios correctos</div>
                                <div class="text-xl font-bold text-yellow-600">${datos.ejercicios_correctos}/${datos.total_ejercicios}</div>
                            </div>
                            <div>
                                <div class="text-gray-500 dark:text-gray-400">XP ganado</div>
                                <div class="text-xl font-bold text-purple-600">+${datos.xp_total}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex gap-3">
                        <button onclick="window.location.href='http://127.0.0.1:3000/pages/estudiante/lecciones.html'" 
                                class="flex-1 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                            Ver Catálogo
                        </button>
                        <button onclick="window.location.reload()" 
                                class="flex-1 px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors">
                            Reintentar Lección
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Cerrar modal al hacer click fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    async guardarProgreso(ejercicioId, puntuacion, respuestas) {
        try {
            // ✅ URL CORREGIDA - sin /api/ duplicado
            const response = await window.apiClient.post('/progreso/registrar', {
                ejercicio_id: ejercicioId,
                puntuacion_obtenida: puntuacion,
                respuestas_usuario: respuestas,
                completado_en: new Date().toISOString()
            });
            
            if (response && response.success) {
                console.log('✅ Progreso guardado correctamente');
            } else {
                console.warn('⚠️ No se pudo guardar el progreso:', response?.error);
            }
        } catch (error) {
            console.error('❌ Error guardando progreso:', error);
        }
    }

    actualizarBarraProgreso() {
        const barra = document.getElementById('barra-progreso');
        if (barra) {
            const progreso = ((this.ejercicioActualIndex + 1) / this.ejercicios.length) * 100;
            barra.style.width = `${progreso}%`;
        }
    }

    mostrarToast(mensaje, tipo = 'info') {
        // Usar el sistema de toasts global si está disponible
        if (window.mostrarToast) {
            window.mostrarToast(mensaje, tipo);
        } else {
            // Toast simple de respaldo
            console.log(`📢 ${tipo.toUpperCase()}: ${mensaje}`);
            alert(mensaje); // Temporal - reemplazar con sistema de toasts
        }
    }

    mostrarError(mensaje) {
        const loadingState = document.getElementById('loading-state');
        const errorState = document.getElementById('error-state');
        const errorMessage = document.getElementById('error-message');
        
        if (loadingState) loadingState.classList.add('hidden');
        if (errorState) errorState.classList.remove('hidden');
        if (errorMessage) errorMessage.textContent = mensaje;
        
        console.error('❌ Error:', mensaje);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM cargado - Iniciando LeccionActiva...');
    
    // Pequeño delay para asegurar que todo esté cargado
    setTimeout(() => {
        if (window.apiClient) {
            new LeccionActiva();
        } else {
            console.error('❌ apiClient no disponible después de 1 segundo');
            const errorMessage = document.getElementById('error-message');
            const loadingState = document.getElementById('loading-state');
            const errorState = document.getElementById('error-state');
            
            if (errorMessage) errorMessage.textContent = 'Error de configuración del sistema. Recarga la página.';
            if (loadingState) loadingState.classList.add('hidden');
            if (errorState) errorState.classList.remove('hidden');
        }
    }, 100);
});

console.log('✅ leccion-activa.js cargado - esperando DOM...');

// Hacer disponible globalmente para debugging
window.LeccionActiva = LeccionActiva;