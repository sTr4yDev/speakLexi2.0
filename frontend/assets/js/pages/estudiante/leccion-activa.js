// frontend/assets/js/pages/estudiante/leccion-activa.js
import { apiClient } from '../../core/api-client.js';

class LeccionActiva {
    constructor() {
        this.leccionId = new URLSearchParams(window.location.search).get('id');
        this.leccion = null;
        this.ejercicios = [];
        this.ejercicioActual = 0;
        this.respuestas = {};
        this.progreso = 0;
        this.init();
    }

    async init() {
        try {
            await this.cargarLeccion();
            await this.cargarEjercicios();
            this.configurarEventListeners();
            this.renderizar();
        } catch (error) {
            console.error('Error inicializando lección:', error);
            this.mostrarError('Error al cargar la lección');
        }
    }

    async cargarLeccion() {
        try {
            const response = await apiClient.get(`/lecciones/${this.leccionId}`);
            this.leccion = response.data;
            
            // Cargar progreso actual si existe
            if (this.leccion.progreso) {
                this.progreso = this.leccion.progreso;
            }
        } catch (error) {
            console.error('Error cargando lección:', error);
            throw new Error('No se pudo cargar la lección');
        }
    }

    async cargarEjercicios() {
        try {
            const response = await apiClient.get(`/ejercicios/leccion/${this.leccionId}`);
            this.ejercicios = response.data;
        } catch (error) {
            console.error('Error cargando ejercicios:', error);
            this.ejercicios = [];
        }
    }

