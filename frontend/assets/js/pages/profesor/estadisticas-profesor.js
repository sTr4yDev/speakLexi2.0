/* ============================================
   SPEAKLEXI - ESTADÍSTICAS PROFESOR (VERSIÓN EXTENDIDA DEL DASHBOARD)
   Archivo: assets/js/pages/profesor/estadisticas-profesor.js
   UC-13: Consultar estadísticas de progreso - MISMAS MÉTRICAS QUE DASHBOARD + EXTRAS
   ============================================ */

class EstadisticasProfesor {
    constructor() {
        this.API_URL = window.API_CONFIG?.API_URL || 'http://localhost:5000/api';
        this.token = localStorage.getItem('token');
        this.estado = {
            profesor: null,
            estadisticas: null,
            estudiantes: [],
            filtros: {
                nivel: 'todos',
                idioma: 'todos',
                fecha_desde: '',
                fecha_hasta: ''
            },
            charts: {},
            datosCargados: false
        };
        this.init();
    }

    async init() {
        try {
            console.log('✅ Módulo Estadísticas Profesor iniciando...');
            
            await this.verificarAutenticacion();
            await this.cargarDatosCompletos();
            this.configurarEventListeners();
            this.configurarFechas();
            
            console.log('✅ Módulo Estadísticas Profesor listo');
        } catch (error) {
            console.error('💥 Error inicializando módulo:', error);
            this.mostrarError('Error al cargar el módulo de estadísticas');
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
            // Filtros
            filtroNivel: document.getElementById('filtro-nivel'),
            filtroIdioma: document.getElementById('filtro-idioma'),
            filtroFechaDesde: document.getElementById('filtro-fecha-desde'),
            filtroFechaHasta: document.getElementById('filtro-fecha-hasta'),
            btnFiltrar: document.getElementById('btn-filtrar'),
            btnExportar: document.getElementById('btn-exportar'),
            btnRecargar: document.getElementById('btn-recargar'),
            
            // ✅ MISMAS ESTADÍSTICAS QUE EL DASHBOARD
            totalEstudiantes: document.getElementById('total-alumnos'),
            promedioClase: document.getElementById('xp-promedio'),
            leccionesCompletadas: document.getElementById('lecciones-completadas'),
            tiempoTotalHoras: document.getElementById('tiempo-promedio'),
            
            // ✅ ESTADÍSTICAS ADICIONALES (EXTRAS)
            tasaCompletacion: document.getElementById('tasa-completacion'),
            alumnosActivos: document.getElementById('alumnos-activos'),
            
            // Gráficos
            graficoProgresoNiveles: document.getElementById('grafico-progreso-niveles'),
            graficoDistribucionHabilidades: document.getElementById('grafico-distribucion-habilidades'),
            graficoTendenciaMensual: document.getElementById('grafico-tendencia-mensual'),
            
            // Tablas
            tablaMejoresAlumnos: document.getElementById('tabla-mejores-alumnos'),
            tablaAreasCriticas: document.getElementById('tabla-areas-criticas'),
            tablaProgresoAlumnos: document.getElementById('tabla-progreso-alumnos'),
            
            // Estados
            loadingIndicator: document.getElementById('loading-indicator'),
            errorMessage: document.getElementById('error-message'),
            estadoSinDatos: document.getElementById('estado-sin-datos'),
            contenedorEstadisticas: document.getElementById('contenedor-estadisticas')
        };
    }

    // ============================================
    // FUNCIONES PRINCIPALES - USANDO DASHBOARD COMO BASE
    // ============================================

