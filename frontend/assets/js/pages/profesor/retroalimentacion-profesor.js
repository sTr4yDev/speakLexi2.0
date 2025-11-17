/* ============================================
   SPEAKLEXI - GESTIÓN DE RETROALIMENTACIÓN (PROFESOR) - CON DATOS REALES
   Archivo: assets/js/pages/profesor/retroalimentacion-profesor.js
   UC-14: Gestionar retroalimentación - CON DATOS REALES
   ============================================ */

class RetroalimentacionProfesor {
    constructor() {
        this.API_URL = window.APP_CONFIG?.API?.API_URL || 'http://localhost:5000/api';
        this.token = localStorage.getItem('token');
        this.estado = {
            estudiantes: [],
            ejerciciosPendientes: [],
            retroalimentaciones: [],
            estudianteSeleccionado: null,
            ejercicioSeleccionado: null,
            filtroBusqueda: ''
        };
        this.init();
    }

    async init() {
        try {
            console.log('✅ Módulo Retroalimentación Profesor iniciando...');
            
            await this.verificarAutenticacion();
            await this.cargarDatos();
            this.configurarEventListeners();
            
            console.log('✅ Módulo Retroalimentación Profesor listo');
        } catch (error) {
            console.error('💥 Error inicializando módulo:', error);
            this.mostrarError('Error al cargar el módulo de retroalimentación');
        }
    }

    async verificarAutenticacion() {
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
        
        if (!usuario || !usuario.id) {
            window.location.href = '/pages/auth/login.html';
            throw new Error('Usuario no autenticado');
        }

        if (usuario.rol !== 'profesor' && usuario.rol !== 'admin') {
            window.location.href = '/pages/estudiante/dashboard.html';
            throw new Error('Acceso denegado: rol no autorizado');
        }

        if (!this.token) {
            window.location.href = '/pages/auth/login.html';
            throw new Error('Token no disponible');
        }
    }

    // ELEMENTOS DOM
    get elementos() {
        return {
            // Panel lateral
            listaEjercicios: document.getElementById('lista-ejercicios'),
            buscadorEjercicios: document.getElementById('buscador-ejercicios'),
            loadingEjercicios: document.getElementById('loading-ejercicios'),
            estadoVacioEjercicios: document.getElementById('estado-vacio-ejercicios'),
            contadorPendientes: document.getElementById('contador-pendientes'),
            
            // Panel principal
            ejercicioSeleccionadoInfo: document.getElementById('ejercicio-seleccionado-info'),
            ejercicioSeleccionadoContenido: document.getElementById('ejercicio-seleccionado-contenido'),
            estadoVacioEjercicio: document.getElementById('estado-vacio-ejercicio'),
            loadingEjercicio: document.getElementById('loading-ejercicio'),
            
            // Formulario retroalimentación
            formRetroalimentacion: document.getElementById('form-retroalimentacion'),
            inputCalificacion: document.getElementById('input-calificacion'),
            selectTipo: document.getElementById('select-tipo'),
            textareaComentario: document.getElementById('textarea-comentario'),
            btnEnviarRetroalimentacion: document.getElementById('btn-enviar-retroalimentacion'),
            displayCalificacion: document.getElementById('display-calificacion'),
            
            // Modal confirmación
            modalConfirmacion: document.getElementById('modal-confirmacion'),
            textoConfirmacion: document.getElementById('texto-confirmacion'),
            btnConfirmarSi: document.getElementById('btn-confirmar-si'),
            btnConfirmarNo: document.getElementById('btn-confirmar-no')
        };
    }

    // ============================================
    // CARGA DE DATOS REALES
    // ============================================

