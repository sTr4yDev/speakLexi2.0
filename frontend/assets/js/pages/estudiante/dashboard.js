/* ============================================
   SPEAKLEXI - DASHBOARD ESTUDIANTE UNIFICADO
   Archivo: assets/js/pages/estudiante/dashboard.js
   Combina: Sistema de Cursos Dinámico + ModuleLoader
   ============================================ */

(async () => {
    'use strict';

    // ============================================
    // 1. ESPERAR DEPENDENCIAS CON MODULE LOADER
    // ============================================
    const dependencias = [
        'APP_CONFIG',
        'apiClient', 
        'formValidator',
        'toastManager',
        'Utils',
        'ModuleLoader'
    ];

    const inicializado = await window.ModuleLoader.initModule({
        moduleName: 'Dashboard Estudiante Mejorado',
        dependencies: dependencias,
        onReady: inicializarModulo,
        onError: (error) => {
            console.error('💥 Error al cargar dashboard:', error);
            window.ModuleLoader.showModuleError(
                'Error al cargar el dashboard. Por favor recarga la página.'
            );
        }
    });

    if (!inicializado) return;

    // ============================================
    // 2. FUNCIÓN PRINCIPAL DE INICIALIZACIÓN
    // ============================================
    async function inicializarModulo() {
        console.log('✅ Dashboard Estudiante Mejorado inicializado');

        // ============================================
        // 3. CONFIGURACIÓN UNIFICADA
        // ============================================
        const config = {
            API: window.APP_CONFIG.API,
            ENDPOINTS: {
                ...window.APP_CONFIG.API.ENDPOINTS,
                CURSOS: '/api/cursos',
                MIS_CURSOS: '/api/estudiante/mis-cursos',
                INSCRIBIR_CURSO: (id) => `/api/cursos/${id}/inscribir`,
                LECCIONES_CURSO: (id) => `/api/cursos/${id}/lecciones`,
                SIGUIENTE_LECCION: (id) => `/api/cursos/${id}/siguiente-leccion`,
                PROGRESO_CURSO: (id) => `/api/cursos/${id}/progreso`
            },
            STORAGE: window.APP_CONFIG.STORAGE.KEYS,
            VALIDATION: window.APP_CONFIG.VALIDATION,
            UI: window.APP_CONFIG.UI,
            ROLES: window.APP_CONFIG.ROLES
        };

        // ============================================
        // 4. ELEMENTOS DEL DOM UNIFICADOS
        // ============================================
        const elementos = {
            greeting: document.getElementById('greeting'),
            diasRacha: document.getElementById('dias-racha'),
            totalXp: document.getElementById('total-xp'),
            leccionesCompletadas: document.getElementById('lecciones-completadas'),
            nivelUsuario: document.getElementById('nivel-usuario'),
            nivelActual: document.getElementById('nivel-actual'),
            idiomaAprendizaje: document.getElementById('idioma-aprendizaje'),
            metaDiaria: document.getElementById('meta-diaria'),
            leaderboardAvatar: document.getElementById('leaderboard-avatar'),
            leaderboardXp: document.getElementById('leaderboard-xp'),
            // Nuevos elementos para cursos
            cursosContainer: document.querySelector('.xl\\:col-span-2'),
            leccionesRecientes: null // Se buscará dinámicamente
        };

        // ============================================
        // 5. ESTADO DE LA APLICACIÓN MEJORADO
        // ============================================
        const estado = {
            usuario: null,
            token: null,
            datosPerfil: null,
            misCursos: [],
            cursoActual: null,
            leccionActual: null,
            isLoading: false,
            animacionesActivadas: false
        };

        // ============================================
        // 6. INICIALIZACIÓN PRINCIPAL
        // ============================================
        function inicializar() {
            if (!verificarAutenticacion()) {
                return;
            }

            configurarEventListeners();
            configurarAnimacionesScroll();
            cargarDatosCompletos();

            if (window.APP_CONFIG.ENV.DEBUG) {
                console.log('🔧 Dashboard configurado:', { config, estado, elementos });
            }
        }

        // ============================================
        // 7. VERIFICACIÓN DE AUTENTICACIÓN
        // ============================================
        function verificarAutenticacion() {
            estado.usuario = window.Utils.getFromStorage(config.STORAGE.USUARIO);
            estado.token = window.Utils.getFromStorage(config.STORAGE.TOKEN);

            if (!estado.usuario || !estado.token) {
                window.toastManager.error('Debes iniciar sesión para acceder al dashboard');
                setTimeout(() => {
                    window.location.href = config.UI.RUTAS.LOGIN;
                }, 1500);
                return false;
            }

            const rol = estado.usuario.rol?.toLowerCase();
            const rolesPermitidos = ['alumno', 'estudiante', 'student'];
            
            if (!rolesPermitidos.includes(rol)) {
                window.toastManager.error('No tienes permisos para acceder a esta página');
                setTimeout(() => {
                    window.location.href = config.UI.RUTAS.LOGIN;
                }, 1500);
                return false;
            }

            return true;
        }

        // ============================================
        // 8. CARGA DE DATOS COMPLETOS
        // ============================================
        async function cargarDatosCompletos() {
            if (estado.isLoading) return;
            estado.isLoading = true;

            try {
                mostrarCargando();

                // Cargar datos en paralelo para mejor rendimiento
                const [perfilResponse, cursosResponse, estadisticasResponse] = await Promise.allSettled([
                    cargarPerfilEstudiante(),
                    cargarMisCursos(),
                    window.apiClient.get(config.ENDPOINTS.ESTUDIANTE?.ESTADISTICAS)
                ]);

                // Manejar respuestas
                if (perfilResponse.status === 'fulfilled' && perfilResponse.value) {
                    // Datos de perfil cargados correctamente
                }

                if (cursosResponse.status === 'fulfilled' && cursosResponse.value) {
                    // Cursos cargados correctamente
                }

                if (estadisticasResponse.status === 'fulfilled' && estadisticasResponse.value.success) {
                    // Combinar estadísticas con datos de perfil
                    if (estado.datosPerfil) {
                        estado.datosPerfil.estadisticas = estadisticasResponse.value.data;
                    }
                }

                // Verificar si tenemos datos suficientes
                if ((perfilResponse.status === 'fulfilled' && perfilResponse.value) || 
                    (cursosResponse.status === 'fulfilled' && cursosResponse.value)) {
                    actualizarUI();
                    await cargarLeccionesRecientes();
                    
                    window.toastManager.success(`¡Bienvenido de nuevo, ${estado.usuario.nombre}!`);
                } else {
                    throw new Error('No se pudieron cargar los datos necesarios');
                }

            } catch (error) {
                console.error('💥 Error cargando datos:', error);
                window.toastManager.error('Error al cargar el dashboard');
                usarDatosEjemplo();
            } finally {
                estado.isLoading = false;
                ocultarCargando();
            }
        }

        async function cargarPerfilEstudiante() {
            try {
                const response = await window.apiClient.get(config.ENDPOINTS.USUARIOS.PERFIL);
                if (response.success) {
                    estado.datosPerfil = response.data;
                    return true;
                }
                return false;
            } catch (error) {
                console.error('Error cargando perfil:', error);
                return false;
            }
        }

        async function cargarMisCursos() {
            try {
                const response = await window.apiClient.get(config.ENDPOINTS.MIS_CURSOS);
                if (response.success) {
                    estado.misCursos = response.data;
                    // Determinar curso actual (el más reciente con actividad)
                    if (estado.misCursos.length > 0) {
                        estado.cursoActual = estado.misCursos.find(curso => curso.progreso_general > 0) || estado.misCursos[0];
                    }
                    return true;
                }
                return false;
            } catch (error) {
                console.error('Error cargando cursos:', error);
                return false;
            }
        }

        async function cargarLeccionesRecientes() {
            if (!estado.cursoActual) return;

            try {
                const response = await window.apiClient.get(
                    config.ENDPOINTS.LECCIONES_CURSO(estado.cursoActual.curso_id)
                );
                
                if (response.success) {
                    mostrarLeccionesEnUI(response.data);
                }
            } catch (error) {
                console.error('Error cargando lecciones:', error);
            }
        }

        // ============================================
        // 9. ACTUALIZACIÓN DE UI MEJORADA
        // ============================================
        function actualizarUI() {
            if (!estado.datosPerfil && !estado.cursoActual) return;

            const perfil = estado.datosPerfil?.perfil || estado.datosPerfil || {};
            const estadisticas = estado.datosPerfil?.estadisticas || {};

            // Saludo personalizado
            if (elementos.greeting) {
                elementos.greeting.textContent = `¡Bienvenido, ${perfil.nombre || estado.usuario.nombre}!`;
            }

            // Avatar
            const nombreCompleto = `${perfil.nombre || estado.usuario.nombre || 'Usuario'} ${perfil.primer_apellido || ''}`;
            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreCompleto)}&background=6366f1&color=fff`;
            if (elementos.leaderboardAvatar) {
                elementos.leaderboardAvatar.src = avatarUrl;
            }

            // Estadísticas combinadas (backend + cursos)
            if (elementos.diasRacha) {
                elementos.diasRacha.textContent = estadisticas.dias_racha || calcularRacha();
            }
            
            if (elementos.leccionesCompletadas) {
                const leccionesBackend = estadisticas.lecciones_completadas;
                const leccionesCursos = estado.misCursos.reduce((sum, curso) => 
                    sum + (curso.lecciones_completadas || 0), 0
                );
                elementos.leccionesCompletadas.textContent = leccionesBackend || leccionesCursos || 0;
            }

            if (elementos.totalXp) {
                const xpBackend = estadisticas.total_xp;
                const xpCursos = estado.misCursos.reduce((sum, curso) => 
                    sum + ((curso.lecciones_completadas || 0) * 50), 0
                );
                const totalXp = xpBackend || xpCursos;
                elementos.totalXp.textContent = totalXp;
                if (elementos.leaderboardXp) {
                    elementos.leaderboardXp.textContent = `${totalXp} XP`;
                }
            }

            if (elementos.nivelUsuario) {
                elementos.nivelUsuario.textContent = estadisticas.nivel_usuario || 1;
            }

            if (elementos.nivelActual) {
                elementos.nivelActual.textContent = `${perfil.nivel_actual || 'A1'} - ${perfil.idioma_aprendizaje || 'Inglés'}`;
            }

            if (elementos.idiomaAprendizaje) {
                elementos.idiomaAprendizaje.textContent = perfil.idioma_aprendizaje || 'Inglés';
            }

            if (elementos.metaDiaria) {
                elementos.metaDiaria.textContent = `${estadisticas.meta_diaria || 30} min`;
            }

            // Actualizar tarjeta de continuar aprendizaje
            actualizarTarjetaContinuar();
        }

        function actualizarTarjetaContinuar() {
            if (!estado.cursoActual) return;

            const progreso = estado.cursoActual.progreso_general || 0;
            const nombreCurso = estado.cursoActual.curso_nombre || 'Curso actual';
            
            const continuarCard = document.querySelector('.bg-gradient-to-br.from-purple-600');
            if (continuarCard) {
                const cursoNombreEl = continuarCard.querySelector('#idioma-aprendizaje');
                const progresoBar = continuarCard.querySelector('.bg-white\\/20 .bg-white');
                const progresoTexto = continuarCard.querySelector('.flex.justify-between.text-sm span:last-child');
                
                if (cursoNombreEl) cursoNombreEl.textContent = nombreCurso;
                if (progresoBar) progresoBar.style.width = `${progreso}%`;
                if (progresoTexto) progresoTexto.textContent = `${progreso}%`;
            }
        }

        function mostrarLeccionesEnUI(lecciones) {
            const container = document.querySelector('.bg-white.dark\\:bg-gray-800.rounded-2xl.shadow-lg.p-6:has(h3:contains("Lecciones Recientes"))') 
                || document.querySelector('.xl\\:col-span-2 > div:last-child');
            
            if (!container) return;

            const leccionesHTML = lecciones.slice(0, 5).map((leccion, index) => {
                const completada = leccion.completada || false;
                const progreso = leccion.progreso || 0;
                
                if (completada) {
                    return `
                        <div class="flex items-center gap-4 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 hover:shadow-md transition-all cursor-pointer group" data-leccion-id="${leccion.id}">
                            <div class="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <i class="fas fa-check text-green-600 dark:text-green-400 text-lg"></i>
                            </div>
                            <div class="flex-1">
                                <p class="font-semibold text-gray-900 dark:text-white">${leccion.titulo}</p>
                                <p class="text-sm text-gray-600 dark:text-gray-400">Completado - ${leccion.duracion_minutos || 30} min</p>
                            </div>
                            <div class="text-right">
                                <span class="text-2xl">✅</span>
                            </div>
                        </div>
                    `;
                } else if (progreso > 0) {
                    return `
                        <div class="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all cursor-pointer group" data-leccion-id="${leccion.id}">
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
                    return `
                        <div class="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all cursor-pointer group" data-leccion-id="${leccion.id}">
                            <div class="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                                <i class="fas fa-lock text-gray-400 dark:text-gray-500 text-lg"></i>
                            </div>
                            <div class="flex-1">
                                <p class="font-semibold text-gray-400 dark:text-gray-500">${leccion.titulo}</p>
                                <p class="text-sm text-gray-400 dark:text-gray-500">${leccion.duracion_minutos || 30} minutos</p>
                            </div>
                            <span class="text-2xl opacity-50">🔒</span>
                        </div>
                    `;
                }
            }).join('');

            const leccionesContainer = container.querySelector('.space-y-4');
            if (leccionesContainer) {
                leccionesContainer.innerHTML = leccionesHTML;
            }
        }

        // ============================================
        // 10. EVENT LISTENERS MEJORADOS
        // ============================================
        function configurarEventListeners() {
            // Logout
            document.addEventListener('click', (e) => {
                if (e.target.closest('#logout-btn')) {
                    manejarLogout();
                }

                // Continuar con siguiente lección
                if (e.target.closest('button') && e.target.closest('button').textContent.includes('Continuar Lección')) {
                    continuarConSiguienteLeccion();
                }

                // Click en lección
                const leccionCard = e.target.closest('[data-leccion-id]');
                if (leccionCard) {
                    const leccionId = leccionCard.dataset.leccionId;
                    abrirLeccion(leccionId);
                }
            });

            // Recargar datos al volver a la página
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden && estado.usuario) {
                    setTimeout(() => cargarDatosCompletos(), 1000);
                }
            });
        }

        async function continuarConSiguienteLeccion() {
            if (!estado.cursoActual) {
                window.toastManager.warning('No hay curso activo');
                return;
            }

            try {
                const response = await window.apiClient.get(
                    config.ENDPOINTS.SIGUIENTE_LECCION(estado.cursoActual.curso_id)
                );

                if (response.success && response.data) {
                    abrirLeccion(response.data.id);
                } else {
                    window.toastManager.info('¡Has completado todas las lecciones!');
                }
            } catch (error) {
                console.error('Error obteniendo siguiente lección:', error);
                window.toastManager.error('Error al cargar la siguiente lección');
            }
        }

        function abrirLeccion(leccionId) {
            window.toastManager.info('Abriendo lección...');
            // Aquí iría la navegación a la página de la lección
            console.log('Abrir lección:', leccionId);
            // setTimeout(() => {
            //     window.location.href = `/pages/estudiante/leccion-activa.html?id=${leccionId}`;
            // }, 500);
        }

        function manejarLogout() {
            window.Utils.removeFromStorage(config.STORAGE.USUARIO);
            window.Utils.removeFromStorage(config.STORAGE.TOKEN);
            window.toastManager.success('Sesión cerrada correctamente');
            setTimeout(() => {
                window.location.href = config.UI.RUTAS.LOGIN;
            }, 1000);
        }

        // ============================================
        // 11. ANIMACIONES Y EFECTOS VISUALES
        // ============================================
        function configurarAnimacionesScroll() {
            if (estado.animacionesActivadas) return;
            
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

            // Observar elementos para animación
            document.querySelectorAll('.bg-white, .bg-gradient-to-br, .bg-gray-50').forEach(el => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
                el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                observer.observe(el);
            });

            estado.animacionesActivadas = true;
        }

        // ============================================
        // 12. FUNCIONES AUXILIARES
        // ============================================
        function calcularRacha() {
            // Lógica simple - en producción vendría del backend
            return Math.floor(Math.random() * 15) + 1;
        }

        function usarDatosEjemplo() {
            estado.datosPerfil = {
                perfil: {
                    nombre: estado.usuario?.nombre || 'Usuario',
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
            
            estado.misCursos = [{
                curso_id: 1,
                curso_nombre: 'Fundamentos del Inglés',
                nivel: 'A1',
                progreso_general: 35,
                lecciones_completadas: 5,
                total_lecciones_curso: 10
            }];
            
            estado.cursoActual = estado.misCursos[0];
            actualizarUI();
            
            window.toastManager.warning('Usando datos de demostración');
        }

        function mostrarCargando() {
            // Podrías agregar un spinner global aquí
            document.body.style.cursor = 'wait';
        }

        function ocultarCargando() {
            document.body.style.cursor = 'default';
        }

        // ============================================
        // 13. INICIALIZAR
        // ============================================
        inicializar();
    }

})();