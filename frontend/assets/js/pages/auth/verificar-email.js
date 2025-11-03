/* ============================================
   SPEAKLEXI - VERIFICACIÓN DE EMAIL
   Archivo: assets/js/pages/auth/verificar-email.js
   Usa: APP_CONFIG, apiClient, formValidator, toastManager
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
        'ModuleLoader'
    ];

    const inicializado = await window.ModuleLoader.initModule({
        moduleName: 'Verificar Email',
        dependencies: dependencias,
        onReady: inicializarModulo,
        onError: (error) => {
            console.error('💥 Error al cargar módulo de verificación:', error);
            window.ModuleLoader.showModuleError(
                'Error al cargar el sistema de verificación. Por favor recarga la página.'
            );
        }
    });

    if (!inicializado) return;

    // ============================================
    // 2. FUNCIÓN PRINCIPAL DE INICIALIZACIÓN
    // ============================================
    async function inicializarModulo() {
        console.log('✅ Módulo de verificación de email listo');

        // ===================================
        // CONFIGURACIÓN DESDE APP_CONFIG
        // ===================================
        const config = {
            API: window.APP_CONFIG.API,
            ENDPOINTS: window.APP_CONFIG.API.ENDPOINTS,
            STORAGE: window.APP_CONFIG.STORAGE.KEYS,
            VALIDATION: window.APP_CONFIG.VALIDATION,
            UI: window.APP_CONFIG.UI,
            TIMEOUTS: window.APP_CONFIG.TIMEOUTS
        };

        // ===================================
        // ELEMENTOS DEL DOM
        // ===================================
        const elementos = {
            emailDisplay: document.getElementById('email-display'),
            verifyForm: document.getElementById('verify-form'),
            submitBtn: document.getElementById('submit-btn'),
            resendBtn: document.getElementById('resend-btn'),
            countdownElement: document.getElementById('countdown'),
            countdownTimeElement: document.getElementById('countdown-time'),
            errorAlert: document.getElementById('error-alert'),
            errorMessage: document.getElementById('error-message'),
            codeInputs: document.querySelectorAll('.code-input')
        };

        // ===================================
        // ESTADO DE LA APLICACIÓN
        // ===================================
        const estado = {
            isLoading: false,
            email: null,
            countdown: config.TIMEOUTS.REENVIO_CODIGO || 60,
            countdownInterval: null
        };

        // ===================================
        // FUNCIONES AUXILIARES
        // ===================================
        
        function mostrarError(mensaje) {
            elementos.errorMessage.textContent = mensaje;
            elementos.errorAlert.classList.remove('hidden');
            elementos.errorAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        function limpiarError() {
            elementos.errorAlert.classList.add('hidden');
        }

        function mostrarLoading(mostrar) {
            estado.isLoading = mostrar;
            elementos.submitBtn.disabled = mostrar;
            
            if (mostrar) {
                elementos.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Verificando...';
            } else {
                elementos.submitBtn.innerHTML = '<i class="fas fa-check-circle mr-2"></i>Verificar Email';
            }
        }

        function deshabilitarReenvio() {
            elementos.resendBtn.disabled = true;
            elementos.resendBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Reenviando...';
        }

        function habilitarReenvio() {
            elementos.resendBtn.disabled = false;
            elementos.resendBtn.innerHTML = '<i class="fas fa-redo-alt mr-2"></i>Reenviar código';
        }

        function obtenerCodigoCompleto() {
            return Array.from(elementos.codeInputs).map(input => input.value).join('');
        }

        function limpiarCodigo() {
            elementos.codeInputs.forEach(input => input.value = '');
            elementos.codeInputs[0]?.focus();
        }

        // ===================================
        // MANEJO DE CÓDIGO
        // ===================================
        
        function configurarInputsCodigo() {
            elementos.codeInputs.forEach((input, index) => {
                // Manejar input
                input.addEventListener('input', (e) => {
                    limpiarError();
                    const value = e.target.value;
                    
                    // Si pegan los 6 dígitos
                    if (value.length > 1) {
                        manejarPegadoCodigo(value);
                        return;
                    }

                    // Auto-mover al siguiente input
                    if (value && index < elementos.codeInputs.length - 1) {
                        elementos.codeInputs[index + 1].focus();
                    }

                    // Auto-verificar si todos los campos están llenos
                    const codigoCompleto = obtenerCodigoCompleto();
                    if (codigoCompleto.length === 6) {
                        elementos.verifyForm.dispatchEvent(new Event('submit'));
                    }
                });

                // Manejar teclas especiales
                input.addEventListener('keydown', (e) => {
                    // Backspace: volver al anterior
                    if (e.key === 'Backspace' && !input.value && index > 0) {
                        elementos.codeInputs[index - 1].focus();
                    }
                    
                    // Flechas: navegar entre inputs
                    if (e.key === 'ArrowLeft' && index > 0) {
                        elementos.codeInputs[index - 1].focus();
                        e.preventDefault();
                    }
                    if (e.key === 'ArrowRight' && index < elementos.codeInputs.length - 1) {
                        elementos.codeInputs[index + 1].focus();
                        e.preventDefault();
                    }
                });
                
                // Solo permitir números
                input.addEventListener('keypress', (e) => {
                    if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                    }
                });

                // Prevenir pegar texto no numérico
                input.addEventListener('paste', (e) => {
                    e.preventDefault();
                    const pasteData = e.clipboardData.getData('text');
                    const numbersOnly = pasteData.replace(/\D/g, '');
                    if (numbersOnly) {
                        manejarPegadoCodigo(numbersOnly);
                    }
                });
            });
        }

        function manejarPegadoCodigo(codigo) {
            const codigoLimpio = codigo.replace(/\D/g, '').slice(0, 6);
            codigoLimpio.split('').forEach((digit, i) => {
                if (elementos.codeInputs[i]) {
                    elementos.codeInputs[i].value = digit;
                }
            });
            elementos.codeInputs[elementos.codeInputs.length - 1]?.focus();
        }

        function validarCodigo(codigo) {
            if (codigo.length !== 6) {
                return {
                    esValido: false,
                    error: 'Por favor ingresa el código completo de 6 dígitos'
                };
            }

            if (!/^\d{6}$/.test(codigo)) {
                return {
                    esValido: false,
                    error: 'El código debe contener solo números'
                };
            }

            return { esValido: true };
        }

        // ===================================
        // MANEJO DE COUNTDOWN
        // ===================================
        
        function iniciarCountdown() {
            elementos.resendBtn.disabled = true;
            elementos.countdownElement?.classList.remove('hidden');
            
            estado.countdownInterval = setInterval(() => {
                estado.countdown--;
                if (elementos.countdownTimeElement) {
                    elementos.countdownTimeElement.textContent = estado.countdown;
                }
                
                if (estado.countdown <= 0) {
                    detenerCountdown();
                }
            }, 1000);
        }

        function detenerCountdown() {
            if (estado.countdownInterval) {
                clearInterval(estado.countdownInterval);
                estado.countdownInterval = null;
            }
            elementos.resendBtn.disabled = false;
            elementos.countdownElement?.classList.add('hidden');
        }

        function reiniciarCountdown() {
            detenerCountdown();
            estado.countdown = config.TIMEOUTS.REENVIO_CODIGO || 60;
            iniciarCountdown();
        }

        // ===================================
        // FUNCIONES PRINCIPALES
        // ===================================
        
        function cargarEmailUsuario() {
            const urlParams = new URLSearchParams(window.location.search);
            estado.email = urlParams.get('email') || localStorage.getItem(config.STORAGE.CORREO);

            if (!estado.email) {
                window.toastManager.error('No se encontró el correo del usuario');
                setTimeout(() => {
                    window.location.href = config.UI.RUTAS.REGISTRO;
                }, 2000);
                return false;
            }

            if (elementos.emailDisplay) {
                elementos.emailDisplay.textContent = estado.email;
            }
            
            return true;
        }

        async function verificarCodigo(codigo) {
            mostrarLoading(true);

            try {
                console.log('📤 Verificando código...');
                
                const response = await window.apiClient.post(config.ENDPOINTS.AUTH.VERIFICAR_EMAIL, {
                    correo: estado.email,
                    codigo: codigo
                });

                if (response.success) {
                    await manejarVerificacionExitosa(response.data);
                } else {
                    manejarErrorVerificacion(response);
                }

            } catch (error) {
                console.error('❌ Error en verificación:', error);
                mostrarError('Error de conexión. Por favor intenta nuevamente.');
            } finally {
                mostrarLoading(false);
            }
        }

        async function manejarVerificacionExitosa(data) {
            window.toastManager.success('✅ Correo verificado correctamente');

            // ✅ IMPORTANTE: NO borrar localStorage aquí
            // Se necesita en asignar-nivel.html
            // El localStorage se limpiará después de asignar el nivel exitosamente

            // Redirigir a asignar nivel
            setTimeout(() => {
                window.location.href = config.UI.RUTAS.ASIGNAR_NIVEL;
            }, 1500);
        }

        function manejarErrorVerificacion(response) {
            limpiarCodigo();
            mostrarError(response.error || 'Error al verificar el código');
        }

        async function reenviarCodigo() {
            deshabilitarReenvio();

            try {
                console.log('📤 Reenviando código...');
                
                const response = await window.apiClient.post(config.ENDPOINTS.AUTH.REENVIAR_CODIGO, {
                    correo: estado.email
                });

                if (response.success) {
                    window.toastManager.success('✅ Código reenviado. Revisa tu correo electrónico.');
                    reiniciarCountdown();
                } else {
                    throw new Error(response.error || 'Error al reenviar código');
                }

            } catch (error) {
                console.error('❌ Error al reenviar código:', error);
                window.toastManager.error(error.message);
            } finally {
                habilitarReenvio();
            }
        }

        // ===================================
        // EVENT LISTENERS
        // ===================================
        
        function configurarEventListeners() {
            elementos.verifyForm?.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                if (estado.isLoading) return;
                
                const codigo = obtenerCodigoCompleto();
                const validacion = validarCodigo(codigo);
                
                if (!validacion.esValido) {
                    mostrarError(validacion.error);
                    return;
                }

                await verificarCodigo(codigo);
            });

            elementos.resendBtn?.addEventListener('click', async (e) => {
                e.preventDefault();
                if (estado.isLoading) return;
                await reenviarCodigo();
            });
        }

        // ===================================
        // INICIALIZACIÓN
        // ===================================
        
        function inicializar() {
            if (!cargarEmailUsuario()) {
                return;
            }

            configurarInputsCodigo();
            configurarEventListeners();
            iniciarCountdown();
            
            // Auto-focus en primer input
            setTimeout(() => elementos.codeInputs[0]?.focus(), 100);

            if (window.APP_CONFIG.ENV.DEBUG) {
                console.log('🔧 Verificación configurada:', { config, estado, elementos });
            }
        }

        // Ejecutar inicialización
        inicializar();
    }

})();