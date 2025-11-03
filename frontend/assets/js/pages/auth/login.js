/* ============================================
   SPEAKLEXI - PÁGINA DE LOGIN
   Archivo: assets/js/pages/auth/login.js
   Usa: APP_CONFIG, apiClient, formValidator, toastManager
   ============================================ */

(() => {
    'use strict';

    // ============================================
    // 1. VERIFICACIÓN DE DEPENDENCIAS (CRÍTICO)
    // ============================================
    const requiredDependencies = [
        'APP_CONFIG',
        'apiClient', 
        'formValidator',
        'toastManager',
        'themeManager'
    ];

    for (const dep of requiredDependencies) {
        if (!window[dep]) {
            console.error(`❌ ${dep} no está cargado`);
            return;
        }
    }

    console.log('✅ Módulo Login inicializado');

    // ============================================
    // 2. CONFIGURACIÓN DESDE APP_CONFIG
    // ============================================
    const config = {
        API: window.APP_CONFIG.API,
        ENDPOINTS: window.APP_CONFIG.API.ENDPOINTS,
        STORAGE: window.APP_CONFIG.STORAGE.KEYS,
        VALIDATION: window.APP_CONFIG.VALIDATION,
        UI: window.APP_CONFIG.UI,
        ROLES: window.APP_CONFIG.ROLES
    };

    // ============================================
    // 3. ELEMENTOS DEL DOM
    // ============================================
    const elementos = {
        loginForm: document.getElementById('login-form'),
        emailInput: document.getElementById('email'),
        passwordInput: document.getElementById('password'),
        submitBtn: document.getElementById('submit-btn'),
        togglePassword: document.getElementById('toggle-password'),
        eyeIcon: document.getElementById('eye-icon'),
        errorAlert: document.getElementById('error-alert'),
        errorMessage: document.getElementById('error-message'),
        deactivatedAlert: document.getElementById('deactivated-alert'),
        deactivatedMessage: document.getElementById('deactivated-message'),
        reactivateBtn: document.getElementById('reactivate-btn'),
        toggleTestUsers: document.getElementById('toggle-test-users'),
        testUsersContainer: document.getElementById('test-users-container'),
        toggleIcon: document.getElementById('toggle-icon')
    };

    // ============================================
    // 4. ESTADO DE LA APLICACIÓN
    // ============================================
    const estado = {
        isLoading: false,
        userId: null,
        diasRestantes: 0,
        cuentaDesactivada: false
    };

    // ============================================
    // 5. USUARIOS DE PRUEBA
    // ============================================
    const TEST_USERS = [
        {
            name: "Estudiante Demo",
            email: "estudiante@speaklexi.com",
            password: "estudiante123",
            role: "estudiante",
            description: "Acceso completo al módulo de aprendizaje",
            color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
        },
        {
            name: "Profesor Demo",
            email: "profesor@speaklexi.com",
            password: "profesor123",
            role: "profesor",
            description: "Acceso a estadísticas y retroalimentación",
            color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
        },
        {
            name: "Admin Demo",
            email: "admin@speaklexi.com",
            password: "admin123",
            role: "admin",
            description: "Gestión de contenido y lecciones",
            color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
        },
        {
            name: "Mantenimiento Demo",
            email: "mantenimiento@speaklexi.com",
            password: "mantenimiento123",
            role: "mantenimiento",
            description: "Reportes y tareas programadas",
            color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
        }
    ];

    // ============================================
    // 6. FUNCIONES PRINCIPALES
    // ============================================

    /**
     * Inicializa el módulo
     */
    function init() {
        setupEventListeners();
        cargarUsuariosPrueba();
        
        if (window.APP_CONFIG.ENV.DEBUG) {
            console.log('🔧 Módulo Login listo:', { config, elementos });
        }
    }

    /**
     * Configura todos los event listeners
     */
    function setupEventListeners() {
        // Formulario principal
        elementos.loginForm?.addEventListener('submit', manejarLogin);
        
        // Toggle password visibility
        elementos.togglePassword?.addEventListener('click', togglePasswordVisibility);
        
        // Toggle test users
        elementos.toggleTestUsers?.addEventListener('click', toggleTestUsersVisibility);
        
        // Reactivar cuenta
        elementos.reactivateBtn?.addEventListener('click', manejarReactivacionCuenta);
    }

    /**
     * Maneja el proceso de login
     */
    async function manejarLogin(e) {
        e.preventDefault();
        
        if (estado.isLoading) return;
        
        const datos = obtenerDatosFormulario();
        const validacion = validarFormulario(datos);
        
        if (!validacion.esValido) {
            mostrarErrores(validacion.errores);
            return;
        }

        await iniciarSesion(datos);
    }

    /**
     * Obtiene datos del formulario
     */
    function obtenerDatosFormulario() {
        return {
            correo: elementos.emailInput.value.trim(),
            password: elementos.passwordInput.value
        };
    }

    /**
     * Valida el formulario completo
     */
    function validarFormulario(datos) {
        const errores = {};
        
        // Validar email
        if (!datos.correo) {
            errores.email = 'El correo electrónico es requerido';
        } else if (!window.formValidator.validateEmail(datos.correo)) {
            errores.email = 'Por favor ingresa un email válido';
        }
        
        // Validar contraseña
        if (!datos.password) {
            errores.password = 'La contraseña es requerida';
        } else if (datos.password.length < 8) {
            errores.password = 'La contraseña debe tener al menos 8 caracteres';
        }
        
        return {
            esValido: Object.keys(errores).length === 0,
            errores: errores
        };
    }

    /**
     * Inicia sesión en el sistema
     */
    async function iniciarSesion(datos) {
        try {
            estado.isLoading = true;
            mostrarLoading(true);
            limpiarErrores();

            // ✅ USAR apiClient CON ENDPOINTS DE APP_CONFIG
            const endpoint = config.ENDPOINTS.AUTH.LOGIN;
            const response = await window.apiClient.post(endpoint, datos);

            if (response.success) {
                await manejarLoginExitoso(response.data);
            } else {
                manejarErrorLogin(response);
            }

        } catch (error) {
            manejarError('Error de conexión', error);
        } finally {
            estado.isLoading = false;
            mostrarLoading(false);
        }
    }

    /**
     * Maneja login exitoso
     */
    async function manejarLoginExitoso(data) {
        const usuario = data.usuario;
        const token = data.token;

        if (!usuario || !token) {
            throw new Error('Respuesta inválida del servidor');
        }

        // ✅ GUARDAR EN STORAGE USANDO APP_CONFIG
        const { USUARIO, TOKEN } = config.STORAGE;
        localStorage.setItem(TOKEN, token);
        localStorage.setItem(USUARIO, JSON.stringify(usuario));

        window.toastManager.success(`¡Bienvenido ${usuario.nombre}!`);

        // ✅ REDIRIGIR SEGÚN ROL USANDO APP_CONFIG
        const rol = usuario.rol?.toLowerCase();
        const dashboardUrl = config.ROLES.RUTAS_DASHBOARD[rol] || config.UI.RUTAS.DASHBOARD_ESTUDIANTE;

        setTimeout(() => {
            window.location.href = dashboardUrl;
        }, 1000);
    }

    /**
     * Maneja errores de login
     */
    function manejarErrorLogin(response) {
        if (response.codigo === 'CUENTA_DESACTIVADA') {
            estado.userId = response.usuario_id?.toString() || null;
            estado.diasRestantes = response.dias_restantes || 0;
            
            elementos.deactivatedMessage.textContent = estado.diasRestantes > 0 
                ? `Tienes ${estado.diasRestantes} días para reactivarla.`
                : 'El período de recuperación ha expirado.';
            
            elementos.deactivatedAlert.classList.remove('hidden');
            
            if (estado.diasRestantes <= 0) {
                elementos.reactivateBtn.classList.add('hidden');
            }
            
        } else if (response.codigo === 'CUENTA_ELIMINADA') {
            mostrarError('Esta cuenta ha sido eliminada permanentemente.');
        } else if (response.codigo === 'EMAIL_NOT_VERIFIED') {
            window.toastManager.error('Email no verificado. Revisa tu correo.');
            setTimeout(() => {
                window.location.href = `verificar-email.html?email=${encodeURIComponent(elementos.emailInput.value)}`;
            }, 1500);
        } else {
            mostrarError(response.error || 'Error en el servidor');
        }
    }

    /**
     * Maneja errores inesperados
     */
    function manejarError(mensaje, error) {
        console.error('💥 Error:', error);
        
        if (window.APP_CONFIG.ENV.DEBUG) {
            console.trace();
        }
        
        let errorMsg = mensaje;
        if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
            errorMsg = 'No se pudo conectar al servidor. Verifica tu conexión.';
        }
        
        mostrarError(errorMsg);
    }

    // ============================================
    // 7. FUNCIONES DE UI/UX
    // ============================================

    function mostrarLoading(mostrar) {
        elementos.submitBtn.disabled = mostrar;
        
        if (mostrar) {
            elementos.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Iniciando sesión...';
        } else {
            elementos.submitBtn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Iniciar Sesión';
        }
    }

    function mostrarError(mensaje) {
        elementos.errorMessage.textContent = mensaje;
        elementos.errorAlert.classList.remove('hidden');
        elementos.deactivatedAlert.classList.add('hidden');
    }

    function mostrarErrores(errores) {
        limpiarErrores();
        
        Object.entries(errores).forEach(([campo, mensaje]) => {
            const input = document.getElementById(campo);
            if (input) {
                input.classList.add('border-red-500');
                // Podrías agregar elementos de error específicos por campo
            }
        });
        
        // Mostrar primer error
        const primerError = Object.values(errores)[0];
        if (primerError) {
            mostrarError(primerError);
        }
    }

    function limpiarErrores() {
        elementos.errorAlert.classList.add('hidden');
        elementos.deactivatedAlert.classList.add('hidden');
        
        // Limpiar estilos de error en inputs
        elementos.emailInput?.classList.remove('border-red-500');
        elementos.passwordInput?.classList.remove('border-red-500');
    }

    function togglePasswordVisibility() {
        const type = elementos.passwordInput.type === 'password' ? 'text' : 'password';
        elementos.passwordInput.type = type;
        elementos.eyeIcon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    }

    function toggleTestUsersVisibility() {
        elementos.testUsersContainer.classList.toggle('hidden');
        elementos.toggleIcon.className = elementos.testUsersContainer.classList.contains('hidden') 
            ? 'fas fa-chevron-down text-gray-500' 
            : 'fas fa-chevron-up text-gray-500';
    }

    // ============================================
    // 8. FUNCIONES ESPECÍFICAS DEL MÓDULO
    // ============================================
    
    function cargarUsuariosPrueba() {
        if (!elementos.testUsersContainer) return;
        
        elementos.testUsersContainer.innerHTML = TEST_USERS.map(user => `
            <button type="button" data-email="${user.email}" data-password="${user.password}" class="test-user-btn w-full text-left p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-md">
                <div class="flex items-start justify-between gap-3">
                    <div class="flex-1 min-w-0">
                        <p class="font-medium text-sm text-gray-900 dark:text-white">${user.name}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">${user.email}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">${user.description}</p>
                    </div>
                    <span class="text-xs font-medium px-3 py-1 rounded-full ${user.color} whitespace-nowrap">
                        ${user.role}
                    </span>
                </div>
            </button>
        `).join('');

        // Agregar event listeners a botones de usuarios de prueba
        document.querySelectorAll('.test-user-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const button = e.currentTarget;
                elementos.emailInput.value = button.dataset.email;
                elementos.passwordInput.value = button.dataset.password;
                elementos.testUsersContainer.classList.add('hidden');
                elementos.toggleIcon.className = 'fas fa-chevron-down text-gray-500';
                limpiarErrores();
                window.toastManager.success(`Credenciales cargadas - ${button.querySelector('p').textContent}`);
            });
        });
    }

    async function manejarReactivacionCuenta() {
        if (!estado.userId) {
            window.toastManager.error('No se pudo identificar el usuario');
            return;
        }

        elementos.reactivateBtn.disabled = true;
        elementos.reactivateBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Reactivando...';

        try {
            const response = await window.apiClient.post(`/usuario/reactivar/${estado.userId}`, {
                password: elementos.passwordInput.value
            });

            if (response.success) {
                window.toastManager.success('¡Cuenta reactivada exitosamente!');
                limpiarErrores();
                setTimeout(() => elementos.loginForm.requestSubmit(), 1000);
            } else {
                throw new Error(response.error || 'Error al reactivar la cuenta');
            }

        } catch (error) {
            window.toastManager.error(error.message);
        } finally {
            elementos.reactivateBtn.disabled = false;
            elementos.reactivateBtn.innerHTML = '<i class="fas fa-refresh mr-2"></i>Reactivar mi cuenta';
        }
    }

    // ============================================
    // 9. INICIALIZACIÓN
    // ============================================
    
    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM ya está listo
        setTimeout(init, 100);
    }

})();