    configurarEventListeners() {
        // Navegación entre ejercicios
        document.addEventListener('click', (e) => {
            if (e.target.id === 'btn-ejercicio-anterior') {
                this.ejercicioAnterior();
            }
            if (e.target.id === 'btn-ejercicio-siguiente') {
                this.ejercicioSiguiente();
            }
            if (e.target.id === 'btn-completar-leccion') {
                this.completarLeccion();
            }
            if (e.target.id === 'btn-guardar-progreso') {
                this.guardarProgreso();
            }
        });

        // Teclado shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' && this.ejercicioActual > 0) {
                this.ejercicioAnterior();
            }
            if (e.key === 'ArrowRight' && this.ejercicioActual < this.ejercicios.length - 1) {
                this.ejercicioSiguiente();
            }
        });
    }

    renderizar() {
        const container = document.getElementById('contenido-leccion');
        if (!container) {
            console.error('Contenedor de lección no encontrado');
            return;
        }

        container.innerHTML = this.generarEstructuraLeccion();
        this.renderizarEjercicio();
        this.actualizarNavegacion();
    }

    generarEstructuraLeccion() {
        return `
            <!-- Header de la lección -->
            <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-800 mb-2">${this.leccion.titulo}</h1>
                        <p class="text-gray-600">${this.leccion.descripcion || ''}</p>
                    </div>
                    <div class="text-right">
                        <div class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                            ${this.leccion.nivel || 'General'}
                        </div>
                        <div class="text-sm text-gray-500 mt-1">Duración: ${this.leccion.duracion_estimada || 'N/A'}</div>
                    </div>
                </div>

                <!-- Barra de progreso general -->
                <div class="mb-4">
                    <div class="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Progreso de la lección</span>
                        <span>${this.progreso}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-3">
                        <div class="bg-blue-500 h-3 rounded-full transition-all duration-500" 
                             style="width: ${this.progreso}%"></div>
                    </div>
                </div>

                <!-- Progreso de ejercicios -->
                ${this.ejercicios.length > 0 ? `
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-600">
                            Ejercicio ${this.ejercicioActual + 1} de ${this.ejercicios.length}
                        </span>
                        <div class="flex gap-1">
                            ${this.ejercicios.map((_, index) => `
                                <div class="w-3 h-3 rounded-full ${
                                    index === this.ejercicioActual ? 'bg-blue-500' : 
                                    index < this.ejercicioActual ? 'bg-green-500' : 'bg-gray-300'
                                }"></div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>

            <!-- Contenido de la lección -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Columna principal - Contenido -->
                <div class="lg:col-span-2">
                    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 class="text-2xl font-bold text-gray-800 mb-4">Contenido</h2>
                        <div class="prose max-w-none">
                            ${this.leccion.contenido || '<p class="text-gray-500">No hay contenido disponible para esta lección.</p>'}
                        </div>
                    </div>

                    <!-- Ejercicios -->
                    ${this.ejercicios.length > 0 ? `
                        <div class="bg-white rounded-lg shadow-md p-6">
                            <div class="flex justify-between items-center mb-6">
                                <h2 class="text-2xl font-bold text-gray-800">Ejercicios</h2>
                                <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                                    ${this.ejercicios.length} ejercicio${this.ejercicios.length > 1 ? 's' : ''}
                                </span>
                            </div>
                            
                            <div id="ejercicios-container" class="mb-6">
                                <!-- Los ejercicios se renderizan aquí -->
                            </div>

                            <!-- Navegación entre ejercicios -->
                            <div class="flex justify-between items-center pt-4 border-t border-gray-200">
                                <button 
                                    id="btn-ejercicio-anterior"
                                    class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                    ${this.ejercicioActual === 0 ? 'disabled' : ''}>
                                    ← Anterior
                                </button>
                                
                                <div class="flex gap-2">
                                    <button 
                                        id="btn-guardar-progreso"
                                        class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                                        Guardar Progreso
                                    </button>
                                    
                                    ${this.ejercicioActual === this.ejercicios.length - 1 ? `
                                        <button 
                                            id="btn-completar-leccion"
                                            class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                                            Completar Lección
                                        </button>
                                    ` : `
                                        <button 
                                            id="btn-ejercicio-siguiente"
                                            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                                            Siguiente →
                                        </button>
                                    `}
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                            <p class="text-yellow-700">No hay ejercicios disponibles para esta lección.</p>
                        </div>
                    `}
                </div>

                <!-- Columna lateral - Información y recursos -->
                <div class="lg:col-span-1">
                    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h3 class="text-xl font-bold text-gray-800 mb-4">Información de la Lección</h3>
                        <div class="space-y-3">
                            <div class="flex justify-between">
                                <span class="text-gray-600">Nivel:</span>
                                <span class="font-medium">${this.leccion.nivel || 'No especificado'}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Idioma:</span>
                                <span class="font-medium">${this.leccion.idioma || 'No especificado'}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Duración:</span>
                                <span class="font-medium">${this.leccion.duracion_estimada || 'N/A'}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Estado:</span>
                                <span class="font-medium ${this.leccion.completada ? 'text-green-600' : 'text-blue-600'}">
                                    ${this.leccion.completada ? 'Completada' : 'En progreso'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Recursos adicionales -->
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <h3 class="text-xl font-bold text-gray-800 mb-4">Recursos</h3>
                        <div class="space-y-3">
                            <button class="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                                <div class="flex items-center gap-3">
                                    <i class="fas fa-book text-blue-500"></i>
                                    <span>Material de estudio</span>
                                </div>
                            </button>
                            <button class="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                                <div class="flex items-center gap-3">
                                    <i class="fas fa-download text-green-500"></i>
                                    <span>Descargar PDF</span>
                                </div>
                            </button>
                            <button class="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                                <div class="flex items-center gap-3">
                                    <i class="fas fa-video text-purple-500"></i>
                                    <span>Video explicativo</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderizarEjercicio() {
        const ejercicio = this.ejercicios[this.ejercicioActual];
        if (!ejercicio) return;

        const container = document.getElementById('ejercicios-container');
        if (!container) return;

        try {
            const contenido = typeof ejercicio.contenido === 'string' 
                ? JSON.parse(ejercicio.contenido) 
                : ejercicio.contenido;

            let componente = '';

            // Sistema básico de renderizado de ejercicios
            switch (ejercicio.tipo) {
                case 'multiple_choice':
                    componente = this.crearEjercicioMultipleChoice(ejercicio, contenido);
                    break;
                case 'fill_blank':
                    componente = this.crearEjercicioCompletar(ejercicio, contenido);
                    break;
                case 'matching':
                    componente = this.crearEjercicioEmparejar(ejercicio, contenido);
                    break;
                case 'writing':
                    componente = this.crearEjercicioEscritura(ejercicio, contenido);
                    break;
                default:
                    componente = this.crearEjercicioGenerico(ejercicio, contenido);
            }

            container.innerHTML = componente;
            this.configurarEventosEjercicio(ejercicio);
        } catch (error) {
            console.error('Error renderizando ejercicio:', error);
            container.innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p class="text-red-700">Error al cargar el ejercicio: ${error.message}</p>
                </div>
            `;
        }
    }

    crearEjercicioMultipleChoice(ejercicio, contenido) {
        const opciones = contenido.opciones || [];
        const respuestaGuardada = this.respuestas[ejercicio.id];

        return `
            <div class="exercise-container" data-ejercicio-id="${ejercicio.id}">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">${contenido.pregunta || 'Selecciona la respuesta correcta:'}</h3>
                
                <div class="space-y-3">
                    ${opciones.map((opcion, index) => `
                        <label class="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                            respuestaGuardada === index ? 'bg-blue-50 border-blue-300' : ''
                        }">
                            <input 
                                type="radio" 
                                name="opcion-${ejercicio.id}" 
                                value="${index}" 
                                class="mr-3" 
                                ${respuestaGuardada === index ? 'checked' : ''}
                                onchange="leccionActiva.guardarRespuesta(${ejercicio.id}, ${index})">
                            <span class="flex-1">${opcion}</span>
                        </label>
                    `).join('')}
                </div>

                ${contenido.explicacion ? `
                    <div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p class="text-sm text-yellow-700">💡 ${contenido.explicacion}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    crearEjercicioCompletar(ejercicio, contenido) {
        const texto = contenido.texto || '';
        const espacios = contenido.espacios || [];
        const respuestaGuardada = this.respuestas[ejercicio.id] || {};

        return `
            <div class="exercise-container" data-ejercicio-id="${ejercicio.id}">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Completa los espacios en blanco:</h3>
                
                <div class="p-4 bg-gray-50 rounded-lg mb-4">
                    <p class="text-gray-700 leading-relaxed" id="texto-completar">
                        ${texto.split('___').map((parte, index) => {
                            if (index === texto.split('___').length - 1) return parte;
                            const espacio = espacios[index] || {};
                            return `
                                ${parte}
                                <input 
                                    type="text" 
                                    class="inline-block w-32 mx-1 px-2 py-1 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    placeholder="${espacio.pista || '...'}"
                                    value="${respuestaGuardada[index] || ''}"
                                    onchange="leccionActiva.guardarRespuestaEspacio(${ejercicio.id}, ${index}, this.value)">
                            `;
                        }).join('')}
                    </p>
                </div>

                ${contenido.explicacion ? `
                    <div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p class="text-sm text-yellow-700">💡 ${contenido.explicacion}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    crearEjercicioEmparejar(ejercicio, contenido) {
        const pares = contenido.pares || [];
        const respuestaGuardada = this.respuestas[ejercicio.id] || {};

        return `
            <div class="exercise-container" data-ejercicio-id="${ejercicio.id}">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Empareja las columnas:</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-2">
                        <h4 class="font-medium text-gray-700">Columna A</h4>
                        ${pares.map((par, index) => `
                            <div class="p-2 bg-blue-50 rounded border border-blue-200">
                                ${par.left}
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="space-y-2">
                        <h4 class="font-medium text-gray-700">Columna B</h4>
                        ${pares.map((par, index) => `
                            <select 
                                class="w-full p-2 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                onchange="leccionActiva.guardarRespuestaEmparejar(${ejercicio.id}, ${index}, this.value)">
                                <option value="">Selecciona...</option>
                                ${pares.map((_, optIndex) => `
                                    <option value="${optIndex}" ${respuestaGuardada[index] == optIndex ? 'selected' : ''}>
                                        ${pares[optIndex].right}
                                    </option>
                                `).join('')}
                            </select>
                        `).join('')}
                    </div>
                </div>

                ${contenido.explicacion ? `
                    <div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p class="text-sm text-yellow-700">💡 ${contenido.explicacion}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    crearEjercicioEscritura(ejercicio, contenido) {
        const respuestaGuardada = this.respuestas[ejercicio.id] || '';

        return `
            <div class="exercise-container" data-ejercicio-id="${ejercicio.id}">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">${contenido.consigna || 'Escribe tu respuesta:'}</h3>
                
                <textarea 
                    class="w-full h-32 p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                    placeholder="${contenido.placeholder || 'Escribe tu respuesta aquí...'}"
                    oninput="leccionActiva.guardarRespuestaEscritura(${ejercicio.id}, this.value)"
                >${respuestaGuardada}</textarea>

                ${contenido.explicacion ? `
                    <div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p class="text-sm text-yellow-700">💡 ${contenido.explicacion}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    crearEjercicioGenerico(ejercicio, contenido) {
        return `
            <div class="exercise-container" data-ejercicio-id="${ejercicio.id}">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">${contenido.pregunta || 'Ejercicio'}</h3>
                <p class="text-gray-600">Tipo de ejercicio no soportado: ${ejercicio.tipo}</p>
            </div>
        `;
    }

    configurarEventosEjercicio(ejercicio) {
        // Eventos específicos del ejercicio pueden ir aquí
    }

    // Métodos para guardar respuestas
    guardarRespuesta(ejercicioId, respuesta) {
        this.respuestas[ejercicioId] = respuesta;
        this.actualizarProgresoEjercicios();
    }

    guardarRespuestaEspacio(ejercicioId, espacioIndex, valor) {
        if (!this.respuestas[ejercicioId]) {
            this.respuestas[ejercicioId] = {};
        }
        this.respuestas[ejercicioId][espacioIndex] = valor;
        this.actualizarProgresoEjercicios();
    }

    guardarRespuestaEmparejar(ejercicioId, parIndex, valor) {
        if (!this.respuestas[ejercicioId]) {
            this.respuestas[ejercicioId] = {};
        }
        this.respuestas[ejercicioId][parIndex] = parseInt(valor);
        this.actualizarProgresoEjercicios();
    }

    guardarRespuestaEscritura(ejercicioId, valor) {
        this.respuestas[ejercicioId] = valor;
        this.actualizarProgresoEjercicios();
    }

    actualizarProgresoEjercicios() {
        const ejerciciosCompletados = Object.keys(this.respuestas).length;
        const nuevoProgreso = Math.min(100, Math.floor((ejerciciosCompletados / this.ejercicios.length) * 100));
        
        if (nuevoProgreso > this.progreso) {
            this.progreso = nuevoProgreso;
            this.actualizarBarraProgreso();
        }
    }

    actualizarBarraProgreso() {
        const barra = document.querySelector('.bg-blue-500');
        if (barra) {
            barra.style.width = `${this.progreso}%`;
        }
        
        const textoProgreso = document.querySelector('.flex.justify-between.text-sm span:last-child');
        if (textoProgreso) {
            textoProgreso.textContent = `${this.progreso}%`;
        }
    }

    ejercicioAnterior() {
        if (this.ejercicioActual > 0) {
            this.ejercicioActual--;
            this.renderizarEjercicio();
            this.actualizarNavegacion();
        }
    }

    ejercicioSiguiente() {
        if (this.ejercicioActual < this.ejercicios.length - 1) {
            this.ejercicioActual++;
            this.renderizarEjercicio();
            this.actualizarNavegacion();
        }
    }

    actualizarNavegacion() {
        const btnAnterior = document.getElementById('btn-ejercicio-anterior');
        const btnSiguiente = document.getElementById('btn-ejercicio-siguiente');
        const btnCompletar = document.getElementById('btn-completar-leccion');

        if (btnAnterior) {
            btnAnterior.disabled = this.ejercicioActual === 0;
        }

        if (btnSiguiente) {
            btnSiguiente.style.display = this.ejercicioActual < this.ejercicios.length - 1 ? 'block' : 'none';
        }

        if (btnCompletar) {
            btnCompletar.style.display = this.ejercicioActual === this.ejercicios.length - 1 ? 'block' : 'none';
        }

        // Actualizar indicadores de progreso
        const indicadores = document.querySelectorAll('.w-3.h-3.rounded-full');
        indicadores.forEach((ind, index) => {
            ind.className = `w-3 h-3 rounded-full ${
                index === this.ejercicioActual ? 'bg-blue-500' : 
                index < this.ejercicioActual ? 'bg-green-500' : 'bg-gray-300'
            }`;
        });
    }

    async guardarProgreso() {
        try {
            await apiClient.put(`/progreso/leccion/${this.leccionId}`, {
                progreso: this.progreso,
                completada: this.progreso === 100
            });

            this.mostrarMensaje('Progreso guardado correctamente', 'success');
        } catch (error) {
            console.error('Error guardando progreso:', error);
            this.mostrarMensaje('Error al guardar el progreso', 'error');
        }
    }

    async completarLeccion() {
        if (confirm('¿Estás seguro de que quieres marcar esta lección como completada?')) {
            try {
                await apiClient.put(`/progreso/leccion/${this.leccionId}`, {
                    progreso: 100,
                    completada: true
                });

                this.mostrarMensaje('¡Lección completada!', 'success');
                setTimeout(() => {
                    window.location.href = '/pages/estudiante/estudiante-dashboard.html';
                }, 1500);
            } catch (error) {
                console.error('Error completando lección:', error);
                this.mostrarMensaje('Error al completar la lección', 'error');
            }
        }
    }

    mostrarMensaje(mensaje, tipo = 'info') {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            tipo === 'success' ? 'bg-green-500 text-white' :
            tipo === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        notification.textContent = mensaje;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    mostrarError(mensaje) {
        const container = document.getElementById('contenido-leccion');
        if (container) {
            container.innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <p class="text-red-700 mb-4">${mensaje}</p>
                    <button 
                        onclick="window.location.href = '/pages/estudiante/estudiante-dashboard.html'"
                        class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                        Volver al Dashboard
                    </button>
                </div>
            `;
        }
    }
}

// Inicializar lección activa
const leccionActiva = new LeccionActiva();
window.leccionActiva = leccionActiva;