    async cargarDatos() {
        try {
            this.mostrarCargando('ejercicios', true);
            
            // ✅ CARGAR EJERCICIOS PENDIENTES REALES
            console.log('🔄 Cargando ejercicios pendientes...');
            const responseEjercicios = await fetch(`${this.API_URL}/profesor/ejercicios-pendientes`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!responseEjercicios.ok) {
                throw new Error(`Error ${responseEjercicios.status}: ${responseEjercicios.statusText}`);
            }

            const resultEjercicios = await responseEjercicios.json();
            
            if (!resultEjercicios.success) {
                throw new Error(resultEjercicios.message || 'Error en la respuesta del servidor');
            }

            this.estado.ejerciciosPendientes = resultEjercicios.data || [];
            console.log('✅ Ejercicios pendientes cargados:', this.estado.ejerciciosPendientes.length);

            // ✅ CARGAR ESTUDIANTES REALES
            console.log('🔄 Cargando estudiantes...');
            const responseEstudiantes = await fetch(`${this.API_URL}/profesor/estudiantes`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!responseEstudiantes.ok) throw new Error(`Error ${responseEstudiantes.status}`);
            
            const resultEstudiantes = await responseEstudiantes.json();
            this.estado.estudiantes = resultEstudiantes.data || [];
            console.log('✅ Estudiantes cargados:', this.estado.estudiantes.length);

            this.renderizarListaEjercicios();
            this.actualizarContadorPendientes();
            
            this.mostrarCargando('ejercicios', false);
            
        } catch (error) {
            console.error('❌ Error cargando datos:', error);
            this.mostrarCargando('ejercicios', false);
            this.mostrarError('Error al cargar los datos: ' + error.message);
        }
    }

