/* ============================================
   SPEAKLEXI - RESTABLECER CONTRASEÑA
   Archivo: assets/js/pages/auth/restablecer-contrasena.js
   ============================================ */

(async () => {
    'use strict';

    const dependencias = [
        'APP_CONFIG',
        'apiClient',
        'formValidator',
        'toastManager',
        'Utils',
        'ModuleLoader'
    ];

    const inicializado = await window.ModuleLoader.initModule({
        moduleName: 'Restablecer Contraseña',
        dependencies: dependencias,
        onReady: inicializarModulo,
        onError: (error) => {
            console.error('💥 Error:', error);
            window.ModuleLoader.showModuleError('Error al cargar el módulo');
        }
    });

    if (!inicializado) return;

    async function inicializarModulo() {
        console.log('✅ Módulo Restablecer Contraseña listo');

        const config = {
            API: window.APP_CONFIG.API,
            ENDPOINTS: window.APP_CONFIG.API.ENDPOINTS,
            UI: window.APP_CONFIG.UI
        };

        // Elementos DOM
        const elementos = {
            form: document.getElementById('restablecer-form'),
            passwordInput: document.getElementById('password'),
            confirmInput: document.getElementById('confirm-password'),
            submitBtn: document.getElementById('submit-btn'),
            togglePassword: document.getElementById('toggle-password'),
            toggleConfirm: document.getElementById('toggle-confirm'),
            eyeIcon: document.getElementById('eye-icon'),
            eyeIconConfirm: document.getElementById('eye-icon-confirm'),
            matchError: document.getElementById('match-error'),
            
            // Requisitos
            reqLength: document.getElementById('req-length'),
            reqUppercase: document.getElementById('req-uppercase'),
            reqLowercase: document.getElementById('req-lowercase'),
            reqNumber: document.getElementById('req-number'),
            
            // Fortaleza
            strengthBar: document.getElementById('strength-bar'),
            strengthText: document.getElementById('strength-text')
        };

        // Estado
        const estado = {
            token: null,
            isLoading: false,
            passwordValid: false,
            passwordsMatch: false
        };

        // ============================================
        // OBTENER TOKEN DE URL
        // ============================================
        
        function obtenerToken() {
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');

            if (!token) {
                window.toastManager.error('Token no proporcionado');
                setTimeout(() => {
                    window.location.href = '/pages/auth/recuperar-contrasena.html';
                }, 2000);
                return null;
            }

            return token;
        }

        // ============================================
        // VALIDAR CONTRASEÑA
        // ============================================
        
        function validarPassword() {
            const password = elementos.passwordInput.value;
            
            const requisitos = {
                length: password.length >= 8,
                uppercase: /[A-Z]/.test(password),
                lowercase: /[a-z]/.test(password),
                number: /\d/.test(password)
            };

            // Actualizar UI de requisitos
            actualizarRequisito(elementos.reqLength, requisitos.length);
            actualizarRequisito(elementos.reqUppercase, requisitos.uppercase);
            actualizarRequisito(elementos.reqLowercase, requisitos.lowercase);
            actualizarRequisito(elementos.reqNumber, requisitos.number);

            // Calcular fortaleza
            const cumplidos = Object.values(requisitos).filter(Boolean).length;
            actualizarFortaleza(cumplidos);

            estado.passwordValid = Object.values(requisitos).every(Boolean);
            actualizarBotonSubmit();

            return estado.passwordValid;
        }

        function actualizarRequisito(elemento, cumple) {
            if (cumple) {
                elemento.className = 'text-green-500';
                elemento.innerHTML = elemento.innerHTML.replace('fa-times', 'fa-check');
            } else {
                elemento.className = 'text-red-500';
                elemento.innerHTML = elemento.innerHTML.replace('fa-check', 'fa-times');
            }
        }

        function actualizarFortaleza(cumplidos) {
            const porcentaje = (cumplidos / 4) * 100;
            elementos.strengthBar.style.width = `${porcentaje}%`;

            const colores = {
                0: { bg: 'bg-gray-400', text: 'Muy débil' },
                1: { bg: 'bg-red-500', text: 'Débil' },
                2: { bg: 'bg-orange-500', text: 'Regular' },
                3: { bg: 'bg-yellow-500', text: 'Buena' },
                4: { bg: 'bg-green-500', text: 'Fuerte' }
            };

            const nivel = colores[cumplidos];
            elementos.strengthBar.className = `h-full transition-all duration-300 ${nivel.bg}`;
            elementos.strengthText.textContent = nivel.text;
        }

        // ============================================
        // VALIDAR COINCIDENCIA
        // ============================================
        
        function validarCoincidencia() {
            const password = elementos.passwordInput.value;
            const confirm = elementos.confirmInput.value;

            estado.passwordsMatch = password === confirm && confirm.length > 0;

            if (confirm.length > 0 && !estado.passwordsMatch) {
                elementos.matchError.classList.remove('hidden');
            } else {
                elementos.matchError.classList.add('hidden');
            }

            actualizarBotonSubmit();
        }

        function actualizarBotonSubmit() {
            elementos.submitBtn.disabled = !(estado.passwordValid && estado.passwordsMatch);
        }

        // ============================================
        // TOGGLE VISIBILIDAD
        // ============================================
        
        function toggleVisibilidad(input, icon) {
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        }

        // ============================================
        // ENVIAR FORMULARIO
        // ============================================
        
        async function manejarEnvio(e) {
            e.preventDefault();

            if (estado.isLoading || !estado.passwordValid || !estado.passwordsMatch) {
                return;
            }

            await restablecerPassword();
        }

        async function restablecerPassword() {
            estado.isLoading = true;
            elementos.submitBtn.disabled = true;
            elementos.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Restableciendo...';

            try {
                const password = elementos.passwordInput.value;

                console.log('📤 Restableciendo contraseña...');

                const response = await window.apiClient.post(
                    config.ENDPOINTS.AUTH.RESTABLECER_CONTRASENA,
                    {
                        token: estado.token,
                        nueva_password: password
                    }
                );

                if (response.success || response.mensaje) {
                    window.toastManager.success('¡Contraseña restablecida exitosamente!');
                    
                    setTimeout(() => {
                        window.location.href = config.UI.RUTAS.LOGIN;
                    }, 2000);
                } else {
                    throw new Error(response.error || 'Error al restablecer contraseña');
                }

            } catch (error) {
                console.error('💥 Error:', error);
                
                if (error.message.includes('expirado') || error.message.includes('inválido')) {
                    window.toastManager.error('El enlace ha expirado o es inválido');
                    setTimeout(() => {
                        window.location.href = '/pages/auth/recuperar-contrasena.html';
                    }, 2000);
                } else {
                    window.toastManager.error(error.message);
                }
            } finally {
                estado.isLoading = false;
                elementos.submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Restablecer Contraseña';
            }
        }

        // ============================================
        // EVENT LISTENERS
        // ============================================
        
        elementos.form.addEventListener('submit', manejarEnvio);
        
        elementos.passwordInput.addEventListener('input', () => {
            validarPassword();
            if (elementos.confirmInput.value.length > 0) {
                validarCoincidencia();
            }
        });

        elementos.confirmInput.addEventListener('input', validarCoincidencia);

        elementos.togglePassword.addEventListener('click', () => {
            toggleVisibilidad(elementos.passwordInput, elementos.eyeIcon);
        });

        elementos.toggleConfirm.addEventListener('click', () => {
            toggleVisibilidad(elementos.confirmInput, elementos.eyeIconConfirm);
        });

        // ============================================
        // INICIALIZACIÓN
        // ============================================
        
        estado.token = obtenerToken();
        
        if (!estado.token) {
            return;
        }

        console.log('🔧 Restablecer contraseña configurado');
    }
})();