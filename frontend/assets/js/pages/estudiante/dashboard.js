/* ============================================
   SPEAKLEXI - DASHBOARD ESTUDIANTE
   Archivo: assets/js/pages/estudiante/dashboard.js
   Usa: APP_CONFIG, apiClient, formValidator, toastManager, Utils
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
        moduleName: 'Dashboard Estudiante',
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
        console.log('✅ Dashboard estudiante listo');

        // ===================================
        // CONFIGURACIÓN DESDE APP_CONFIG
        // ===================================
        const config = {
            API: window.APP_CONFIG.API,
            ENDPOINTS: window.APP_CONFIG.API.ENDPOINTS,
            STORAGE: window.APP_CONFIG.STORAGE.KEYS,
            VALIDATION: window.APP_CONFIG.VALIDATION,
            UI: window.APP_CONFIG.UI,
            ROLES: window.APP_CONFIG.ROLES
        };

        // ===================================
        // ELEMENTOS DEL DOM
        // ===================================
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
            leaderboardXp: document.getElementById('leaderboard-xp')
        };

        // ===================================
        // ESTADO DE LA APLICACIÓN
        // ===================================
        const estado = {
            usuario: null,
            token: null,
            datosPerfil: null,
            isLoading: false
        };

        // ===================================
        // FUNCIONES AUXILIARES
        // ===================================
        
        function mostrarCargando(mostrar = true) {
            estado.isLoading = mostrar;
            // Aquí podrías agregar un spinner global si es necesario
        }

        // ===================================
        // FUNCIONES PRINCIPALES
        // ===================================

        /**
         * Verifica la autenticación del usuario
         */
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

            // Verificar rol
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

        /**
         * Configura todos los event listeners
         */
        function configurarEventListeners() {
            // Logout
            document.addEventListener('click', (e) => {
                if (e.target.closest('#logout-btn')) {
                    manejarLogout();
                }
            });

            // Continuar lección
            document.addEventListener('click', (e) => {
                if (e.target.closest('button') && e.target.closest('button').textContent.includes('Continuar Lección')) {
                    continuarLeccion();
                }
            });

            // Setup Intersection Observer para animaciones
            configurarAnimacionesScroll();
        }

        /**
         * Carga los datos del usuario y del dashboard
         */
        async function cargarDatosUsuario() {
            if (estado.isLoading) return;

            mostrarCargando(true);

            try {
                // ✅ USAR apiClient PARA CARGAR DATOS
                const [perfilResponse, estadisticasResponse] = await Promise.all([
                    window.apiClient.get(config.ENDPOINTS.USUARIOS.PERFIL),
                    window.apiClient.get(config.ENDPOINTS.ESTUDIANTE.ESTADISTICAS)
                ]);

                if (perfilResponse.success && estadisticasResponse.success) {
                    estado.datosPerfil = {
                        ...perfilResponse.data,
                        ...estadisticasResponse.data
                    };
                    actualizarUI();
                } else {
                    throw new Error('Error al cargar datos del dashboard');
                }

            } catch (error) {
                console.error('💥 Error al cargar datos:', error);
                
                // Usar datos de ejemplo como fallback
                estado.datosPerfil = obtenerDatosEjemplo();
                actualizarUI();
                
                if (error.message.includes('Failed to fetch')) {
                    window.toastManager.warning('Usando datos de demostración. El servidor no está disponible.');
                } else {
                    window.toastManager.error('Error al cargar datos del dashboard');
                }
            } finally {
                mostrarCargando(false);
            }
        }

        /**
         * Obtiene datos de ejemplo para demostración
         */
        function obtenerDatosEjemplo() {
            return {
                perfil: {
                    nombre: estado.usuario?.nombre || 'Usuario',
                    correo: estado.usuario?.correo || 'usuario@example.com',
                    idioma_aprendizaje: 'Inglés',
                    nivel_actual: 'A1'
                },
                estadisticas: {
                    dias_racha: 7,
                    total_xp: 1850,
                    lecciones_completadas: 12,
                    nivel_usuario: 4,
                    meta_diaria: 30,
                    progreso_semanal: [40, 60, 80, 70, 90, 50, 30]
                }
            };
        }

        /**
         * Actualiza la interfaz con los datos del usuario
         */
        function actualizarUI() {
            if (!estado.datosPerfil) return;

            const { perfil, estadisticas } = estado.datosPerfil;

            // Saludo personalizado
            if (elementos.greeting) {
                elementos.greeting.textContent = `¡Bienvenido, ${perfil.nombre || 'Usuario'}!`;
            }

            // Avatar
            const nombreCompleto = `${perfil.nombre || 'Usuario'} ${perfil.primer_apellido || ''}`;
            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreCompleto)}&background=6366f1&color=fff`;
            if (elementos.leaderboardAvatar) {
                elementos.leaderboardAvatar.src = avatarUrl;
            }

            // Estadísticas
            if (estadisticas) {
                if (elementos.diasRacha) elementos.diasRacha.textContent = estadisticas.dias_racha || 0;
                if (elementos.totalXp) elementos.totalXp.textContent = estadisticas.total_xp || 0;
                if (elementos.leccionesCompletadas) elementos.leccionesCompletadas.textContent = estadisticas.lecciones_completadas || 0;
                if (elementos.nivelUsuario) elementos.nivelUsuario.textContent = estadisticas.nivel_usuario || 1;
                if (elementos.nivelActual) elementos.nivelActual.textContent = `${perfil.nivel_actual || 'A1'} - ${perfil.idioma_aprendizaje || 'Inglés'}`;
                if (elementos.idiomaAprendizaje) elementos.idiomaAprendizaje.textContent = perfil.idioma_aprendizaje || 'Inglés';
                if (elementos.metaDiaria) elementos.metaDiaria.textContent = `${estadisticas.meta_diaria || 30} min`;
                if (elementos.leaderboardXp) elementos.leaderboardXp.textContent = `${estadisticas.total_xp || 0} XP`;
            }

            // Mostrar toast de bienvenida
            setTimeout(() => {
                window.toastManager.success(`¡Bienvenido de nuevo, ${perfil.nombre || 'Usuario'}!`);
            }, 1000);
        }

        /**
         * Maneja el cierre de sesión
         */
        function manejarLogout() {
            // Limpiar almacenamiento
            window.Utils.removeFromStorage(config.STORAGE.USUARIO);
            window.Utils.removeFromStorage(config.STORAGE.TOKEN);
            
            window.toastManager.success('Sesión cerrada correctamente');
            
            setTimeout(() => {
                window.location.href = config.UI.RUTAS.LOGIN;
            }, 1000);
        }

        /**
         * Maneja la acción de continuar lección
         */
        function continuarLeccion() {
            window.toastManager.info('Redirigiendo a la siguiente lección...');
            
            // Simular redirección (en producción esto iría a la lección actual)
            setTimeout(() => {
                // Aquí iría la lógica para determinar la siguiente lección
                console.log('Continuando con la siguiente lección...');
            }, 1000);
        }

        /**
         * Configura animaciones al hacer scroll
         */
        function configurarAnimacionesScroll() {
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
            document.querySelectorAll('.bg-white, .bg-gradient-to-br').forEach(el => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
                el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                observer.observe(el);
            });
        }

        // ===================================
        // INICIALIZACIÓN
        // ===================================
        
        function inicializar() {
            if (!verificarAutenticacion()) {
                return;
            }

            configurarEventListeners();
            cargarDatosUsuario();

            if (window.APP_CONFIG.ENV.DEBUG) {
                console.log('🔧 Dashboard configurado:', { config, estado, elementos });
            }
        }

        // Ejecutar inicialización
        inicializar();
    }

})();