    async cargarDatosCompletos() {
        try {
            this.mostrarCargando(true);
            this.ocultarError();
            this.ocultarEstadoSinDatos();

            console.log('🔄 Cargando datos completos del profesor...');

            // Construir parámetros para filtros
            const params = new URLSearchParams();
            
            if (this.estado.filtros.nivel !== 'todos') {
                params.append('nivel', this.estado.filtros.nivel);
            }
            if (this.estado.filtros.idioma !== 'todos') {
                params.append('idioma', this.estado.filtros.idioma);
            }
            if (this.estado.filtros.fecha_desde) {
                params.append('fecha_desde', this.estado.filtros.fecha_desde);
            }
            if (this.estado.filtros.fecha_hasta) {
                params.append('fecha_hasta', this.estado.filtros.fecha_hasta);
            }

            // ✅ USAR EL MISMO ENDPOINT QUE EL DASHBOARD
            const endpoint = `${this.API_URL}/profesor/dashboard${params.toString() ? '?' + params.toString() : ''}`;
            console.log('📊 Endpoint dashboard:', endpoint);

            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Error en la respuesta del servidor');
            }

            console.log('✅ Datos del dashboard cargados:', result.data);
            
            // ✅ ESTRUCTURA IDÉNTICA AL DASHBOARD
            this.estado.profesor = result.data.profesor;
            this.estado.estadisticas = result.data.estadisticas;
            this.estado.estudiantes = result.data.estudiantes_recientes || [];
            
            this.estado.datosCargados = true;
            
            this.renderizarEstadisticasCompletas();
            this.mostrarExito('Estadísticas actualizadas correctamente');
            
        } catch (error) {
            console.error('❌ Error cargando datos:', error);
            
            if (error.message.includes('404') || error.message.includes('No hay datos')) {
                this.mostrarEstadoSinDatos('No hay datos disponibles para los filtros seleccionados.');
            } else {
                this.mostrarError('Error al cargar las estadísticas. Verifica tu conexión e intenta nuevamente.');
            }
            
        } finally {
            this.mostrarCargando(false);
        }
    }

    // ============================================
    // RENDERIZADO - MISMAS MÉTRICAS + EXTRAS
    // ============================================

    renderizarEstadisticasCompletas() {
        if (!this.estado.estadisticas || !this.estado.datosCargados) {
            this.mostrarEstadoSinDatos('No hay datos disponibles para mostrar.');
            return;
        }

        console.log('🔍 Estructura completa de datos:', this.estado);
        this.mostrarContenedorEstadisticas();
        
        // ✅ 1. MISMAS ESTADÍSTICAS PRINCIPALES QUE EL DASHBOARD
        this.renderizarEstadisticasPrincipales();
        
        // ✅ 2. GRÁFICOS EXTENDIDOS
        this.renderizarGraficoProgresoNiveles();
        this.renderizarGraficoDistribucionXP();
        this.renderizarGraficoTendenciaMensual();
        
        // ✅ 3. TABLAS DETALLADAS
        this.renderizarTablaMejoresAlumnos();
        this.renderizarTablaAreasCriticas();
        this.renderizarTablaProgresoCompleto();
    }

    renderizarEstadisticasPrincipales() {
        const elementos = this.elementos;
        const datos = this.estado.estadisticas || {};
        
        console.log('📊 Datos para estadísticas principales:', datos);

        // ✅ TOTAL ESTUDIANTES (IGUAL AL DASHBOARD)
        if (elementos.totalEstudiantes) {
            elementos.totalEstudiantes.textContent = datos.total_estudiantes || 0;
        }
        
        // ✅ PROMEDIO CLASE (IGUAL AL DASHBOARD)
        if (elementos.promedioClase) {
            const promedio = Math.round(datos.promedio_clase || 0);
            elementos.promedioClase.textContent = `${promedio}%`;
        }
        
        // ✅ LECCIONES COMPLETADAS (IGUAL AL DASHBOARD)
        if (elementos.leccionesCompletadas) {
            elementos.leccionesCompletadas.textContent = 
                (datos.total_lecciones_completadas || 0).toLocaleString();
        }
        
        // ✅ TIEMPO TOTAL HORAS (IGUAL AL DASHBOARD)
        if (elementos.tiempoTotalHoras) {
            const horas = Math.round(datos.tiempo_total_horas || 0);
            elementos.tiempoTotalHoras.textContent = `${horas}h`;
        }
        
        // ✅ ESTADÍSTICAS ADICIONALES (EXTRAS)
        if (elementos.tasaCompletacion) {
            // Calcular tasa de completación basada en estudiantes activos
            const totalEstudiantes = datos.total_estudiantes || 0;
            const estudiantesActivos = this.estado.estudiantes.filter(e => 
                (e.lecciones_completadas || 0) > 0
            ).length;
            const tasa = totalEstudiantes > 0 ? Math.round((estudiantesActivos / totalEstudiantes) * 100) : 0;
            elementos.tasaCompletacion.textContent = `${tasa}%`;
        }
        
        if (elementos.alumnosActivos) {
            const estudiantesActivos = this.estado.estudiantes.filter(e => 
                (e.lecciones_completadas || 0) > 0
            ).length;
            elementos.alumnosActivos.textContent = estudiantesActivos;
        }
    }

    renderizarGraficoProgresoNiveles() {
        const elementos = this.elementos;
        if (!elementos.graficoProgresoNiveles || !window.Chart) return;
        
        const estudiantes = this.estado.estudiantes;
        
        if (estudiantes.length === 0) {
            elementos.graficoProgresoNiveles.innerHTML = this.crearEstadoVacio('niveles');
            return;
        }

        // Agrupar estudiantes por nivel (IGUAL AL DASHBOARD)
        const niveles = {};
        estudiantes.forEach(estudiante => {
            const nivel = estudiante.nivel_actual || estudiante.nivel || 'A1';
            if (!niveles[nivel]) {
                niveles[nivel] = 0;
            }
            niveles[nivel]++;
        });

        const ctx = elementos.graficoProgresoNiveles.getContext('2d');
        
        if (this.estado.charts.progresoNiveles) {
            this.estado.charts.progresoNiveles.destroy();
        }
        
        this.estado.charts.progresoNiveles = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(niveles).map(nivel => `Nivel ${nivel}`),
                datasets: [{
                    data: Object.values(niveles),
                    backgroundColor: [
                        'rgba(99, 102, 241, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(14, 165, 233, 0.8)'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Distribución de Estudiantes por Nivel',
                        font: { size: 16 }
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    renderizarGraficoDistribucionXP() {
        const elementos = this.elementos;
        if (!elementos.graficoDistribucionHabilidades || !window.Chart) return;
        
        const estudiantes = this.estado.estudiantes;
        
        if (estudiantes.length === 0) {
            elementos.graficoDistribucionHabilidades.innerHTML = this.crearEstadoVacio('distribución XP');
            return;
        }

        // Crear rangos de XP
        const rangosXP = {
            '0-500': 0,
            '501-1000': 0,
            '1001-2000': 0,
            '2001-5000': 0,
            '5000+': 0
        };

        estudiantes.forEach(est => {
            const xp = est.total_xp || 0;
            if (xp <= 500) rangosXP['0-500']++;
            else if (xp <= 1000) rangosXP['501-1000']++;
            else if (xp <= 2000) rangosXP['1001-2000']++;
            else if (xp <= 5000) rangosXP['2001-5000']++;
            else rangosXP['5000+']++;
        });

        const ctx = elementos.graficoDistribucionHabilidades.getContext('2d');
        
        if (this.estado.charts.distribucionXP) {
            this.estado.charts.distribucionXP.destroy();
        }

        this.estado.charts.distribucionXP = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(rangosXP),
                datasets: [{
                    label: 'Estudiantes',
                    data: Object.values(rangosXP),
                    backgroundColor: 'rgba(99, 102, 241, 0.8)',
                    borderColor: 'rgb(99, 102, 241)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Distribución de Estudiantes por XP Total'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Cantidad de Estudiantes'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Rangos de XP'
                        }
                    }
                }
            }
        });
    }

    renderizarGraficoTendenciaMensual() {
        const elementos = this.elementos;
        if (!elementos.graficoTendenciaMensual || !window.Chart) return;
        
        // Simular datos de tendencia (en una implementación real vendrían del backend)
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
        const progresoPromedio = [65, 68, 72, 75, 78, 80];
        const leccionesCompletadas = [45, 52, 48, 61, 67, 73];

        const ctx = elementos.graficoTendenciaMensual.getContext('2d');
        
        if (this.estado.charts.tendenciaMensual) {
            this.estado.charts.tendenciaMensual.destroy();
        }

        this.estado.charts.tendenciaMensual = new Chart(ctx, {
            type: 'line',
            data: {
                labels: meses,
                datasets: [
                    {
                        label: 'Progreso Promedio (%)',
                        data: progresoPromedio,
                        borderColor: 'rgb(99, 102, 241)',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Lecciones Completadas',
                        data: leccionesCompletadas,
                        borderColor: 'rgb(16, 185, 129)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Tendencia de Progreso Mensual'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Métricas'
                        }
                    }
                }
            }
        });
    }

    renderizarTablaMejoresAlumnos() {
        const elementos = this.elementos;
        if (!elementos.tablaMejoresAlumnos) return;
        
        // ✅ ORDENAR POR XP (IGUAL AL TOP ESTUDIANTES DEL DASHBOARD)
        const estudiantesOrdenados = [...this.estado.estudiantes].sort((a, b) => 
            (b.total_xp || 0) - (a.total_xp || 0)
        );
        const mejoresAlumnos = estudiantesOrdenados.slice(0, 10); // Top 10 en lugar de 5
        
        if (mejoresAlumnos.length === 0) {
            elementos.tablaMejoresAlumnos.innerHTML = this.crearFilaVacia(6, 'No hay datos de alumnos disponibles');
            return;
        }

        let html = '';
        mejoresAlumnos.forEach((alumno, index) => {
            const nombreCompleto = alumno.nombre_completo || 
                                  `${alumno.nombre || ''} ${alumno.primer_apellido || ''}`.trim() ||
                                  'Alumno';
            
            const iniciales = nombreCompleto.split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);
            
            const progreso = Math.round(alumno.promedio_progreso || alumno.promedio_general || 0);
            
            html += `
                <tr class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td class="px-4 py-3 text-center font-semibold">
                        <span class="flex items-center justify-center w-6 h-6 bg-primary-500 text-white rounded-full text-sm">
                            ${index + 1}
                        </span>
                    </td>
                    <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                ${iniciales}
                            </div>
                            <div>
                                <div class="font-semibold">${nombreCompleto}</div>
                                <div class="text-xs text-gray-500">${alumno.correo || ''}</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-4 py-3 text-center">
                        <span class="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs rounded-full font-semibold">
                            ${alumno.nivel_actual || alumno.nivel || 'A1'}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-center font-semibold text-primary-600 dark:text-primary-400">
                        ${this.formatearNumero(alumno.total_xp || 0)}
                    </td>
                    <td class="px-4 py-3 text-center">${alumno.lecciones_completadas || 0}</td>
                    <td class="px-4 py-3 text-center">
                        <div class="flex items-center justify-center gap-2">
                            <div class="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                <div class="bg-green-500 h-2 rounded-full transition-all" 
                                     style="width: ${progreso}%"></div>
                            </div>
                            <span class="text-sm font-medium">${progreso}%</span>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        elementos.tablaMejoresAlumnos.innerHTML = html;
    }

    renderizarTablaAreasCriticas() {
        const elementos = this.elementos;
        if (!elementos.tablaAreasCriticas) return;
        
        const estudiantes = this.estado.estudiantes;
        
        if (estudiantes.length === 0) {
            elementos.tablaAreasCriticas.innerHTML = this.crearFilaVacia(4, 'No hay datos de estudiantes disponibles');
            return;
        }

        // Identificar estudiantes con bajo progreso (MENOS de 50%)
        const estudiantesConBajoProgreso = estudiantes
            .map(est => {
                const progreso = est.promedio_progreso || est.promedio_general || 0;
                const leccionesCompletadas = est.lecciones_completadas || 0;
                
                return {
                    nombre: est.nombre_completo || `${est.nombre || ''} ${est.primer_apellido || ''}`.trim(),
                    progreso: Math.round(progreso),
                    leccionesCompletadas: leccionesCompletadas,
                    nivel: est.nivel_actual || est.nivel || 'A1',
                    criticidad: progreso < 30 ? 'alta' : progreso < 50 ? 'media' : 'baja'
                };
            })
            .filter(est => est.criticidad !== 'baja')
            .sort((a, b) => a.progreso - b.progreso)
            .slice(0, 8);

        if (estudiantesConBajoProgreso.length === 0) {
            elementos.tablaAreasCriticas.innerHTML = `
                <tr>
                    <td colspan="4" class="px-4 py-8 text-center text-green-500">
                        <div class="flex items-center justify-center gap-2">
                            <i class="fas fa-check-circle"></i>
                            <span>¡Excelente! No hay áreas críticas identificadas</span>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        estudiantesConBajoProgreso.forEach(est => {
            const colorCriticidad = est.criticidad === 'alta' ? 
                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' : 
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            
            const textoCriticidad = est.criticidad === 'alta' ? 'Alta' : 'Media';
            const iconoCriticidad = est.criticidad === 'alta' ? 'fa-exclamation-triangle' : 'fa-exclamation-circle';
            
            html += `
                <tr class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        <div class="flex items-center gap-2">
                            <i class="fas ${iconoCriticidad} ${est.criticidad === 'alta' ? 'text-red-500' : 'text-yellow-500'}"></i>
                            ${est.nombre}
                        </div>
                    </td>
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-3">
                            <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 flex-1">
                                <div class="h-2 rounded-full transition-all duration-500 ${
                                    est.criticidad === 'alta' ? 'bg-red-500' : 'bg-yellow-500'
                                }" style="width: ${est.progreso}%"></div>
                            </div>
                            <span class="text-sm font-semibold text-gray-600 dark:text-gray-400 min-w-12">
                                ${est.progreso}%
                            </span>
                        </div>
                    </td>
                    <td class="px-4 py-3 text-center">
                        <span class="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 text-xs rounded-full font-medium">
                            ${est.nivel}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-center">
                        <span class="px-3 py-1 ${colorCriticidad} text-xs rounded-full font-semibold">
                            ${textoCriticidad}
                        </span>
                    </td>
                </tr>
            `;
        });
        
        elementos.tablaAreasCriticas.innerHTML = html;
    }

    renderizarTablaProgresoCompleto() {
        const elementos = this.elementos;
        if (!elementos.tablaProgresoAlumnos) return;
        
        const estudiantes = this.estado.estudiantes;
        
        if (estudiantes.length === 0) {
            elementos.tablaProgresoAlumnos.innerHTML = this.crearFilaVacia(7, 'No hay datos de progreso disponibles');
            return;
        }

        let html = '';
        estudiantes.forEach(est => {
            const nombreCompleto = est.nombre_completo || 
                                  `${est.nombre || ''} ${est.primer_apellido || ''}`.trim();
            
            const iniciales = nombreCompleto.split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);
            
            const progreso = Math.round(est.promedio_progreso || est.promedio_general || 0);
            const leccionesTotales = est.lecciones_iniciadas || est.lecciones_en_progreso || 0;
            const leccionesCompletadas = est.lecciones_completadas || 0;
            
            // Calcular eficiencia (completadas/iniciadas)
            const eficiencia = leccionesTotales > 0 ? 
                Math.round((leccionesCompletadas / leccionesTotales) * 100) : 0;

            html += `
                <tr class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                ${iniciales}
                            </div>
                            <span class="font-medium text-gray-900 dark:text-white">${nombreCompleto}</span>
                        </div>
                    </td>
                    <td class="px-4 py-3 text-center">
                        <span class="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs rounded-full font-semibold">
                            ${est.nivel_actual || est.nivel || 'A1'}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-center font-semibold text-primary-600 dark:text-primary-400">
                        ${this.formatearNumero(est.total_xp || 0)}
                    </td>
                    <td class="px-4 py-3 text-center">
                        ${leccionesCompletadas}/${leccionesTotales}
                    </td>
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-2">
                            <div class="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2 flex-1">
                                <div class="bg-green-500 h-2 rounded-full transition-all" 
                                     style="width: ${progreso}%"></div>
                            </div>
                            <span class="text-sm font-medium min-w-12">${progreso}%</span>
                        </div>
                    </td>
                    <td class="px-4 py-3 text-center">
                        <span class="px-2 py-1 ${eficiencia >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 
                                            eficiencia >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' : 
                                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'} 
                              text-xs rounded-full font-semibold">
                            ${eficiencia}%
                        </span>
                    </td>
                    <td class="px-4 py-3 text-center">
                        <span class="flex items-center justify-center gap-1 ${est.racha_actual >= 7 ? 'text-green-600' : 'text-orange-600'}">
                            <i class="fas fa-fire text-sm"></i> 
                            ${est.racha_actual || 0}d
                        </span>
                    </td>
                </tr>
            `;
        });
        
        elementos.tablaProgresoAlumnos.innerHTML = html;
    }

    // ============================================
    // FUNCIONES AUXILIARES
    // ============================================

    crearEstadoVacio(tipo) {
        return `
            <div class="flex items-center justify-center h-full text-gray-500">
                <div class="text-center">
                    <i class="fas fa-chart-bar text-4xl mb-4 text-gray-300"></i>
                    <p>No hay datos de ${tipo} disponibles</p>
                </div>
            </div>
        `;
    }

    crearFilaVacia(numColumnas, mensaje) {
        return `
            <tr>
                <td colspan="${numColumnas}" class="px-4 py-8 text-center text-gray-500">
                    ${mensaje}
                </td>
            </tr>
        `;
    }

    formatearNumero(numero) {
        return new Intl.NumberFormat('es-MX').format(numero);
    }

    // ============================================
    // GESTIÓN DE FILTROS (MANTENIDO)
    // ============================================

    async aplicarFiltros() {
        console.log('🎯 Aplicando filtros:', this.estado.filtros);
        await this.cargarDatosCompletos();
    }

    async recargarEstadisticas() {
        console.log('🔄 Recargando estadísticas...');
        this.estado.filtros = {
            nivel: 'todos',
            idioma: 'todos',
            fecha_desde: '',
            fecha_hasta: ''
        };
        
        const elementos = this.elementos;
        if (elementos.filtroNivel) elementos.filtroNivel.value = 'todos';
        if (elementos.filtroIdioma) elementos.filtroIdioma.value = 'todos';
        if (elementos.filtroFechaDesde) elementos.filtroFechaDesde.value = '';
        if (elementos.filtroFechaHasta) elementos.filtroFechaHasta.value = '';
        
        await this.cargarDatosCompletos();
    }

    async exportarReporte() {
        try {
            this.mostrarInfo('Generando reporte de estadísticas...');
            setTimeout(() => {
                this.mostrarExito('Reporte generado exitosamente (funcionalidad en desarrollo)');
            }, 1500);
        } catch (error) {
            console.error('❌ Error exportando reporte:', error);
            this.mostrarError('Error al generar el reporte.');
        }
    }

    // ============================================
    // CONFIGURACIÓN Y MANEJO DE ESTADOS (MANTENIDO)
    // ============================================

    configurarEventListeners() {
        const elementos = this.elementos;

        if (elementos.filtroNivel) {
            elementos.filtroNivel.addEventListener('change', (e) => {
                this.estado.filtros.nivel = e.target.value;
            });
        }
        
        if (elementos.filtroIdioma) {
            elementos.filtroIdioma.addEventListener('change', (e) => {
                this.estado.filtros.idioma = e.target.value;
            });
        }
        
        if (elementos.filtroFechaDesde) {
            elementos.filtroFechaDesde.addEventListener('change', (e) => {
                this.estado.filtros.fecha_desde = e.target.value;
                if (elementos.filtroFechaHasta) {
                    elementos.filtroFechaHasta.min = e.target.value;
                }
            });
        }
        
        if (elementos.filtroFechaHasta) {
            elementos.filtroFechaHasta.addEventListener('change', (e) => {
                this.estado.filtros.fecha_hasta = e.target.value;
            });
        }

        if (elementos.btnFiltrar) {
            elementos.btnFiltrar.addEventListener('click', () => this.aplicarFiltros());
        }
        
        if (elementos.btnExportar) {
            elementos.btnExportar.addEventListener('click', () => this.exportarReporte());
        }
        
        if (elementos.btnRecargar) {
            elementos.btnRecargar.addEventListener('click', () => this.recargarEstadisticas());
        }
    }

    configurarFechas() {
        const elementos = this.elementos;
        const hoy = new Date().toISOString().split('T')[0];
        
        if (elementos.filtroFechaDesde) {
            elementos.filtroFechaDesde.max = hoy;
        }
        if (elementos.filtroFechaHasta) {
            elementos.filtroFechaHasta.max = hoy;
        }
    }

    mostrarCargando(mostrar) {
        const elementos = this.elementos;
        if (elementos.loadingIndicator) {
            elementos.loadingIndicator.classList.toggle('hidden', !mostrar);
        }
    }

    mostrarError(mensaje) {
        const elementos = this.elementos;
        if (elementos.errorMessage) {
            elementos.errorMessage.textContent = mensaje;
            elementos.errorMessage.classList.remove('hidden');
        }
        this.ocultarContenedorEstadisticas();
        
        if (window.toastManager) {
            window.toastManager.error(mensaje);
        }
    }

    ocultarError() {
        const elementos = this.elementos;
        if (elementos.errorMessage) {
            elementos.errorMessage.classList.add('hidden');
        }
    }

    mostrarExito(mensaje) {
        if (window.toastManager) {
            window.toastManager.success(mensaje);
        }
    }

    mostrarInfo(mensaje) {
        if (window.toastManager) {
            window.toastManager.info(mensaje);
        }
    }

    mostrarEstadoSinDatos(mensaje) {
        const elementos = this.elementos;
        if (elementos.estadoSinDatos) {
            elementos.estadoSinDatos.innerHTML = `
                <div class="text-center py-12">
                    <div class="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-chart-bar text-gray-400 text-2xl"></i>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Sin datos disponibles</h3>
                    <p class="text-gray-600 dark:text-gray-400 mb-6">${mensaje}</p>
                    <button onclick="estadisticasProfesor.recargarEstadisticas()" class="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
                        <i class="fas fa-sync-alt mr-2"></i>Reintentar
                    </button>
                </div>
            `;
            elementos.estadoSinDatos.classList.remove('hidden');
        }
        this.ocultarContenedorEstadisticas();
    }

    ocultarEstadoSinDatos() {
        const elementos = this.elementos;
        if (elementos.estadoSinDatos) {
            elementos.estadoSinDatos.classList.add('hidden');
        }
    }

    mostrarContenedorEstadisticas() {
        const elementos = this.elementos;
        if (elementos.contenedorEstadisticas) {
            elementos.contenedorEstadisticas.classList.remove('hidden');
        }
    }

    ocultarContenedorEstadisticas() {
        const elementos = this.elementos;
        if (elementos.contenedorEstadisticas) {
            elementos.contenedorEstadisticas.classList.add('hidden');
        }
    }
}

// ============================================
// INICIALIZACIÓN GLOBAL
// ============================================

let estadisticasProfesor;

document.addEventListener('DOMContentLoaded', () => {
    estadisticasProfesor = new EstadisticasProfesor();
});

window.estadisticasProfesor = estadisticasProfesor;
window.recargarEstadisticas = () => estadisticasProfesor?.recargarEstadisticas();
window.aplicarFiltros = () => estadisticasProfesor?.aplicarFiltros();
window.exportarReporte = () => estadisticasProfesor?.exportarReporte();