// frontend/assets/js/pages/estudiante/leccion-activa.js

class LeccionActiva {
    constructor() {
        this.leccionId = null;
        this.leccionData = null;
        this.ejercicios = [];
        this.ejercicioActualIndex = 0;
        this.respuestasUsuario = {};
        this.ejerciciosCompletados = new Set();
        
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
            
            // ✅ URL CORREGIDA - sin /api/ duplicado
            const response = await window.apiClient.get(`/ejercicios/leccion/${this.leccionId}`);
            
            if (response && response.success) {
                this.ejercicios = response.data || [];
                console.log(`✅ ${this.ejercicios.length} ejercicios cargados`);
                
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
            
            if (response && response.success) {
                // Mostrar resultados
                renderer.mostrarResultados(response.data);
                
                // Marcar como completado
                this.ejerciciosCompletados.add(this.ejercicioActualIndex);
                
                // Mostrar mensaje de éxito
                const puntuacion = response.data.puntuacion_obtenida || 0;
                const puntosMaximos = ejercicio.puntos_maximos || 10;
                this.mostrarToast(`¡Correcto! Obtuviste ${puntuacion}/${puntosMaximos} puntos.`, 'success');
                
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

    saltarEjercicio() {
        if (confirm('¿Estás seguro de que quieres saltar este ejercicio? Podrás volver a intentarlo más tarde.')) {
            this.navegarEjercicio(1);
        }
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