// frontend/assets/js/pages/estudiante/dashboard.js
import { apiClient } from '../../core/api-client.js';

class DashboardEstudiante {
    constructor() {
        this.usuario = null;
        this.lecciones = [];
        this.datosPerfil = null;
        this.misCursos = [];
        this.estado = {
            isLoading: false,
            animacionesActivadas: false,
            cursoActual: null,
            leccionActual: null
        };
        this.init();
    }

    async init() {
        try {
            await this.cargarDatosUsuario();
            await this.cargarLecciones();
            await this.cargarDatosAdicionales();
            this.renderizarDashboard();
            this.configurarEventListeners();
            this.configurarAnimacionesScroll();
        } catch (error) {
            console.error('Error inicializando dashboard:', error);
            this.mostrarError('Error al cargar el dashboard');
        }
    }

    async cargarDatosUsuario() {
        try {
            const response = await apiClient.get('/auth/perfil');
            this.usuario = response.data;
            
            // Asegurarse de que tenemos nivel e idioma
            if (!this.usuario.nivel_actual) {
                this.usuario.nivel_actual = 'principiante';
            }
            if (!this.usuario.idioma_aprendizaje) {
                this.usuario.idioma_aprendizaje = 'español';
            }
        } catch (error) {
            console.error('Error cargando datos usuario:', error);
            throw error;
        }
    }

    async cargarLecciones() {
        try {
            const { nivel_actual, idioma_aprendizaje } = this.usuario;
            const response = await apiClient.get(`/cursos/nivel/${nivel_actual}/idioma/${idioma_aprendizaje}`);
            
            if (response.success) {
                this.lecciones = response.data;
            } else {
                this.lecciones = [];
            }
        } catch (error) {
            console.error('Error cargando lecciones:', error);
            this.lecciones = [];
        }
    }

    async cargarDatosAdicionales() {
        try {
            // Cargar cursos del estudiante
            const cursosResponse = await apiClient.get('/estudiante/mis-cursos');
            if (cursosResponse.success) {
                this.misCursos = cursosResponse.data;
                if (this.misCursos.length > 0) {
                    this.estado.cursoActual = this.misCursos.find(curso => curso.progreso_general > 0) || this.misCursos[0];
                }
            }

            // Cargar estadísticas si están disponibles
            try {
                const statsResponse = await apiClient.get('/estudiante/estadisticas');
                if (statsResponse.success) {
                    this.datosPerfil = statsResponse.data;
                }
            } catch (statsError) {
                console.log('Endpoint de estadísticas no disponible, usando datos básicos');
                this.usarDatosEjemplo();
            }
        } catch (error) {
            console.error('Error cargando datos adicionales:', error);
            this.usarDatosEjemplo();
        }
    }

    usarDatosEjemplo() {
        this.datosPerfil = {
            perfil: {
                nombre: this.usuario?.nombre || 'Usuario',
                nivel_actual: 'A1',
                idioma_aprendizaje: 'Inglés'
            },
            estadisticas: {
                dias_racha: 7,
                total_xp: 1850,
                lecciones_completadas: 12,
                nivel_usuario: 4,
                meta_diaria: 30
            }
        };
        
        if (this.misCursos.length === 0) {
            this.misCursos = [{
                curso_id: 1,
                curso_nombre: 'Fundamentos del Inglés',
                nivel: 'A1',
                progreso_general: 35,
                lecciones_completadas: 5,
                total_lecciones_curso: 10
            }];
        }
        
        this.estado.cursoActual = this.misCursos[0];
    }

    renderizarDashboard() {
        const container = document.getElementById('lecciones-container');
        
        if (!container) {
            console.error('Contenedor de lecciones no encontrado');
            return;
        }

        container.innerHTML = this.generarHTMLCompleto();
    }

