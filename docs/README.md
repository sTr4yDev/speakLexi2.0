/* ============================================
   SPEAKLEXI - [NOMBRE DEL MÓDULO]
   Archivo: assets/js/pages/[ruta]/[nombre].js
   Usa: APP_CONFIG, apiClient, formValidator, toastManager
   ============================================ */

(async () => {
    'use strict';

    // ============================================
    // 1. ESPERAR DEPENDENCIAS (SIEMPRE PRIMERO)
    // ============================================
    const dependencias = [
        'APP_CONFIG',
        'apiClient',
        'formValidator',
        'toastManager',
        'ModuleLoader'
        // Agregar otras dependencias si son necesarias:
        // 'Utils', 'themeManager', etc.
    ];

    const inicializado = await window.ModuleLoader.initModule({
        moduleName: '[NOMBRE_MÓDULO]', // ej: 'Dashboard Estudiante'
        dependencies: dependencias,
        onReady: inicializarModulo,
        onError: (error) => {
            console.error('💥 Error al cargar módulo:', error);
            window.ModuleLoader.showModuleError(
                'Error al cargar el módulo. Por favor recarga la página.'
            );
        }
    });

    if (!inicializado) return;

    // ============================================
    // 2. FUNCIÓN PRINCIPAL DE INICIALIZACIÓN
    // ============================================
    async function inicializarModulo() {
        console.log('✅ Módulo [NOMBRE] listo');

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
            // Agregar tus elementos aquí
            form: document.getElementById('mi-form'),
            submitBtn: document.getElementById('submit-btn'),
            // etc...
        };

        // ===================================
        // ESTADO DE LA APLICACIÓN
        // ===================================
        const estado = {
            isLoading: false,
            // Agregar propiedades de estado aquí
        };

        // ===================================
        // FUNCIONES AUXILIARES
        // ===================================
        
        function mostrarError(mensaje) {
            const errorAlert = document.getElementById('error-alert');
            const errorMessage = document.getElementById('error-message');
            
            if (errorAlert && errorMessage) {
                errorMessage.textContent = mensaje;
                errorAlert.classList.remove('hidden');
            }
        }

        function ocultarError() {
            const errorAlert = document.getElementById('error-alert');
            errorAlert?.classList.add('hidden');
        }

        // ===================================
        // EVENT LISTENERS
        // ===================================
        
        elementos.form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Tu lógica aquí
            console.log('Formulario enviado');
        });

        // ===================================
        // INICIALIZACIÓN DEL MÓDULO
        // ===================================
        
        // Ejecutar funciones de inicialización
        // cargarDatos();
        // configurarListeners();
        // etc...

        // Log de debug si está habilitado
        if (window.APP_CONFIG.ENV.DEBUG) {
            console.log('🔧 Módulo configurado:', { config, elementos, estado });
        }
    }

})();