    async cargarRetroalimentacionesEstudiante(estudianteId) {
        try {
            // ✅ CARGAR HISTORIAL DE RETROALIMENTACIONES
            console.log('🔄 Cargando historial de retroalimentaciones...');
            const response = await fetch(`${this.API_URL}/profesor/retroalimentaciones?estudiante_id=${estudianteId}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error(`Error ${response.status}`);
            
            const result = await response.json();
            this.estado.retroalimentaciones = result.data || [];
            console.log('✅ Retroalimentaciones cargadas:', this.estado.retroalimentaciones.length);

        } catch (error) {
            console.error('❌ Error cargando retroalimentaciones:', error);
            this.estado.retroalimentaciones = [];
        }
    }

    // ============================================
    // RENDERIZADO CON DATOS REALES
    // ============================================

    renderizarListaEjercicios() {
        const elementos = this.elementos;
        if (!elementos.listaEjercicios || !elementos.estadoVacioEjercicios) return;

        const ejerciciosFiltrados = this.estado.ejerciciosPendientes.filter(ejercicio => {
            const estudiante = this.estado.estudiantes.find(e => e.id === ejercicio.estudiante_id);
            const nombreEstudiante = estudiante ? `${estudiante.nombre || ''} ${estudiante.primer_apellido || ''}`.toLowerCase() : '';
            const leccion = ejercicio.leccion_titulo || ejercicio.tipo_ejercicio || '';
            const busqueda = this.estado.filtroBusqueda.toLowerCase();
            
            return nombreEstudiante.includes(busqueda) || 
                   leccion.toLowerCase().includes(busqueda) ||
                   ejercicio.contenido_respuesta?.toLowerCase().includes(busqueda);
        });

        if (ejerciciosFiltrados.length === 0) {
            elementos.estadoVacioEjercicios.classList.remove('hidden');
            elementos.listaEjercicios.innerHTML = '';
            return;
        }

        elementos.estadoVacioEjercicios.classList.add('hidden');

        elementos.listaEjercicios.innerHTML = ejerciciosFiltrados.map(ejercicio => {
            const estudiante = this.estado.estudiantes.find(e => e.id === ejercicio.estudiante_id);
            const estaSeleccionado = this.estado.ejercicioSeleccionado?.id === ejercicio.id;
            const nombreCompleto = estudiante ? `${estudiante.nombre || ''} ${estudiante.primer_apellido || ''}`.trim() : 'Estudiante';
            const iniciales = nombreCompleto.split(' ').map(n => n[0]).join('').toUpperCase();
            
            // Calcular antigüedad
            const fechaCreacion = new Date(ejercicio.creado_en);
            const ahora = new Date();
            const diffHoras = Math.floor((ahora - fechaCreacion) / (1000 * 60 * 60));
            const antiguedad = diffHoras < 24 ? 
                `${diffHoras}h` : 
                `${Math.floor(diffHoras / 24)}d`;

            const esUrgente = diffHoras > 48; // Más de 2 días

            return `
                <div class="p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    estaSeleccionado ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''
                } ${esUrgente ? 'bg-orange-50 dark:bg-orange-900/10 border-l-orange-500' : ''}" 
                     data-ejercicio-id="${ejercicio.id}">
                    <div class="flex items-start gap-3">
                        <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
                            ${iniciales.substring(0, 2)}
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-start justify-between mb-2">
                                <p class="font-semibold text-gray-900 dark:text-white truncate">
                                    ${nombreCompleto}
                                </p>
                                <div class="flex items-center gap-2 flex-shrink-0 ml-2">
                                    ${esUrgente ? `
                                        <span class="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 text-xs rounded-full font-bold">
                                            ⏰ Urgente
                                        </span>
                                    ` : ''}
                                    <span class="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                                        ${antiguedad}
                                    </span>
                                </div>
                            </div>
                            
                            <p class="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">
                                ${ejercicio.leccion_titulo || ejercicio.tipo_ejercicio || 'Ejercicio de escritura'}
                            </p>
                            
                            <div class="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2 bg-gray-50 dark:bg-gray-700/50 p-2 rounded border border-gray-200 dark:border-gray-600">
                                ${ejercicio.contenido_respuesta || 'Sin contenido disponible'}
                            </div>
                            
                            <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <span class="flex items-center gap-1">
                                    <i class="fas fa-layer-group"></i>
                                    ${estudiante?.nivel_actual || 'A1'}
                                </span>
                                <span>•</span>
                                <span class="flex items-center gap-1">
                                    <i class="fas fa-clock"></i>
                                    ${fechaCreacion.toLocaleDateString('es-MX')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Agregar event listeners
        document.querySelectorAll('[data-ejercicio-id]').forEach(element => {
            element.addEventListener('click', () => {
                const ejercicioId = parseInt(element.getAttribute('data-ejercicio-id'));
                this.seleccionarEjercicio(ejercicioId);
            });
        });
    }

    renderizarDetalleEjercicio() {
        const elementos = this.elementos;
        if (!elementos.ejercicioSeleccionadoInfo || !elementos.ejercicioSeleccionadoContenido) return;

        const ejercicio = this.estado.ejercicioSeleccionado;
        if (!ejercicio) {
            elementos.estadoVacioEjercicio.classList.remove('hidden');
            elementos.ejercicioSeleccionadoInfo.innerHTML = '';
            elementos.ejercicioSeleccionadoContenido.innerHTML = '';
            return;
        }

        elementos.estadoVacioEjercicio.classList.add('hidden');

        const estudiante = this.estado.estudiantes.find(e => e.id === ejercicio.estudiante_id);
        const nombreCompleto = estudiante ? `${estudiante.nombre || ''} ${estudiante.primer_apellido || ''}`.trim() : 'Estudiante';
        const fechaCreacion = new Date(ejercicio.creado_en).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Información del ejercicio
        elementos.ejercicioSeleccionadoInfo.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <div class="flex items-start justify-between mb-4">
                    <div>
                        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            ${ejercicio.leccion_titulo || 'Ejercicio de Escritura'}
                        </h2>
                        <div class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span class="flex items-center gap-2">
                                <i class="fas fa-user text-primary-600"></i>
                                ${nombreCompleto}
                            </span>
                            <span class="flex items-center gap-2">
                                <i class="fas fa-layer-group text-green-600"></i>
                                Nivel ${estudiante?.nivel_actual || 'A1'}
                            </span>
                            <span class="flex items-center gap-2">
                                <i class="fas fa-clock text-orange-600"></i>
                                ${fechaCreacion}
                            </span>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-full text-sm font-semibold border border-yellow-300">
                            <i class="fas fa-pen-fancy mr-1"></i>Escritura
                        </span>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                        <div class="font-semibold text-blue-700 dark:text-blue-300 mb-1">Tipo de Ejercicio</div>
                        <div class="text-blue-900 dark:text-blue-100">${ejercicio.tipo_ejercicio || 'Escritura libre'}</div>
                    </div>
                    <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-700">
                        <div class="font-semibold text-green-700 dark:text-green-300 mb-1">Lección</div>
                        <div class="text-green-900 dark:text-green-100">${ejercicio.leccion_titulo || 'No especificada'}</div>
                    </div>
                    <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-700">
                        <div class="font-semibold text-purple-700 dark:text-purple-300 mb-1">Estado</div>
                        <div class="text-purple-900 dark:text-purple-100">
                            <span class="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 rounded-full text-xs font-bold">
                                Pendiente de revisión
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Contenido de la respuesta
        elementos.ejercicioSeleccionadoContenido.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <i class="fas fa-edit text-primary-600"></i>
                    Respuesta del Estudiante
                </h3>
                
                <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 mb-6">
                    <div class="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                        ${ejercicio.contenido_respuesta || 'No hay contenido disponible para mostrar.'}
                    </div>
                </div>
                
                <div class="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded">
                    <div class="flex items-start gap-3">
                        <i class="fas fa-lightbulb text-yellow-600 mt-1"></i>
                        <div>
                            <h4 class="font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                                Sugerencia de evaluación
                            </h4>
                            <p class="text-yellow-700 dark:text-yellow-400 text-sm">
                                Evalúa la respuesta considerando: gramática, vocabulario, coherencia y cumplimiento de la consigna.
                                Proporciona retroalimentación específica y constructiva.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Resetear formulario
        if (elementos.formRetroalimentacion) {
            elementos.formRetroalimentacion.reset();
            this.actualizarDisplayCalificacion(5);
        }
    }

    actualizarContadorPendientes() {
        const elementos = this.elementos;
        if (!elementos.contadorPendientes) return;

        const total = this.estado.ejerciciosPendientes.length;
        elementos.contadorPendientes.textContent = `${total} pendientes`;
        
        if (elementos.contadorPendientes) {
            elementos.contadorPendientes.className = `px-3 py-1 rounded-full text-sm font-semibold ${
                total > 0 
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' 
                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
            }`;
        }
    }

    // ============================================
    // GESTIÓN DE EJERCICIOS
    // ============================================

    async seleccionarEjercicio(ejercicioId) {
        const ejercicio = this.estado.ejerciciosPendientes.find(e => e.id === ejercicioId);
        if (!ejercicio) return;

        this.estado.ejercicioSeleccionado = ejercicio;
        
        // Actualizar selección visual
        document.querySelectorAll('[data-ejercicio-id]').forEach(el => {
            el.classList.remove('bg-blue-50', 'dark:bg-blue-900/20', 'border-l-4', 'border-l-blue-500');
        });
        
        const elementoSeleccionado = document.querySelector(`[data-ejercicio-id="${ejercicioId}"]`);
        if (elementoSeleccionado) {
            elementoSeleccionado.classList.add('bg-blue-50', 'dark:bg-blue-900/20', 'border-l-4', 'border-l-blue-500');
        }
        
        // Cargar historial de retroalimentaciones del estudiante
        await this.cargarRetroalimentacionesEstudiante(ejercicio.estudiante_id);
        
        // Renderizar detalles
        this.renderizarDetalleEjercicio();
    }

    // ============================================
    // GESTIÓN DE RETROALIMENTACIÓN
    // ============================================

    async manejarEnvioRetroalimentacion(event) {
        event.preventDefault();
        
        const elementos = this.elementos;
        const ejercicio = this.estado.ejercicioSeleccionado;
        
        if (!ejercicio) {
            this.mostrarError('No hay ningún ejercicio seleccionado');
            return;
        }

        const formData = new FormData(elementos.formRetroalimentacion);
        const datos = {
            ejercicio_respuesta_id: ejercicio.id,
            estudiante_id: ejercicio.estudiante_id,
            calificacion: parseInt(formData.get('calificacion')),
            tipo: formData.get('tipo'),
            mensaje: formData.get('comentario'),
            asunto: `Retroalimentación: ${ejercicio.leccion_titulo || 'Ejercicio de escritura'}`
        };

        // Validaciones
        if (!datos.calificacion || datos.calificacion < 1 || datos.calificacion > 10) {
            this.mostrarError('La calificación debe ser un número entre 1 y 10');
            return;
        }

        if (!datos.mensaje || datos.mensaje.trim().length < 10) {
            this.mostrarError('El comentario debe tener al menos 10 caracteres');
            return;
        }

        try {
            elementos.btnEnviarRetroalimentacion.disabled = true;
            elementos.btnEnviarRetroalimentacion.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Enviando...';
            
            await this.enviarRetroalimentacion(datos);
            
            this.mostrarExito('¡Retroalimentación enviada exitosamente! 🎉');
            
            // Eliminar ejercicio de la lista de pendientes
            this.estado.ejerciciosPendientes = this.estado.ejerciciosPendientes.filter(e => e.id !== ejercicio.id);
            this.estado.ejercicioSeleccionado = null;
            
            // Actualizar UI
            this.renderizarListaEjercicios();
            this.renderizarDetalleEjercicio();
            this.actualizarContadorPendientes();
            
        } catch (error) {
            console.error('❌ Error enviando retroalimentación:', error);
            this.mostrarError('Error al enviar la retroalimentación: ' + error.message);
        } finally {
            elementos.btnEnviarRetroalimentacion.disabled = false;
            elementos.btnEnviarRetroalimentacion.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Enviar Retroalimentación';
        }
    }

    async enviarRetroalimentacion(datos) {
        console.log('📤 Enviando retroalimentación:', datos);

        const response = await fetch(`${this.API_URL}/profesor/retroalimentacion`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify(datos)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        return result.data;
    }

    // ============================================
    // FUNCIONES AUXILIARES
    // ============================================

    actualizarDisplayCalificacion(valor) {
        const elementos = this.elementos;
        if (!elementos.displayCalificacion) return;

        elementos.displayCalificacion.textContent = `${valor}/10`;
        
        // Cambiar color según la calificación
        let colorClase = 'text-gray-600';
        if (valor >= 9) colorClase = 'text-green-600';
        else if (valor >= 7) colorClase = 'text-blue-600';
        else if (valor >= 5) colorClase = 'text-yellow-600';
        else colorClase = 'text-red-600';

        elementos.displayCalificacion.className = `text-lg font-bold ${colorClase}`;
    }

    mostrarCargando(tipo, mostrar) {
        const elementos = this.elementos;
        let elemento;
        
        switch(tipo) {
            case 'ejercicios':
                elemento = elementos.loadingEjercicios;
                break;
            case 'ejercicio':
                elemento = elementos.loadingEjercicio;
                break;
        }
        
        if (elemento) {
            elemento.classList.toggle('hidden', !mostrar);
        }
    }

    mostrarExito(mensaje) {
        if (window.toastManager) {
            window.toastManager.success(mensaje);
        } else {
            alert(`✅ ${mensaje}`);
        }
    }

    mostrarError(mensaje) {
        if (window.toastManager) {
            window.toastManager.error(mensaje);
        } else {
            alert(`❌ ${mensaje}`);
        }
    }

    // ============================================
    // CONFIGURACIÓN DE EVENT LISTENERS
    // ============================================

    configurarEventListeners() {
        const elementos = this.elementos;

        // Búsqueda de ejercicios
        if (elementos.buscadorEjercicios) {
            elementos.buscadorEjercicios.addEventListener('input', (e) => {
                this.estado.filtroBusqueda = e.target.value;
                this.renderizarListaEjercicios();
            });
        }

        // Formulario de retroalimentación
        if (elementos.formRetroalimentacion) {
            elementos.formRetroalimentacion.addEventListener('submit', (e) => this.manejarEnvioRetroalimentacion(e));
        }

        // Control de calificación
        if (elementos.inputCalificacion) {
            elementos.inputCalificacion.addEventListener('input', (e) => {
                this.actualizarDisplayCalificacion(parseInt(e.target.value));
            });
        }

        // Inicializar display de calificación
        if (elementos.inputCalificacion && elementos.displayCalificacion) {
            this.actualizarDisplayCalificacion(parseInt(elementos.inputCalificacion.value));
        }
    }
}

// ============================================
// INICIALIZACIÓN GLOBAL
// ============================================

let retroalimentacionProfesor;

document.addEventListener('DOMContentLoaded', () => {
    retroalimentacionProfesor = new RetroalimentacionProfesor();
});

window.retroalimentacionProfesor = retroalimentacionProfesor;