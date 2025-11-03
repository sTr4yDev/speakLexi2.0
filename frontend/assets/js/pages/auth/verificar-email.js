/* ============================================
   SPEAKLEXI - VERIFICACIÓN DE EMAIL
   Archivo: assets/js/pages/auth/verificar-email.js
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
        'themeManager',
        'Utils'
    ];

    for (const dep of requiredDependencies) {
        if (!window[dep]) {
            console.error(`❌ ${dep} no está cargado`);
            return;
        }
    }

    console.log('✅ Módulo Verificar Email inicializado');

    // ============================================
    // 2. CONFIGURACIÓN DESDE APP_CONFIG
    // ============================================
    const config = {
        API: window.APP_CONFIG.API,
        ENDPOINTS: window.APP_CONFIG.API.ENDPOINTS,
        STORAGE: window.APP_CONFIG.STORAGE.KEYS,
        VALIDATION: window.APP_CONFIG.VALIDATION,
        UI: window.APP_CONFIG.UI,
        TIMEOUTS: window.APP_CONFIG.TIMEOUTS
    };

    // ============================================
    // 3. ELEMENTOS DEL DOM
    // ============================================
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

    // ============================================
    // 4. ESTADO DE LA APLICACIÓN
    // ============================================
    const estado = {
        isLoading: false,
        email: null,
        countdown: config.TIMEOUTS.REENVIO_CODIGO || 60,
        countdownInterval: null
    };

    // ============================================
    // 5. FUNCIONES PRINCIPALES
    // ============================================

    /**
     * Inicializa el módulo
     */
    function init() {
        cargarEmailUsuario();
        setupEventListeners();
        iniciarCountdown();
        
        if (window.APP_CONFIG.ENV.DEBUG) {
            console.log('🔧 Módulo Verificar Email listo:', { config, elementos, estado });
        }
    }

    /**
     * Carga el email del usuario desde URL o localStorage
     */
    function cargarEmailUsuario() {
        const urlParams = new URLSearchParams(window.location.search);
        estado.email = urlParams.get('email') || window.Utils.getFromStorage(config.STORAGE.CORREO);

        if (!estado.email) {
            window.toastManager.error('No se encontró el correo del usuario');
            setTimeout(() => {
                window.location.href = config.UI.RUTAS.REGISTRO;
            }, 2000);
            return;
        }

        elementos.emailDisplay.textContent = estado.email;
    }

    /**
     * Configura todos los event listeners
     */
    function setupEventListeners() {
        // Formulario principal
        elementos.verifyForm?.addEventListener('submit', manejarVerificacion);
        
        // Reenviar código
        elementos.resendBtn?.addEventListener('click', manejarReenvioCodigo);
        
        // Configurar inputs de código
        configurarInputsCodigo();
    }

    /**
     * Configura el comportamiento de los inputs de código
     */
    function configurarInputsCodigo() {
        elementos.codeInputs.forEach((input, index) => {
            // Manejar input
            input.addEventListener('input', (e) => {
                const value = e.target.value;
                
                // Si pegan los 6 dígitos
                if (value.length > 1) {
                    manejarPegadoCodigo(value);
                    return;
                }

                // Auto-mover al siguiente input
                if (value && index < 5) {
                    elementos.codeInputs[index + 1].focus();
                }

                // Auto-verificar si todos los campos están llenos
                const codigoCompleto = obtenerCodigoCompleto();
                if (codigoCompleto.length === 6) {
                    elementos.verifyForm.requestSubmit();
                }
            });

            // Manejar teclas especiales
            input.addEventListener('keydown', (e) => manejarTeclasEspeciales(e, index));
            
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

        // Auto-focus en primer input
        setTimeout(() => elementos.codeInputs[0]?.focus(), 100);
    }

    /**
     * Maneja el pegado de código completo
     */
    function manejarPegadoCodigo(codigo) {
        const codigoLimpio = codigo.replace(/\D/g, '').slice(0, 6);
        codigoLimpio.split('').forEach((digit, i) => {
            if (elementos.codeInputs[i]) {
                elementos.codeInputs[i].value = digit;
            }
        });
        elementos.codeInputs[5]?.focus();
    }

    /**
     * Maneja teclas especiales en inputs de código
     */
    function manejarTeclasEspeciales(e, index) {
        // Backspace: volver al anterior
        if (e.key === 'Backspace' && !elementos.codeInputs[index].value && index > 0) {
            elementos.codeInputs[index - 1].focus();
        }
        
        // Flechas: navegar entre inputs
        if (e.key === 'ArrowLeft' && index > 0) {
            elementos.codeInputs[index - 1].focus();
            e.preventDefault();
        }
        if (e.key === 'ArrowRight' && index < 5) {
            elementos.codeInputs[index + 1].focus();
            e.preventDefault();
        }
    }

    /**
     * Obtiene el código completo de los inputs
     */
    function obtenerCodigoCompleto() {
        return Array.from(elementos.codeInputs).map(input => input.value).join('');
    }

    /**
     * Maneja la verificación del código
     */
    async function manejarVerificacion(e) {
        e.preventDefault();
        
        if (estado.isLoading) return;
        
        const codigo = obtenerCodigoCompleto();
        const validacion = validarCodigo(codigo);
        
        if (!validacion.esValido) {
            mostrarError(validacion.error);
            return;
        }

        await verificarCodigo(codigo);
    }

    /**
     * Valida el código ingresado
     */
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

    /**
     * Verifica el código con el servidor
     */
    async function verificarCodigo(codigo) {
        try {
            estado.isLoading = true;
            mostrarLoading(true);
            limpiarError();

            // ✅ USAR apiClient CON ENDPOINTS DE APP_CONFIG
            const endpoint = config.ENDPOINTS.AUTH.VERIFICAR_EMAIL;
            const response = await window.apiClient.post(endpoint, {
                correo: estado.email,
                codigo: codigo
            });

            if (response.success) {
                await manejarVerificacionExitosa(response.data);
            } else {
                manejarErrorVerificacion(response);
            }

        } catch (error) {
            manejarError('Error de conexión', error);
        } finally {
            estado.isLoading = false;
            mostrarLoading(false);
        }
    }

    /**
     * Maneja verificación exitosa
     */
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

    /**
     * Maneja errores de verificación
     */
    function manejarErrorVerificacion(response) {
        // Resetear inputs en caso de error
        elementos.codeInputs.forEach(input => input.value = '');
        elementos.codeInputs[0]?.focus();
        
        mostrarError(response.error || 'Error al verificar el código');
    }

    /**
     * Maneja el reenvío del código
     */
    async function manejarReenvioCodigo() {
        if (estado.isLoading) return;

        elementos.resendBtn.disabled = true;
        elementos.resendBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Reenviando...';

        try {
            // ✅ USAR apiClient CON ENDPOINTS DE APP_CONFIG
            const endpoint = config.ENDPOINTS.AUTH.REENVIAR_CODIGO;
            const response = await window.apiClient.post(endpoint, {
                correo: estado.email
            });

            if (response.success) {
                window.toastManager.success('✅ Código reenviado. Revisa tu correo electrónico.');
                
                // Reiniciar countdown
                reiniciarCountdown();
            } else {
                throw new Error(response.error || 'Error al reenviar código');
            }

        } catch (error) {
            window.toastManager.error(error.message);
        } finally {
            elementos.resendBtn.disabled = false;
            elementos.resendBtn.innerHTML = '<i class="fas fa-redo-alt mr-2"></i>Reenviar código';
        }
    }

    // ============================================
    // 6. FUNCIONES DE UI/UX
    // ============================================

    function mostrarLoading(mostrar) {
        elementos.submitBtn.disabled = mostrar;
        
        if (mostrar) {
            elementos.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Verificando...';
        } else {
            elementos.submitBtn.innerHTML = '<i class="fas fa-check-circle mr-2"></i>Verificar Email';
        }
    }

    function mostrarError(mensaje) {
        elementos.errorMessage.textContent = mensaje;
        elementos.errorAlert.classList.remove('hidden');
    }

    function limpiarError() {
        elementos.errorAlert.classList.add('hidden');
    }

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
    // 7. MANEJO DE COUNTDOWN
    // ============================================

    function iniciarCountdown() {
        elementos.resendBtn.disabled = true;
        elementos.countdownElement.classList.remove('hidden');
        
        estado.countdownInterval = setInterval(() => {
            estado.countdown--;
            elementos.countdownTimeElement.textContent = estado.countdown;
            
            if (estado.countdown <= 0) {
                detenerCountdown();
            }
        }, 1000);
    }

    function detenerCountdown() {
        if (estado.countdownInterval) {
            clearInterval(estado.countdownInterval);
        }
        elementos.resendBtn.disabled = false;
        elementos.countdownElement.classList.add('hidden');
    }

    function reiniciarCountdown() {
        detenerCountdown();
        estado.countdown = config.TIMEOUTS.REENVIO_CODIGO || 60;
        iniciarCountdown();
    }

    // ============================================
    // 8. INICIALIZACIÓN
    // ============================================
    
    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM ya está listo
        setTimeout(init, 100);
    }

})();