    generarHTMLCompleto() {
        const perfil = this.datosPerfil?.perfil || this.datosPerfil || {};
        const estadisticas = this.datosPerfil?.estadisticas || {};
        const nombreCompleto = `${perfil.nombre || this.usuario.nombre || 'Usuario'} ${perfil.primer_apellido || ''}`;
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreCompleto)}&background=6366f1&color=fff`;

        return `
            <!-- Header Principal -->
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-gray-800 mb-2" id="greeting">
                    ¡Bienvenido, ${this.usuario.nombre || 'Estudiante'}!
                </h1>
                <div class="flex flex-wrap gap-4 mb-6">
                    <div class="bg-blue-50 px-4 py-2 rounded-lg">
                        <span class="text-sm text-blue-600">Nivel:</span>
                        <span class="font-semibold text-blue-800 ml-2" id="nivel-actual">
                            ${this.usuario.nivel_actual} - ${this.usuario.idioma_aprendizaje}
                        </span>
                    </div>
                    <div class="bg-green-50 px-4 py-2 rounded-lg">
                        <span class="text-sm text-green-600">Idioma:</span>
                        <span class="font-semibold text-green-800 ml-2" id="idioma-aprendizaje">
                            ${this.usuario.idioma_aprendizaje}
                        </span>
                    </div>
                    <div class="bg-purple-50 px-4 py-2 rounded-lg">
                        <span class="text-sm text-purple-600">XP Total:</span>
                        <span class="font-semibold text-purple-800 ml-2" id="total-xp">
                            ${estadisticas.total_xp || 0}
                        </span>
                    </div>
                    <div class="bg-orange-50 px-4 py-2 rounded-lg">
                        <span class="text-sm text-orange-600">Racha:</span>
                        <span class="font-semibold text-orange-800 ml-2" id="dias-racha">
                            ${estadisticas.dias_racha || 0} días
                        </span>
                    </div>
                </div>
            </div>

            <!-- Grid Principal -->
            <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <!-- Columna Izquierda - Estadísticas -->
                <div class="xl:col-span-1 space-y-8">
                    ${this.generarTarjetaEstadisticas(estadisticas)}
                    ${this.generarTarjetaLeaderboard(avatarUrl, estadisticas)}
                    ${this.generarTarjetaProgresoDiario(estadisticas)}
                </div>

                <!-- Columna Derecha - Contenido Principal -->
                <div class="xl:col-span-2 space-y-8">
                    ${this.generarTarjetaContinuarAprendizaje()}
                    ${this.generarSeccionLecciones()}
                    ${this.misCursos.length > 0 ? this.generarSeccionCursos() : ''}
                    ${this.generarLeccionesRecientes()}
                </div>
            </div>
        `;
    }

    generarTarjetaEstadisticas(estadisticas) {
        return `
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-6">Tu Progreso</h3>
                <div class="space-y-6">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                <i class="fas fa-fire text-blue-600 dark:text-blue-400 text-lg"></i>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500 dark:text-gray-400">Días de Racha</p>
                                <p class="text-2xl font-bold text-gray-800 dark:text-white" id="dias-racha">
                                    ${estadisticas.dias_racha || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                                <i class="fas fa-star text-green-600 dark:text-green-400 text-lg"></i>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500 dark:text-gray-400">XP Total</p>
                                <p class="text-2xl font-bold text-gray-800 dark:text-white" id="total-xp">
                                    ${estadisticas.total_xp || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                                <i class="fas fa-check-circle text-purple-600 dark:text-purple-400 text-lg"></i>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500 dark:text-gray-400">Lecciones Completadas</p>
                                <p class="text-2xl font-bold text-gray-800 dark:text-white" id="lecciones-completadas">
                                    ${estadisticas.lecciones_completadas || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Nivel Actual</span>
                            <span class="text-sm font-bold text-blue-600 dark:text-blue-400" id="nivel-usuario">
                                ${estadisticas.nivel_usuario || 1}
                            </span>
                        </div>
                        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div class="bg-blue-500 h-2 rounded-full transition-all duration-1000" 
                                 style="width: ${((estadisticas.nivel_usuario || 1) % 10) * 10}%"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generarTarjetaLeaderboard(avatarUrl, estadisticas) {
        return `
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4">Tu Ranking</h3>
                <div class="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl">
                    <img src="${avatarUrl}" alt="Avatar" class="w-12 h-12 rounded-full" id="leaderboard-avatar">
                    <div class="flex-1">
                        <p class="font-semibold text-gray-800 dark:text-white">${this.usuario.nombre || 'Estudiante'}</p>
                        <p class="text-sm text-gray-600 dark:text-gray-400" id="leaderboard-xp">
                            ${estadisticas.total_xp || 0} XP
                        </p>
                    </div>
                    <div class="bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 rounded-full">
                        <span class="text-yellow-800 dark:text-yellow-200 font-bold">#1</span>
                    </div>
                </div>
            </div>
        `;
    }

    generarTarjetaProgresoDiario(estadisticas) {
        return `
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4">Meta Diaria</h3>
                <div class="text-center">
                    <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full mb-4">
                        <span class="text-white font-bold text-lg" id="meta-diaria">
                            ${estadisticas.meta_diaria || 30}
                        </span>
                    </div>
                    <p class="text-gray-600 dark:text-gray-400 text-sm">minutos hoy</p>
                </div>
                <div class="mt-4 space-y-2">
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-500 dark:text-gray-400">Completado</span>
                        <span class="font-medium text-green-600 dark:text-green-400">${Math.min(100, Math.floor(Math.random() * 100))}%</span>
                    </div>
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div class="bg-green-500 h-2 rounded-full transition-all duration-1000" style="width: ${Math.min(100, Math.floor(Math.random() * 100))}%"></div>
                    </div>
                </div>
            </div>
        `;
    }

    generarTarjetaContinuarAprendizaje() {
        const leccionActiva = this.lecciones.find(l => l.progreso > 0 && l.progreso < 100);
        const siguienteLeccion = this.lecciones.find(l => !l.completada && this.estaLeccionBloqueada(l) === false);
        
        if (!leccionActiva && !siguienteLeccion) return '';

        const leccion = leccionActiva || siguienteLeccion;
        
        return `
            <div class="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-2xl font-bold">Continuar Aprendizaje</h2>
                    <span class="bg-white/20 px-3 py-1 rounded-full text-sm">${this.usuario.nivel_actual}</span>
                </div>
                
                <div class="mb-4">
                    <h3 class="text-xl font-semibold mb-2">${leccion.titulo}</h3>
                    <p class="text-purple-100 mb-4">${leccion.descripcion || 'Continúa tu progreso en esta lección'}</p>
                    
                    <div class="space-y-2">
                        <div class="flex justify-between text-sm">
                            <span>Progreso</span>
                            <span>${leccion.progreso || 0}%</span>
                        </div>
                        <div class="w-full bg-white/20 rounded-full h-3">
                            <div class="bg-white h-3 rounded-full transition-all duration-1000" 
                                 style="width: ${leccion.progreso || 0}%"></div>
                        </div>
                    </div>
                </div>
                
                <button 
                    onclick="dashboardEstudiante.iniciarLeccion(${leccion.id})"
                    class="w-full bg-white text-purple-600 font-semibold py-3 rounded-lg hover:bg-purple-50 transition-colors">
                    ${leccion.progreso > 0 ? 'Continuar Lección' : 'Comenzar Lección'}
                </button>
            </div>
        `;
    }

    generarSeccionLecciones() {
        return `
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-gray-800 dark:text-white">Tus Lecciones</h2>
                    <span class="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm">
                        ${this.lecciones.length} disponibles
                    </span>
                </div>
                
                ${this.lecciones.length === 0 ? this.renderizarSinLecciones() : ''}
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6" id="grid-lecciones">
                    ${this.lecciones.map(leccion => this.renderizarTarjetaLeccion(leccion)).join('')}
                </div>
            </div>
        `;
    }

    generarSeccionCursos() {
        return `
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-6">Mis Cursos</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    ${this.misCursos.map(curso => this.renderizarTarjetaCurso(curso)).join('')}
                </div>
            </div>
        `;
    }

    generarLeccionesRecientes() {
        const leccionesRecientes = this.lecciones.slice(0, 5);
        
        return `
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4">Lecciones Recientes</h3>
                <div class="space-y-4">
                    ${leccionesRecientes.map((leccion, index) => this.renderizarLeccionReciente(leccion, index)).join('')}
                </div>
            </div>
        `;
    }

    renderizarLeccionReciente(leccion, index) {
        const completada = leccion.completada || false;
        const progreso = leccion.progreso || 0;
        
        if (completada) {
            return `
                <div class="flex items-center gap-4 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 hover:shadow-md transition-all cursor-pointer group" 
                     onclick="dashboardEstudiante.iniciarLeccion(${leccion.id})"
                     data-leccion-id="${leccion.id}">
                    <div class="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <i class="fas fa-check text-green-600 dark:text-green-400 text-lg"></i>
                    </div>
                    <div class="flex-1">
                        <p class="font-semibold text-gray-900 dark:text-white">${leccion.titulo}</p>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Completado - ${leccion.duracion_estimada || 30} min</p>
                    </div>
                    <div class="text-right">
                        <span class="text-2xl">✅</span>
                    </div>
                </div>
            `;
        } else if (progreso > 0) {
            return `
                <div class="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all cursor-pointer group" 
                     onclick="dashboardEstudiante.iniciarLeccion(${leccion.id})"
                     data-leccion-id="${leccion.id}">
                    <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <i class="fas fa-play text-purple-600 dark:text-purple-400 text-lg"></i>
                    </div>
                    <div class="flex-1">
                        <p class="font-semibold text-gray-900 dark:text-white">${leccion.titulo}</p>
                        <p class="text-sm text-gray-600 dark:text-gray-400">En progreso - ${progreso}%</p>
                        <div class="mt-2 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div class="bg-purple-500 rounded-full h-2 transition-all duration-1000" style="width: ${progreso}%"></div>
                        </div>
                    </div>
                    <span class="text-2xl">📖</span>
                </div>
            `;
        } else {
            const bloqueada = this.estaLeccionBloqueada(leccion);
            return `
                <div class="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all cursor-pointer group ${bloqueada ? 'opacity-50' : ''}" 
                     onclick="${!bloqueada ? `dashboardEstudiante.iniciarLeccion(${leccion.id})` : ''}"
                     data-leccion-id="${leccion.id}">
                    <div class="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                        <i class="fas ${bloqueada ? 'fa-lock' : 'fa-play'} text-gray-400 dark:text-gray-500 text-lg"></i>
                    </div>
                    <div class="flex-1">
                        <p class="font-semibold ${bloqueada ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}">${leccion.titulo}</p>
                        <p class="text-sm ${bloqueada ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'}">${leccion.duracion_estimada || 30} minutos</p>
                    </div>
                    <span class="text-2xl ${bloqueada ? 'opacity-50' : ''}">${bloqueada ? '🔒' : '📖'}</span>
                </div>
            `;
        }
    }

    renderizarSinLecciones() {
        return `
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <p class="text-yellow-700 mb-4">No hay lecciones disponibles para tu nivel e idioma actual.</p>
                <p class="text-yellow-600 text-sm">Contacta con tu profesor o intenta cambiar tu nivel de aprendizaje.</p>
            </div>
        `;
    }

    renderizarTarjetaLeccion(leccion) {
        const bloqueada = this.estaLeccionBloqueada(leccion);
        const progreso = leccion.progreso || 0;
        const completada = leccion.completada || false;
        
        return `
            <div class="bg-white rounded-xl shadow-md border border-gray-200 p-6 transition-all duration-200 hover:shadow-lg ${
                bloqueada ? 'opacity-60 grayscale' : ''
            }">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-xl font-bold text-gray-800">${leccion.titulo}</h3>
                    <div class="flex items-center gap-2">
                        ${completada ? 
                            '<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Completada</span>' : 
                            '<span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">En progreso</span>'
                        }
                        ${bloqueada ? '<span class="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">Bloqueada</span>' : ''}
                    </div>
                </div>
                
                <p class="text-gray-600 mb-4 text-sm">${leccion.descripcion || 'Sin descripción'}</p>
                
                <div class="space-y-3 mb-4">
                    <div class="flex justify-between text-sm text-gray-500">
                        <span>Duración: ${leccion.duracion_estimada || 'N/A'}</span>
                        <span>Orden: ${leccion.orden}</span>
                    </div>
                    
                    <div class="space-y-1">
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600">Progreso</span>
                            <span class="font-medium text-blue-600">${progreso}%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                                 style="width: ${progreso}%"></div>
                        </div>
                    </div>
                </div>
                
                <div class="flex gap-2">
                    <button 
                        onclick="dashboardEstudiante.iniciarLeccion(${leccion.id})"
                        class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                        ${bloqueada ? 'disabled' : ''}>
                        ${progreso > 0 ? 'Continuar' : 'Iniciar'}
                    </button>
                    
                    ${progreso > 0 ? `
                        <button 
                            onclick="dashboardEstudiante.reiniciarLeccion(${leccion.id})"
                            class="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                            title="Reiniciar lección">
                            ↻
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderizarTarjetaCurso(curso) {
        return `
            <div class="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-xl font-bold text-gray-800">${curso.nombre || 'Curso sin nombre'}</h3>
                    <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        ${curso.nivel || 'N/A'}
                    </span>
                </div>
                
                <p class="text-gray-600 mb-4 text-sm">${curso.descripcion || 'Sin descripción disponible'}</p>
                
                <div class="space-y-3 mb-4">
                    <div class="flex justify-between text-sm text-gray-500">
                        <span>Idioma: ${curso.idioma || 'No especificado'}</span>
                        <span>Progreso: ${curso.progreso_general || 0}%</span>
                    </div>
                    
                    <div class="space-y-1">
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600">Progreso General</span>
                            <span class="font-medium text-blue-600">${curso.progreso_general || 0}%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                                 style="width: ${curso.progreso_general || 0}%"></div>
                        </div>
                    </div>
                </div>
                
                <button 
                    onclick="dashboardEstudiante.verCurso(${curso.id})"
                    class="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    Ver Curso
                </button>
            </div>
        `;
    }

    estaLeccionBloqueada(leccion) {
        const indice = this.lecciones.findIndex(l => l.id === leccion.id);
        if (indice === 0) return false;
        
        const leccionAnterior = this.lecciones[indice - 1];
        return !leccionAnterior.completada;
    }

    async iniciarLeccion(leccionId) {
        window.location.href = `/pages/estudiante/leccion-activa.html?id=${leccionId}`;
    }

    async reiniciarLeccion(leccionId) {
        if (confirm('¿Estás seguro de que quieres reiniciar esta lección? Se perderá tu progreso actual.')) {
            try {
                await apiClient.put(`/progreso/leccion/${leccionId}`, {
                    progreso: 0,
                    completada: false
                });
                window.location.reload();
            } catch (error) {
                console.error('Error reiniciando lección:', error);
                alert('Error al reiniciar la lección');
            }
        }
    }

    verCurso(cursoId) {
        window.location.href = `/pages/estudiante/curso-detalle.html?id=${cursoId}`;
    }

    configurarEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('#logout-btn')) {
                this.manejarLogout();
            }

            const leccionCard = e.target.closest('[data-leccion-id]');
            if (leccionCard) {
                const leccionId = leccionCard.dataset.leccionId;
                this.iniciarLeccion(leccionId);
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.usuario) {
                setTimeout(() => this.cargarDatosAdicionales(), 1000);
            }
        });
    }

    configurarAnimacionesScroll() {
        if (this.estado.animacionesActivadas) return;
        
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        document.querySelectorAll('.bg-white, .bg-gradient-to-br, .bg-gray-50').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            observer.observe(el);
        });

        this.estado.animacionesActivadas = true;
    }

    manejarLogout() {
        localStorage.removeItem('usuario');
        localStorage.removeItem('token');
        window.location.href = '/pages/auth/login.html';
    }

    mostrarError(mensaje) {
        const container = document.getElementById('lecciones-container');
        if (container) {
            container.innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <p class="text-red-700 mb-4">${mensaje}</p>
                    <button 
                        onclick="window.location.reload()"
                        class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }
}

// Inicializar dashboard
const dashboardEstudiante = new DashboardEstudiante();
window.dashboardEstudiante = dashboardEstudiante;