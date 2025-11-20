/* ============================================
   SPEAKLEXI - RECUPERAR CONTRASEÑA
   Archivo: assets/js/pages/auth/recuperar-contrasena.js
   ============================================ */

(async () => {
    'use strict';

    // ============================================
    // 1. ESPERAR DEPENDENCIAS
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
        moduleName: 'Recuperar Contraseña',
        dependencies: dependencias,
        onReady: inicializarModulo,
        onError: (error) => {
            console.error('💥 Error al cargar módulo:', error);
            window.ModuleLoader.showModuleError(
                'Error al cargar el módulo. Recarga la página.'
            );
        }
    });

    if (!inicializado) return;

    // ============================================
    // 2. FUNCIÓN PRINCIPAL
    // ============================================
    async function inicializarModulo() {
        console.log('✅ Módulo Recuperar Contraseña listo');

        const config = {
            API: window.APP_CONFIG.API,
            ENDPOINTS: window.APP_CONFIG.API.ENDPOINTS,
            UI: window.APP_CONFIG.UI
        };

        // Elementos DOM
        const elementos = {
            form: document.getElementById('recuperar-form'),
            emailInput: document.getElementById('email'),
            emailError: document.getElementById('email-error'),
            submitBtn: document.getElementById('submit-btn')
        };

        // Estado
        const estado = {
            isLoading: false,
            emailEnviado: false
        };

        // ============================================
        // FUNCIONES AUXILIARES
        // ============================================
        
        function mostrarError(mensaje) {
            elementos.emailError.textContent = mensaje;
            elementos.emailError.classList.remove('hidden');
        }

        function ocultarError() {
            elementos.emailError.classList.add('hidden');
        }

        function mostrarCargando(mostrar = true) {
            estado.isLoading = mostrar;
            elementos.submitBtn.disabled = mostrar;
            
            if (mostrar) {
                elementos.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Enviando...';
            } else {
                elementos.submitBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Enviar Instrucciones';
            }
        }

        // ============================================
        // MANEJADOR DEL FORMULARIO
        // ============================================
        
        async function manejarEnvio(e) {
            e.preventDefault();
            
            if (estado.isLoading) return;

            // Limpiar errores previos
            ocultarError();

            // Validar email
            const email = elementos.emailInput.value.trim();
            const validacionEmail = window.formValidator.validateEmail(email);

            if (!validacionEmail.isValid) {
                mostrarError(validacionEmail.errors?.[0] || 'Email inválido');
                return;
            }

            // Enviar solicitud
            await solicitarRecuperacion(email);
        }

        // ============================================
        // SOLICITAR RECUPERACIÓN
        // ============================================
        
        async function solicitarRecuperacion(email) {
            mostrarCargando(true);

            try {
                console.log('📤 Solicitando recuperación...');

                const response = await window.apiClient.post(
                    config.ENDPOINTS.AUTH.RECUPERAR_CONTRASENA,
                    { correo: email }
                );

                if (response.success || response.mensaje) {
                    estado.emailEnviado = true;
                    
                    window.toastManager.success(
                        'Instrucciones enviadas. Revisa tu email.'
                    );

                    // Mostrar mensaje de éxito en la UI
                    mostrarMensajeExito();
                } else {
                    throw new Error(response.error || 'Error al solicitar recuperación');
                }

            } catch (error) {
                console.error('💥 Error:', error);
                
                // Mostrar mensaje genérico por seguridad
                window.toastManager.info(
                    'Si el email existe, recibirás instrucciones'
                );
                
                // Aún así mostrar mensaje de éxito
                mostrarMensajeExito();
            } finally {
                mostrarCargando(false);
            }
        }

        // ============================================
        // MOSTRAR MENSAJE DE ÉXITO
        // ============================================
        
        function mostrarMensajeExito() {
            elementos.form.innerHTML = `
                <div class="text-center py-8">
                    <div class="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                        <i class="fas fa-check-circle text-4xl text-green-600 dark:text-green-400"></i>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        ¡Email Enviado!
                    </h3>
                    <p class="text-gray-600 dark:text-gray-400 mb-6">
                        Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
                    </p>
                    <div class="space-y-3">
                        <a href="/pages/auth/login.html" class="block w-full py-3 px-4 bg-gradient-to-r from-secondary-600 to-primary-600 text-white rounded-xl font-semibold hover:from-secondary-700 hover:to-primary-700 transition-all text-center">
                            <i class="fas fa-arrow-left mr-2"></i>Volver al Login
                        </a>
                    </div>
                </div>
            `;
        }

        // ============================================
        // EVENT LISTENERS
        // ============================================
        
        elementos.form.addEventListener('submit', manejarEnvio);
        
        elementos.emailInput.addEventListener('input', () => {
            ocultarError();
        });

        // ============================================
        // INICIALIZACIÓN
        // ============================================
        
        console.log('🔧 Recuperar contraseña configurado');
    }
})();