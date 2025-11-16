// frontend/assets/js/pages/estudiante/lecciones.js
// VERSIÓN SIMPLIFICADA - SOLO LECCIONES DEL NIVEL E IDIOMA DEL USUARIO

(async () => {
    'use strict';

    const dependencias = ['APP_CONFIG', 'apiClient', 'ModuleLoader'];

    const inicializado = await window.ModuleLoader.initModule({
        moduleName: 'Lecciones',
        dependencies: dependencias,
        onReady: inicializarLecciones,
        onError: (error) => {
            console.error('Error cargando lecciones:', error);
        }
    });

    if (!inicializado) return;

    async function inicializarLecciones() {
        console.log('✅ Módulo de Lecciones iniciando...');

        const client = window.apiClient;
        let filtros = {
            busqueda: '',
            limit: 50,
            offset: 0
        };

        // Elementos DOM
        const elementos = {
            busquedaInput: document.getElementById('busqueda-input'),
            leccionesGrid: document.getElementById('lecciones-grid'),
            loading: document.getElementById('loading-lecciones'),
            sinResultados: document.getElementById('sin-resultados'),
            totalLecciones: document.getElementById('total-lecciones'),
            estadisticas: document.getElementById('estadisticas-container'),
            paginacion: document.getElementById('paginacion-container'),
            infoUsuario: document.getElementById('info-usuario'),
            nivelUsuario: document.getElementById('nivel-usuario'),
            idiomaUsuario: document.getElementById('idioma-usuario')
        };

        // Cargar lecciones del usuario
        async function cargarLecciones() {
            try {
                elementos.loading.classList.remove('hidden');
                elementos.leccionesGrid.classList.add('hidden');
                elementos.sinResultados.classList.add('hidden');

                // Construir query string - SIN filtros de nivel/idioma
                const params = new URLSearchParams();
                
                if (filtros.busqueda) {
                    params.append('busqueda', filtros.busqueda);
                }
                
                params.append('limit', filtros.limit);
                params.append('offset', filtros.offset);

                const resultado = await client.get(`/lecciones/catalogo?${params}`);

                // 🔍 DEBUG: Verificar respuesta del backend
                console.log('🔍 DEBUG - Respuesta completa del backend:', resultado);
                console.log('🔍 DEBUG - resultado.data:', resultado.data);
                console.log('🔍 DEBUG - resultado.data.data:', resultado.data?.data);
                console.log('🔍 DEBUG - resultado.data.data?.usuario:', resultado.data?.data?.usuario);

                // ✅ FIX: Manejar doble anidación (apiClient + backend)
                const datos = resultado.data?.data || resultado.data;
                
                console.log('🔍 DEBUG - datos finales:', datos);
                console.log('🔍 DEBUG - datos.usuario:', datos?.usuario);
                console.log('🔍 DEBUG - datos.usuario?.nivel:', datos?.usuario?.nivel);

                if (resultado.success && datos) {
                    const { lecciones, total, estadisticas_por_nivel, usuario, filtros_aplicados } = datos;

                    // 🔍 DEBUG: Verificar estructura de usuario
                    console.log('🔍 DEBUG - Estructura usuario:', {
                        usuarioCompleto: usuario,
                        nivel: usuario?.nivel,
                        idioma: usuario?.idioma,
                        tieneNivel: usuario?.nivel !== undefined,
                        tieneIdioma: usuario?.idioma !== undefined
                    });

                    // Actualizar información del usuario
                    if (elementos.nivelUsuario) {
                        elementos.nivelUsuario.textContent = usuario?.nivel || 'A1';
                    }
                    if (elementos.idiomaUsuario) {
                        elementos.idiomaUsuario.textContent = usuario?.idioma || 'Inglés';
                    }

                    // Actualizar contador
                    elementos.totalLecciones.textContent = total || 0;

                    // Mostrar info del usuario
                    mostrarInfoUsuario(usuario);

                    // Renderizar estadísticas
                    renderizarEstadisticas(estadisticas_por_nivel, usuario);

                    if (!lecciones || lecciones.length === 0) {
                        elementos.loading.classList.add('hidden');
                        elementos.sinResultados.classList.remove('hidden');
                        return;
                    }

                    // Renderizar lecciones
                    renderizarLecciones(lecciones);

                    // Renderizar paginación
                    if (total > filtros.limit) {
                        renderizarPaginacion(total);
                    } else {
                        elementos.paginacion.classList.add('hidden');
                    }

                    elementos.loading.classList.add('hidden');
                    elementos.leccionesGrid.classList.remove('hidden');
                } else {
                    console.error('❌ Error en respuesta del backend:', resultado);
                    elementos.loading.classList.add('hidden');
                    elementos.sinResultados.classList.remove('hidden');
                }

            } catch (error) {
                console.error('Error cargando lecciones:', error);
                elementos.loading.classList.add('hidden');
                elementos.sinResultados.classList.remove('hidden');
            }
        }

        // Mostrar información del usuario
        function mostrarInfoUsuario(usuario) {
            if (!elementos.infoUsuario) return;

            // 🔍 DEBUG: Verificar datos del usuario para el banner
            console.log('🔍 DEBUG - Datos usuario para banner:', {
                nivel: usuario?.nivel,
                idioma: usuario?.idioma,
                usuarioCompleto: usuario
            });

            elementos.infoUsuario.innerHTML = `
                <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
                    <div class="flex items-center justify-between">
                        <div>
                            <h2 class="text-2xl font-bold mb-2">Tus Lecciones</h2>
                            <p class="text-blue-100">
                                Nivel <strong>${usuario?.nivel || 'A1'}</strong> • 
                                Idioma <strong>${usuario?.idioma || 'Inglés'}</strong>
                            </p>
                            <p class="text-sm text-blue-200 mt-2">
                                Estas son todas las lecciones disponibles para tu nivel actual
                            </p>
                        </div>
                        <div class="text-right">
                            <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                                <i class="fas fa-graduation-cap text-2xl"></i>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Renderizar estadísticas por nivel
        function renderizarEstadisticas(statsPorNivel, usuario) {
            if (!elementos.estadisticas || !statsPorNivel) return;

            // 🔍 DEBUG: Verificar estadísticas y usuario
            console.log('🔍 DEBUG - Stats por nivel:', statsPorNivel);
            console.log('🔍 DEBUG - Usuario para stats:', usuario);

            // Encontrar estadísticas del nivel actual del usuario
            const nivelActual = usuario?.nivel || 'A1';
            const statsNivelActual = statsPorNivel.find(stat => stat.nivel === nivelActual) || {
                total_lecciones: 0,
                lecciones_completadas: 0,
                porcentaje_completado: 0
            };

            console.log('🔍 DEBUG - Stats nivel actual:', {
                nivelActual,
                statsNivelActual,
                encontrado: statsPorNivel.find(stat => stat.nivel === nivelActual) !== undefined
            });

            const html = `
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <!-- Total Lecciones -->
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                                <i class="fas fa-book text-blue-600 dark:text-blue-400 text-xl"></i>
                            </div>
                            <div>
                                <div class="text-sm text-gray-600 dark:text-gray-400">Total Lecciones</div>
                                <div class="text-3xl font-bold text-gray-900 dark:text-white">${statsNivelActual.total_lecciones}</div>
                                <div class="text-xs text-gray-500 dark:text-gray-500 mt-1">Nivel ${nivelActual}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Completadas -->
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                                <i class="fas fa-check text-green-600 dark:text-green-400 text-xl"></i>
                            </div>
                            <div>
                                <div class="text-sm text-gray-600 dark:text-gray-400">Completadas</div>
                                <div class="text-3xl font-bold text-green-600 dark:text-green-400">${statsNivelActual.lecciones_completadas}</div>
                                <div class="text-xs text-green-600 dark:text-green-400 mt-1">
                                    ${statsNivelActual.porcentaje_completado}% del nivel
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Progreso General -->
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
                                <i class="fas fa-chart-line text-purple-600 dark:text-purple-400 text-xl"></i>
                            </div>
                            <div>
                                <div class="text-sm text-gray-600 dark:text-gray-400">Progreso</div>
                                <div class="text-3xl font-bold text-purple-600 dark:text-purple-400">${statsNivelActual.porcentaje_completado}%</div>
                                <div class="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                    ${statsNivelActual.lecciones_completadas}/${statsNivelActual.total_lecciones} lecciones
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Progreso por Niveles -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700 mb-8">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Progreso por Niveles</h3>
                    <div class="space-y-4">
                        ${statsPorNivel.map(stat => `
                            <div class="flex items-center justify-between p-3 rounded-lg ${stat.nivel === nivelActual ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-700'}">
                                <div class="flex items-center gap-3">
                                    <span class="w-8 h-8 flex items-center justify-center text-sm font-bold 
                                        ${stat.nivel === nivelActual ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'} 
                                        rounded-full">
                                        ${stat.nivel}
                                    </span>
                                    <span class="font-medium ${stat.nivel === nivelActual ? 'text-blue-800 dark:text-blue-200' : 'text-gray-700 dark:text-gray-300'}">
                                        Nivel ${stat.nivel}
                                    </span>
                                </div>
                                <div class="text-right">
                                    <div class="text-sm font-semibold ${stat.nivel === nivelActual ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}">
                                        ${stat.lecciones_completadas}/${stat.total_lecciones}
                                    </div>
                                    <div class="text-xs ${stat.nivel === nivelActual ? 'text-blue-500 dark:text-blue-300' : 'text-gray-500 dark:text-gray-500'}">
                                        ${stat.porcentaje_completado}% completado
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

            elementos.estadisticas.innerHTML = html;
        }

        // Renderizar lecciones
        function renderizarLecciones(lecciones) {
            const html = lecciones.map(leccion => {
                const estadoBadge = obtenerBadgeEstado(leccion.estado_usuario);
                const nivelColor = obtenerColorNivel(leccion.nivel);

                return `
                    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 overflow-hidden group">
                        <!-- Header con nivel -->
                        <div class="bg-gradient-to-r ${nivelColor} p-4">
                            <div class="flex justify-between items-start">
                                <div class="flex-1">
                                    <span class="text-white text-xs font-semibold px-2 py-1 bg-white/20 rounded">
                                        ${leccion.nivel}
                                    </span>
                                    <h3 class="text-white font-bold text-lg mt-2 line-clamp-2">${leccion.titulo}</h3>
                                </div>
                                ${estadoBadge}
                            </div>
                        </div>

                        <!-- Contenido -->
                        <div class="p-6">
                            <p class="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                                ${leccion.descripcion || 'Sin descripción disponible'}
                            </p>

                            <!-- Metadatos -->
                            <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                                <span><i class="fas fa-clock text-blue-500 mr-1"></i>${leccion.duracion_minutos} min</span>
                                <span><i class="fas fa-tasks text-purple-500 mr-1"></i>${leccion.total_ejercicios} ejercicios</span>
                            </div>

                            <!-- Progreso (si existe) -->
                            ${leccion.progreso_usuario > 0 ? `
                                <div class="mb-4">
                                    <div class="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                                        <span>Tu progreso</span>
                                        <span>${leccion.progreso_usuario}%</span>
                                    </div>
                                    <div class="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div class="bg-gradient-to-r from-purple-500 to-blue-500 rounded-full h-2 transition-all" 
                                             style="width: ${leccion.progreso_usuario}%"></div>
                                    </div>
                                </div>
                            ` : ''}

                            <!-- Botón de acción -->
                            <button 
                                onclick="iniciarLeccion(${leccion.id})"
                                class="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all font-semibold group-hover:scale-105 transform flex items-center justify-center gap-2"
                            >
                                ${leccion.estado_usuario === 'completada' ? 
                                    '<i class="fas fa-redo"></i>Revisar' : 
                                    leccion.estado_usuario === 'en_progreso' ? 
                                    '<i class="fas fa-play"></i>Continuar' : 
                                    '<i class="fas fa-play"></i>Comenzar'
                                }
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            elementos.leccionesGrid.innerHTML = html;
        }

        // Obtener badge de estado
        function obtenerBadgeEstado(estado) {
            const badges = {
                'completada': `
                    <span class="text-white text-xs px-3 py-1 bg-green-500 rounded-full flex items-center gap-1">
                        <i class="fas fa-check text-xs"></i>Completada
                    </span>`,
                'en_progreso': `
                    <span class="text-white text-xs px-3 py-1 bg-yellow-500 rounded-full flex items-center gap-1">
                        <i class="fas fa-spinner text-xs"></i>En Progreso
                    </span>`,
                'nueva': `
                    <span class="text-white text-xs px-3 py-1 bg-blue-500 rounded-full flex items-center gap-1">
                        <i class="fas fa-star text-xs"></i>Nueva
                    </span>`
            };
            return badges[estado] || badges.nueva;
        }

        // Obtener color de nivel
        function obtenerColorNivel(nivel) {
            const colores = {
                'A1': 'from-green-500 to-green-600',
                'A2': 'from-blue-500 to-blue-600', 
                'B1': 'from-purple-500 to-purple-600',
                'B2': 'from-pink-500 to-pink-600',
                'C1': 'from-orange-500 to-orange-600',
                'C2': 'from-red-500 to-red-600'
            };
            return colores[nivel] || colores.A1;
        }

        // Renderizar paginación
        function renderizarPaginacion(total) {
            const totalPaginas = Math.ceil(total / filtros.limit);
            const paginaActual = Math.floor(filtros.offset / filtros.limit) + 1;

            let html = '';

            // Botón Anterior
            if (paginaActual > 1) {
                html += `
                    <button onclick="cambiarPagina(${paginaActual - 1})" 
                            class="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
                        <i class="fas fa-chevron-left text-xs"></i>Anterior
                    </button>`;
            }

            // Números de página
            const paginasMostrar = [];
            const rango = 2; // Cuántas páginas mostrar a cada lado de la actual
            
            for (let i = 1; i <= totalPaginas; i++) {
                if (i === 1 || i === totalPaginas || (i >= paginaActual - rango && i <= paginaActual + rango)) {
                    paginasMostrar.push(i);
                }
            }

            // Agregar puntos suspensivos si es necesario
            let ultimaPagina = 0;
            paginasMostrar.forEach(pagina => {
                if (pagina > ultimaPagina + 1) {
                    html += `<span class="px-2 text-gray-500">...</span>`;
                }
                
                if (pagina === paginaActual) {
                    html += `<button class="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold">${pagina}</button>`;
                } else {
                    html += `<button onclick="cambiarPagina(${pagina})" 
                                    class="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                ${pagina}
                            </button>`;
                }
                ultimaPagina = pagina;
            });

            // Botón Siguiente
            if (paginaActual < totalPaginas) {
                html += `
                    <button onclick="cambiarPagina(${paginaActual + 1})" 
                            class="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
                        Siguiente<i class="fas fa-chevron-right text-xs"></i>
                    </button>`;
            }

            elementos.paginacion.innerHTML = html;
            elementos.paginacion.classList.remove('hidden');
        }

        // Event listeners
        elementos.busquedaInput.addEventListener('input', (e) => {
            filtros.busqueda = e.target.value;
            filtros.offset = 0;
            debounce(() => cargarLecciones(), 500)();
        });

        // Funciones globales
        window.limpiarBusqueda = function() {
            filtros.busqueda = '';
            filtros.offset = 0;
            elementos.busquedaInput.value = '';
            cargarLecciones();
        };

        window.cambiarPagina = function(pagina) {
            filtros.offset = (pagina - 1) * filtros.limit;
            cargarLecciones();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        window.iniciarLeccion = function(leccionId) {
            window.location.href = `/pages/estudiante/leccion-activa.html?id=${leccionId}`;
        };

        // Debounce helper
        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        // Inicializar
        await cargarLecciones();

        console.log('✅ Módulo de Lecciones listo');
    }

})();