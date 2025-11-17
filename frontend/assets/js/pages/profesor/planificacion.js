/* ============================================
   SPEAKLEXI - PLANIFICADOR DE CONTENIDOS (PROFESOR) - CON DATOS REALES
   Archivo: assets/js/pages/profesor/planificacion.js
   UC-15: Planificar contenidos - CON DATOS REALES
   ============================================ */

class PlanificacionProfesor {
    constructor() {
        this.API_URL = window.APP_CONFIG?.API?.API_URL || 'http://localhost:5000/api';
        this.token = localStorage.getItem('token');
        this.estado = {
            planes: [],
            estudiantes: [],
            analisis: null,
            planSeleccionado: null,
            filtroEstado: 'todos',
            alumnosSeleccionados: new Set()
        };
        this.chartInstance = null;
        this.init();
    }

    async init() {
        try {
            console.log('✅ Módulo Planificación Profesor iniciando...');
            
            await this.verificarAutenticacion();
            await this.cargarDatos();
            this.configurarEventListeners();
            
            console.log('✅ Módulo Planificación Profesor listo');
        } catch (error) {
            console.error('💥 Error inicializando módulo:', error);
            this.mostrarError('Error al cargar el módulo de planificación');
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
            analisisGrupo: document.getElementById('analisis-grupo'),
            areasCriticas: document.getElementById('areas-criticas'),
            sugerencias: document.getElementById('sugerencias'),
            graficoDesempeno: document.getElementById('grafico-desempeno'),
            loadingDashboard: document.getElementById('loading-dashboard'),
            listaPlanes: document.getElementById('lista-planes'),
            estadoVacioPlanes: document.getElementById('estado-vacio-planes'),
            loadingPlanes: document.getElementById('loading-planes'),
            modalPlan: document.getElementById('modal-plan'),
            formPlan: document.getElementById('form-plan'),
            inputTitulo: document.getElementById('input-titulo'),
            textareaDescripcion: document.getElementById('textarea-descripcion'),
            selectNivel: document.getElementById('select-nivel'),
            inputFechaInicio: document.getElementById('input-fecha-inicio'),
            inputFechaFin: document.getElementById('input-fecha-fin'),
            btnGuardarPlan: document.getElementById('btn-guardar-plan'),
            btnCancelarPlan: document.getElementById('btn-cancelar-plan'),
            btnCrearPlan: document.getElementById('btn-crear-plan'),
            btnCrearPrimerPlan: document.getElementById('btn-crear-primer-plan'),
            modalConfirmacion: document.getElementById('modal-confirmacion'),
            textoConfirmacion: document.getElementById('texto-confirmacion'),
            btnConfirmarSi: document.getElementById('btn-confirmar-si'),
            btnConfirmarNo: document.getElementById('btn-confirmar-no'),
            listaAlumnos: document.getElementById('lista-alumnos'),
            contadorAlumnos: document.getElementById('contador-alumnos'),
            errorMinimoAlumnos: document.getElementById('error-minimo-alumnos')
        };
    }

    // ============================================
    // CARGA DE DATOS REALES
    // ============================================

    async cargarDatos() {
        try {
            this.mostrarCargando('dashboard', true);
            this.mostrarCargando('planes', true);

            // ✅ CARGAR ANÁLISIS DE RENDIMIENTO REAL
            console.log('🔄 Cargando análisis de rendimiento...');
            const responseAnalisis = await fetch(`${this.API_URL}/profesor/analisis-rendimiento`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!responseAnalisis.ok) throw new Error(`Error ${responseAnalisis.status} cargando análisis`);
            
            const resultAnalisis = await responseAnalisis.json();
            this.estado.analisis = resultAnalisis.data;
            console.log('✅ Análisis cargado:', this.estado.analisis);

            // ✅ CARGAR ESTUDIANTES REALES
            console.log('🔄 Cargando estudiantes...');
            const responseEstudiantes = await fetch(`${this.API_URL}/profesor/estudiantes`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!responseEstudiantes.ok) throw new Error(`Error ${responseEstudiantes.status} cargando estudiantes`);
            
            const resultEstudiantes = await responseEstudiantes.json();
            this.estado.estudiantes = resultEstudiantes.data || [];
            console.log('✅ Estudiantes cargados:', this.estado.estudiantes.length);

            // ✅ CARGAR PLANES EXISTENTES
            await this.cargarPlanes();

            this.renderizarDashboard();
            this.renderizarListaAlumnos();
            this.renderizarPlanes();

            this.mostrarCargando('dashboard', false);
            this.mostrarCargando('planes', false);

        } catch (error) {
            console.error('❌ Error cargando datos:', error);
            this.mostrarCargando('dashboard', false);
            this.mostrarCargando('planes', false);
            this.mostrarError('Error al cargar los datos: ' + error.message);
        }
    }

