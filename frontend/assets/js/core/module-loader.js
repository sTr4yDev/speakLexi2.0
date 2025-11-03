/* ============================================
   SPEAKLEXI - MODULE LOADER
   Archivo: assets/js/core/module-loader.js
   Descripción: Helper para esperar carga de dependencias
   ============================================ */

(function() {
    'use strict';

    /**
     * Espera a que todas las dependencias estén cargadas
     * @param {string[]} dependencies - Array de nombres de dependencias (ej: ['APP_CONFIG', 'apiClient'])
     * @param {number} maxWaitMs - Tiempo máximo de espera en milisegundos
     * @returns {Promise<boolean>} - true si se cargaron todas, false si timeout
     */
    async function waitForDependencies(dependencies = [], maxWaitMs = 5000) {
        const startTime = Date.now();
        const checkInterval = 50; // Revisar cada 50ms
        
        while (Date.now() - startTime < maxWaitMs) {
            const allLoaded = dependencies.every(dep => window[dep]);
            
            if (allLoaded) {
                console.log(`✅ Dependencias cargadas: ${dependencies.join(', ')}`);
                return true;
            }
            
            // Esperar antes de revisar de nuevo
            await new Promise(resolve => setTimeout(resolve, checkInterval));
        }
        
        // Timeout: mostrar qué falta
        const missing = dependencies.filter(dep => !window[dep]);
        console.error(`❌ Timeout (${maxWaitMs}ms) esperando dependencias. Faltan: ${missing.join(', ')}`);
        console.error('💡 Posibles causas:');
        console.error('   - Los archivos no existen en /assets/js/core/');
        console.error('   - Los scripts no están cargados en el HTML');
        console.error('   - Los scripts tienen errores de sintaxis');
        
        return false;
    }

    /**
     * Verifica el estado de las dependencias
     * @param {string[]} dependencies - Array de nombres de dependencias
     * @returns {Object} - { allLoaded: boolean, loaded: string[], missing: string[] }
     */
    function checkDependencies(dependencies = []) {
        const loaded = dependencies.filter(dep => window[dep]);
        const missing = dependencies.filter(dep => !window[dep]);
        const allLoaded = missing.length === 0;
        
        return { allLoaded, loaded, missing };
    }

    /**
     * Inicializa un módulo de página esperando sus dependencias
     * @param {Object} config - Configuración del módulo
     * @param {string} config.moduleName - Nombre del módulo (para logs)
     * @param {string[]} config.dependencies - Array de dependencias requeridas
     * @param {Function} config.onReady - Función a ejecutar cuando todo esté listo
     * @param {Function} [config.onError] - Función a ejecutar si hay error
     * @param {number} [config.maxWait] - Tiempo máximo de espera (default: 5000ms)
     */
    async function initModule(config) {
        const {
            moduleName = 'Módulo',
            dependencies = [],
            onReady,
            onError,
            maxWait = 5000
        } = config;

        console.log(`🚀 Iniciando ${moduleName}...`);

        // 1. Esperar a que se carguen las dependencias
        const loaded = await waitForDependencies(dependencies, maxWait);

        if (!loaded) {
            console.error(`❌ ${moduleName}: No se pudieron cargar todas las dependencias`);
            
            // Llamar callback de error si existe
            if (onError && typeof onError === 'function') {
                onError(new Error(`Dependencias no cargadas: ${dependencies.join(', ')}`));
            }
            
            return false;
        }

        // 2. Ejecutar función de inicialización
        try {
            console.log(`✅ ${moduleName} inicializado correctamente`);
            
            if (onReady && typeof onReady === 'function') {
                await onReady();
            }
            
            return true;
        } catch (error) {
            console.error(`❌ Error al inicializar ${moduleName}:`, error);
            
            if (onError && typeof onError === 'function') {
                onError(error);
            }
            
            return false;
        }
    }

    /**
     * Helper para mostrar un error en la UI
     * @param {string} message - Mensaje de error
     * @param {string} [containerId] - ID del contenedor de error (default: 'error-alert')
     */
    function showModuleError(message, containerId = 'error-alert') {
        const errorContainer = document.getElementById(containerId);
        const errorMessage = document.getElementById('error-message');
        
        if (errorContainer && errorMessage) {
            errorMessage.textContent = message;
            errorContainer.classList.remove('hidden');
            errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            // Fallback: alert
            alert(message);
        }
    }

    // Exportar a window
    window.ModuleLoader = {
        waitForDependencies,
        checkDependencies,
        initModule,
        showModuleError
    };

    console.log('✅ Module Loader disponible');

})();