    async cargarPlanes() {
        try {
            console.log('🔄 Cargando planes existentes...');
            const response = await fetch(`${this.API_URL}/profesor/planes`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error(`Error ${response.status} cargando planes`);
            
            const result = await response.json();
            this.estado.planes = result.data || [];
            console.log('✅ Planes cargados:', this.estado.planes.length);

        } catch (error) {
            console.error('❌ Error cargando planes:', error);
            this.estado.planes = [];
        }
    }

    // ============================================
    // GESTIÓN DE ALUMNOS (MÍNIMO 5)
    // ============================================

    renderizarListaAlumnos() {
        const elementos = this.elementos;
        if (!elementos.listaAlumnos) return;

        if (this.estado.estudiantes.length === 0) {
            elementos.listaAlumnos.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-users text-4xl mb-4 text-gray-300"></i>
                    <p>No hay estudiantes disponibles</p>
                </div>
            `;
            return;
        }

        elementos.listaAlumnos.innerHTML = this.estado.estudiantes.map(estudiante => {
            const estaSeleccionado = this.estado.alumnosSeleccionados.has(estudiante.id);
            
            return `
                <div class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${estaSeleccionado ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300' : ''}">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold">
                            ${(estudiante.nombre_completo || estudiante.nombre || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div class="font-medium text-gray-900 dark:text-white">
                                ${estudiante.nombre_completo || `${estudiante.nombre || ''} ${estudiante.primer_apellido || ''}`.trim()}
                            </div>
                            <div class="text-sm text-gray-500 dark:text-gray-400">
                                Nivel ${estudiante.nivel_actual || 'A1'} • ${estudiante.total_xp || 0} XP
                            </div>
                        </div>
                    </div>
                    <button type="button" 
                            onclick="planificacionProfesor.toggleAlumno(${estudiante.id})"
                            class="px-4 py-2 rounded-lg font-medium transition-all ${
                                estaSeleccionado 
                                    ? 'bg-primary-500 text-white hover:bg-primary-600' 
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }">
                        ${estaSeleccionado ? 'Seleccionado' : 'Seleccionar'}
                    </button>
                </div>
            `;
        }).join('');

        this.actualizarContadorAlumnos();
    }

    toggleAlumno(alumnoId) {
        if (this.estado.alumnosSeleccionados.has(alumnoId)) {
            this.estado.alumnosSeleccionados.delete(alumnoId);
        } else {
            this.estado.alumnosSeleccionados.add(alumnoId);
        }
        
        this.renderizarListaAlumnos();
        this.validarMinimoAlumnos();
    }

    actualizarContadorAlumnos() {
        const elementos = this.elementos;
        if (!elementos.contadorAlumnos) return;

        const total = this.estado.alumnosSeleccionados.size;
        elementos.contadorAlumnos.textContent = `${total} alumnos seleccionados`;
        
        if (elementos.contadorAlumnos) {
            elementos.contadorAlumnos.className = `text-sm font-medium ${
                total >= 5 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
            }`;
        }
    }

    validarMinimoAlumnos() {
        const elementos = this.elementos;
        if (!elementos.errorMinimoAlumnos) return;

        const total = this.estado.alumnosSeleccionados.size;
        const esValido = total >= 5;

        elementos.errorMinimoAlumnos.classList.toggle('hidden', esValido);
        
        if (elementos.btnGuardarPlan) {
            elementos.btnGuardarPlan.disabled = !esValido;
        }

        return esValido;
    }

    // ============================================
    // RENDERIZADO CON DATOS REALES
    // ============================================

    renderizarDashboard() {
        this.renderizarAnalisisGrupo();
        this.renderizarAreasCriticas();
        this.renderizarSugerencias();
        this.renderizarGraficoDesempeno();
    }

    renderizarAnalisisGrupo() {
        const elementos = this.elementos;
        if (!elementos.analisisGrupo) return;

        const stats = this.estado.analisis?.estadisticas_grupo || this.estado.analisis?.estadisticas || {};

        elementos.analisisGrupo.innerHTML = `
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-6 text-center border-2 border-blue-200 dark:border-blue-700 shadow-lg">
                    <div class="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                        ${stats.total_estudiantes || this.estado.estudiantes.length || 0}
                    </div>
                    <div class="text-sm font-medium text-blue-700 dark:text-blue-300">Estudiantes Totales</div>
                </div>
                <div class="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl p-6 text-center border-2 border-green-200 dark:border-green-700 shadow-lg">
                    <div class="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                        ${stats.estudiantes_con_plan || this.estado.planes.length || 0}
                    </div>
                    <div class="text-sm font-medium text-green-700 dark:text-green-300">Con Plan Activo</div>
                </div>
                <div class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl p-6 text-center border-2 border-purple-200 dark:border-purple-700 shadow-lg">
                    <div class="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                        ${stats.planes_activos || this.estado.planes.filter(p => p.estado === 'en_progreso').length || 0}
                    </div>
                    <div class="text-sm font-medium text-purple-700 dark:text-purple-300">Planes en Progreso</div>
                </div>
                <div class="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-xl p-6 text-center border-2 border-orange-200 dark:border-orange-700 shadow-lg">
                    <div class="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                        ${stats.tasa_completacion || 0}%
                    </div>
                    <div class="text-sm font-medium text-orange-700 dark:text-orange-300">Tasa Completación</div>
                </div>
            </div>
        `;
    }

    renderizarAreasCriticas() {
        const elementos = this.elementos;
        if (!elementos.areasCriticas) return;

        const temas = this.estado.analisis?.areas_criticas || this.estado.analisis?.temas_dificultad || [];

        if (temas.length === 0) {
            elementos.areasCriticas.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-check-circle text-4xl mb-4 text-green-300"></i>
                    <p>No se identificaron áreas críticas</p>
                    <p class="text-sm mt-2">El grupo muestra buen desempeño general</p>
                </div>
            `;
            return;
        }

        elementos.areasCriticas.innerHTML = temas.map(tema => {
            const frecuencia = tema.frecuencia || tema.estudiantes_afectados || 0;
            const criticidad = frecuencia >= 10 ? 'alta' : frecuencia >= 5 ? 'media' : 'baja';
            
            const colores = {
                alta: { 
                    border: 'border-red-500', 
                    bg: 'bg-red-50 dark:bg-red-900/20', 
                    text: 'text-red-700 dark:text-red-300', 
                    badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
                    bar: 'bg-red-500'
                },
                media: { 
                    border: 'border-yellow-500', 
                    bg: 'bg-yellow-50 dark:bg-yellow-900/20', 
                    text: 'text-yellow-700 dark:text-yellow-300', 
                    badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
                    bar: 'bg-yellow-500'
                },
                baja: { 
                    border: 'border-orange-500', 
                    bg: 'bg-orange-50 dark:bg-orange-900/20', 
                    text: 'text-orange-700 dark:text-orange-300', 
                    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
                    bar: 'bg-orange-500'
                }
            };
            const color = colores[criticidad];

            return `
                <div class="${color.bg} rounded-xl p-4 border-l-4 ${color.border} shadow-md hover:shadow-lg transition-all">
                    <div class="flex justify-between items-start mb-3">
                        <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <i class="fas fa-exclamation-triangle ${color.text}"></i>
                            ${tema.tema || tema.nombre || 'Área crítica'}
                        </h3>
                        <span class="px-3 py-1 rounded-full text-xs font-bold ${color.badge}">
                            ${tema.estudiantes_afectados || frecuencia} estudiantes
                        </span>
                    </div>
                    <div class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Dificultad reportada <span class="font-semibold">${frecuencia} veces</span>
                    </div>
                    <div class="bg-white dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div class="h-3 ${color.bar} transition-all duration-500" 
                             style="width: ${Math.min(frecuencia * 10, 100)}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderizarSugerencias() {
        const elementos = this.elementos;
        if (!elementos.sugerencias) return;

        const sugerencias = this.estado.analisis?.sugerencias || [];

        if (sugerencias.length === 0) {
            elementos.sugerencias.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-lightbulb text-4xl mb-4 text-yellow-300"></i>
                    <p>No hay sugerencias disponibles</p>
                    <p class="text-sm mt-2">El análisis no generó recomendaciones específicas</p>
                </div>
            `;
            return;
        }

        elementos.sugerencias.innerHTML = sugerencias.map(sug => {
            const prioridadColores = {
                alta: 'border-red-500 bg-red-50 dark:bg-red-900/20',
                media: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
                baja: 'border-green-500 bg-green-50 dark:bg-green-900/20'
            };

            return `
                <div class="${prioridadColores[sug.prioridad]} border-l-4 rounded-lg p-4 shadow-md hover:shadow-lg transition-all">
                    <div class="flex items-start justify-between mb-2">
                        <h4 class="font-semibold text-gray-900 dark:text-white">
                            ${sug.titulo}
                        </h4>
                        <span class="text-xs px-2 py-1 rounded-full ${
                            sug.prioridad === 'alta' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                            sug.prioridad === 'media' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        }">
                            ${sug.prioridad.toUpperCase()}
                        </span>
                    </div>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        ${sug.descripcion}
                    </p>
                    <button onclick="planificacionProfesor.mostrarModalPlan()" 
                            class="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 font-semibold flex items-center gap-1">
                        <i class="fas fa-plus-circle"></i>
                        ${sug.accion || 'Crear plan de acción'}
                    </button>
                </div>
            `;
        }).join('');
    }

    renderizarGraficoDesempeno() {
        const elementos = this.elementos;
        if (!elementos.graficoDesempeno || !window.Chart) return;

        const ctx = elementos.graficoDesempeno.getContext('2d');
        
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        const temas = this.estado.analisis?.areas_criticas || this.estado.analisis?.temas_dificultad || [];
        
        if (temas.length === 0) {
            elementos.graficoDesempeno.innerHTML = `
                <div class="flex items-center justify-center h-full text-gray-500">
                    <div class="text-center">
                        <i class="fas fa-chart-bar text-4xl mb-4 text-gray-300"></i>
                        <p>No hay datos para mostrar</p>
                    </div>
                </div>
            `;
            return;
        }

        this.chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: temas.map(t => t.tema?.substring(0, 20) + (t.tema?.length > 20 ? '...' : '') || 'Área'),
                datasets: [
                    {
                        label: 'Frecuencia de Dificultad',
                        data: temas.map(t => t.frecuencia || t.estudiantes_afectados || 0),
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        borderColor: 'rgb(59, 130, 246)',
                        borderWidth: 2,
                        borderRadius: 8
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: { size: 12, weight: 'bold' },
                            padding: 15
                        }
                    },
                    title: {
                        display: true,
                        text: 'Análisis de Áreas con Dificultad',
                        font: { size: 16, weight: 'bold' }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 14 },
                        bodyFont: { size: 13 }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            font: { size: 11 }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: { size: 11 }
                        }
                    }
                }
            }
        });
    }

    renderizarPlanes() {
        const elementos = this.elementos;
        if (!elementos.listaPlanes) return;

        if (this.estado.planes.length === 0) {
            elementos.estadoVacioPlanes.classList.remove('hidden');
            elementos.listaPlanes.innerHTML = '';
            return;
        }

        elementos.estadoVacioPlanes.classList.add('hidden');

        elementos.listaPlanes.innerHTML = this.estado.planes.map((plan) => {
            const estadoConfig = {
                'en_progreso': { 
                    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300', 
                    icono: 'fa-spinner fa-spin', 
                    texto: 'En Progreso' 
                },
                'pendiente': { 
                    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-300', 
                    icono: 'fa-clock', 
                    texto: 'Pendiente' 
                },
                'completado': { 
                    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-300', 
                    icono: 'fa-check-circle', 
                    texto: 'Completado' 
                }
            };

            const config = estadoConfig[plan.estado] || estadoConfig.pendiente;

            return `
                <div class="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-md hover:shadow-xl transition-all p-6">
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex-1">
                            <div class="flex items-center gap-3 mb-2">
                                <h3 class="font-bold text-xl text-gray-900 dark:text-white">
                                    ${plan.titulo}
                                </h3>
                            </div>
                            <p class="text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                                ${plan.descripcion}
                            </p>
                            <div class="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-4">
                                <span class="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
                                    <i class="fas fa-user text-primary-600"></i>
                                    <span class="font-medium">${plan.estudiante_nombre || 'Estudiante'}</span>
                                </span>
                                <span class="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
                                    <i class="fas fa-calendar text-green-600"></i>
                                    ${new Date(plan.fecha_inicio).toLocaleDateString()} - ${new Date(plan.fecha_fin_estimada).toLocaleDateString()}
                                </span>
                                <span class="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
                                    <i class="fas fa-layer-group text-purple-600"></i>
                                    Nivel ${plan.nivel}
                                </span>
                            </div>
                            
                            ${plan.progreso > 0 ? `
                                <div class="mb-3">
                                    <div class="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                                        <span>Progreso del plan</span>
                                        <span class="font-bold">${plan.progreso}%</span>
                                    </div>
                                    <div class="bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                        <div class="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500" 
                                             style="width: ${plan.progreso}%"></div>
                                    </div>
                                </div>
                            ` : ''}

                            <div class="flex flex-wrap gap-2">
                                ${(plan.areas_enfoque || []).map(area => `
                                    <span class="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs font-semibold">
                                        ${area}
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                        <div class="ml-4">
                            <span class="px-4 py-2 rounded-xl text-sm font-bold ${config.color} border-2 flex items-center gap-2 whitespace-nowrap">
                                <i class="fas ${config.icono}"></i>
                                ${config.texto}
                            </span>
                        </div>
                    </div>
                    
                    <div class="flex justify-between items-center pt-4 border-t-2 border-gray-200 dark:border-gray-700">
                        <p class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <i class="fas fa-clock"></i>
                            Creado: ${new Date(plan.creado_en).toLocaleDateString('es-MX')}
                        </p>
                        <div class="flex gap-2">
                            <button class="text-primary-600 dark:text-primary-400 hover:text-primary-700 text-sm font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                                    onclick="planificacionProfesor.verDetalles(${plan.id})">
                                <i class="fas fa-eye"></i> Ver Detalles
                            </button>
                            <button class="text-red-600 dark:text-red-400 hover:text-red-700 text-sm font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                    onclick="planificacionProfesor.eliminarPlan(${plan.id})">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ============================================
    // GESTIÓN DE PLANES (CON DATOS REALES)
    // ============================================

    async manejarEnvioFormulario(event) {
        event.preventDefault();
        
        const elementos = this.elementos;
        const formData = new FormData(elementos.formPlan);
        
        const datos = {
            titulo: formData.get('titulo'),
            descripcion: formData.get('descripcion'),
            nivel: formData.get('nivel'),
            fecha_inicio: formData.get('fecha_inicio'),
            fecha_fin: formData.get('fecha_fin')
        };

        // ✅ VALIDAR MÍNIMO 5 ALUMNOS
        if (!this.validarMinimoAlumnos()) {
            this.mostrarError('Debes seleccionar al menos 5 alumnos para crear el plan');
            return;
        }

        if (!datos.titulo || !datos.descripcion || !datos.nivel) {
            this.mostrarError('Por favor completa todos los campos requeridos');
            return;
        }

        try {
            elementos.btnGuardarPlan.disabled = true;
            elementos.btnGuardarPlan.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creando Planes...';
            
            // ✅ CREAR PLAN PARA CADA ALUMNO SELECCIONADO
            const alumnosIds = Array.from(this.estado.alumnosSeleccionados);
            let planesCreados = 0;

            for (const alumnoId of alumnosIds) {
                await this.crearPlanIndividual({
                    ...datos,
                    estudiante_id: alumnoId
                });
                planesCreados++;
            }
            
            this.mostrarExito(`¡${planesCreados} planes creados exitosamente! 🎉`);
            elementos.formPlan.reset();
            this.estado.alumnosSeleccionados.clear();
            this.ocultarModalPlan();
            
            // Recargar datos
            await this.cargarPlanes();
            this.renderizarPlanes();
            this.renderizarListaAlumnos();
            
        } catch (error) {
            console.error('❌ Error creando planes:', error);
            this.mostrarError('Error al crear los planes: ' + error.message);
        } finally {
            elementos.btnGuardarPlan.disabled = false;
            elementos.btnGuardarPlan.innerHTML = '<i class="fas fa-save mr-2"></i>Crear Planes';
        }
    }

    async crearPlanIndividual(datos) {
        const areasArray = Array.from(document.querySelectorAll('input[name="areas_enfoque"]:checked'))
            .map(cb => cb.value);

        const planData = {
            estudiante_id: datos.estudiante_id,
            titulo: datos.titulo,
            descripcion: datos.descripcion,
            areas_enfoque: areasArray,
            nivel: datos.nivel,
            fecha_inicio: datos.fecha_inicio,
            fecha_fin_estimada: datos.fecha_fin,
            estado: 'pendiente',
            progreso: 0
        };

        console.log('📤 Enviando plan:', planData);

        const response = await fetch(`${this.API_URL}/profesor/planes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify(planData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        return result.data;
    }

    mostrarModalPlan() {
        const elementos = this.elementos;
        elementos.modalPlan.classList.remove('hidden');
        elementos.modalPlan.classList.add('flex');
        
        // Resetear selecciones
        this.estado.alumnosSeleccionados.clear();
        this.renderizarListaAlumnos();
        
        const hoy = new Date().toISOString().split('T')[0];
        if (elementos.inputFechaInicio) {
            elementos.inputFechaInicio.min = hoy;
            elementos.inputFechaInicio.value = hoy;
        }
        if (elementos.inputFechaFin) {
            const enUnMes = new Date();
            enUnMes.setMonth(enUnMes.getMonth() + 1);
            elementos.inputFechaFin.min = hoy;
            elementos.inputFechaFin.value = enUnMes.toISOString().split('T')[0];
        }
    }

    ocultarModalPlan() {
        const elementos = this.elementos;
        elementos.modalPlan.classList.add('hidden');
        elementos.modalPlan.classList.remove('flex');
        elementos.formPlan.reset();
        this.estado.alumnosSeleccionados.clear();
        this.renderizarListaAlumnos();
    }

    // ============================================
    // ACCIONES DE PLANES
    // ============================================

    verDetalles(planId) {
        const plan = this.estado.planes.find(p => p.id === planId);
        if (!plan) return;

        alert(`📋 Plan: ${plan.titulo}\n\n` +
              `👤 Estudiante: ${plan.estudiante_nombre}\n` +
              `📚 Nivel: ${plan.nivel}\n` +
              `📅 Duración: ${new Date(plan.fecha_inicio).toLocaleDateString()} - ${new Date(plan.fecha_fin_estimada).toLocaleDateString()}\n` +
              `✅ Progreso: ${plan.progreso}%\n` +
              `📊 Estado: ${plan.estado}\n\n` +
              `Áreas de enfoque:\n${(plan.areas_enfoque || []).map(a => `• ${a}`).join('\n')}`
        );
    }

    async eliminarPlan(planId) {
        const plan = this.estado.planes.find(p => p.id === planId);
        if (!plan) return;

        const confirmado = confirm(`¿Estás seguro de eliminar el plan "${plan.titulo}"?`);
        if (!confirmado) return;

        try {
            const response = await fetch(`${this.API_URL}/profesor/planes/${planId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) throw new Error(`Error ${response.status} eliminando plan`);

            this.estado.planes = this.estado.planes.filter(p => p.id !== planId);
            this.renderizarPlanes();
            this.mostrarExito('Plan eliminado correctamente ✅');
        } catch (error) {
            console.error('❌ Error eliminando plan:', error);
            this.mostrarError('Error al eliminar el plan: ' + error.message);
        }
    }

    // ============================================
    // UTILIDADES
    // ============================================

    mostrarCargando(tipo, mostrar) {
        const elementos = this.elementos;
        const elemento = tipo === 'dashboard' ? elementos.loadingDashboard : elementos.loadingPlanes;
        if (elemento) elemento.classList.toggle('hidden', !mostrar);
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
    // EVENT LISTENERS
    // ============================================

    configurarEventListeners() {
        const elementos = this.elementos;

        if (elementos.btnCrearPlan) {
            elementos.btnCrearPlan.addEventListener('click', () => this.mostrarModalPlan());
        }

        if (elementos.btnCrearPrimerPlan) {
            elementos.btnCrearPrimerPlan.addEventListener('click', () => this.mostrarModalPlan());
        }

        if (elementos.formPlan) {
            elementos.formPlan.addEventListener('submit', (e) => this.manejarEnvioFormulario(e));
        }

        if (elementos.btnCancelarPlan) {
            elementos.btnCancelarPlan.addEventListener('click', () => this.ocultarModalPlan());
        }

        if (elementos.modalPlan) {
            elementos.modalPlan.addEventListener('click', (e) => {
                if (e.target === elementos.modalPlan) this.ocultarModalPlan();
            });
        }

        if (elementos.inputFechaInicio && elementos.inputFechaFin) {
            elementos.inputFechaInicio.addEventListener('change', function() {
                elementos.inputFechaFin.min = this.value;
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !elementos.modalPlan.classList.contains('hidden')) {
                this.ocultarModalPlan();
            }
        });
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================

let planificacionProfesor;

document.addEventListener('DOMContentLoaded', () => {
    planificacionProfesor = new PlanificacionProfesor();
});

window.planificacionProfesor = planificacionProfesor;

// Funciones globales para HTML
window.toggleAlumno = (alumnoId) => planificacionProfesor.toggleAlumno(alumnoId);
window.mostrarModalPlan = () => planificacionProfesor.mostrarModalPlan();
window.ocultarModalPlan = () => planificacionProfesor.ocultarModalPlan();