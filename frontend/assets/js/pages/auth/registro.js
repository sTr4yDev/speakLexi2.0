/* ============================================
   SPEAKLEXI - LÓGICA DE REGISTRO
   Archivo: assets/js/pages/auth/registro.js
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
        moduleName: 'Registro',
        dependencies: dependencias,
        onReady: inicializarModulo,
        onError: (error) => {
            console.error('💥 Error al cargar módulo de registro:', error);
            window.ModuleLoader.showModuleError(
                'Error al cargar el sistema de registro. Por favor recarga la página.'
            );
        }
    });

    if (!inicializado) return;

    // ============================================
    // 2. FUNCIÓN PRINCIPAL DE INICIALIZACIÓN
    // ============================================
    async function inicializarModulo() {
        console.log('✅ Módulo de registro listo');

        // ===================================
        // ELEMENTOS DEL DOM
        // ===================================
        const form = document.getElementById('register-form');
        const submitBtn = document.getElementById('submit-btn');
        const errorAlert = document.getElementById('error-alert');
        const errorMessage = document.getElementById('error-message');

        // Campos del formulario
        const nombreInput = document.getElementById('nombre');
        const primerApellidoInput = document.getElementById('primer_apellido');
        const segundoApellidoInput = document.getElementById('segundo_apellido');
        const correoInput = document.getElementById('correo');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const idiomaSelect = document.getElementById('idioma_aprendizaje');

        // Controles de password
        const togglePasswordBtn = document.getElementById('toggle-password');
        const toggleConfirmPasswordBtn = document.getElementById('toggle-confirm-password');
        const eyeIcon1 = document.getElementById('eye-icon-1');
        const eyeIcon2 = document.getElementById('eye-icon-2');

        // Indicadores de fortaleza
        const strengthBars = [
            document.getElementById('strength-1'),
            document.getElementById('strength-2'),
            document.getElementById('strength-3'),
            document.getElementById('strength-4')
        ];
        const passwordFeedback = document.getElementById('password-feedback');
        const passwordMatch = document.getElementById('password-match');

        // ===================================
        // FUNCIONES DE UI
        // ===================================
        
        function showError(msg) {
            errorMessage.textContent = msg;
            errorAlert.classList.remove('hidden');
            errorAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        function hideError() {
            errorAlert.classList.add('hidden');
        }

        function updatePasswordStrength() {
            const password = passwordInput.value;
            const strength = window.formValidator.getPasswordStrength(password);

            strengthBars.forEach((bar, index) => {
                bar.className = 'password-strength flex-1 rounded transition-all duration-300';
                
                if (index <= strength.score) {
                    bar.classList.add(strength.color);
                } else {
                    bar.classList.add('bg-gray-200', 'dark:bg-gray-700');
                }
            });

            if (password.length > 0) {
                passwordFeedback.textContent = `Fortaleza: ${strength.text}`;
                passwordFeedback.className = `text-xs ${strength.color.replace('bg-', 'text-')}`;
            } else {
                passwordFeedback.textContent = '';
            }
        }

        function checkPasswordMatch() {
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            if (confirmPassword.length > 0) {
                const result = window.formValidator.validatePasswordMatch(password, confirmPassword);
                
                if (result.valid) {
                    passwordMatch.classList.remove('hidden');
                    confirmPasswordInput.classList.remove('border-red-500');
                    confirmPasswordInput.classList.add('border-green-500');
                } else {
                    passwordMatch.classList.add('hidden');
                    confirmPasswordInput.classList.remove('border-green-500');
                    if (confirmPassword.length >= password.length) {
                        confirmPasswordInput.classList.add('border-red-500');
                    }
                }
            } else {
                passwordMatch.classList.add('hidden');
                confirmPasswordInput.classList.remove('border-red-500', 'border-green-500');
            }
        }

        function togglePasswordVisibility(input, icon) {
            const type = input.type === 'password' ? 'text' : 'password';
            input.type = type;
            icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
        }

        function disableForm() {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creando cuenta...';
            form.querySelectorAll('input, select, button').forEach(el => el.disabled = true);
        }

        function enableForm() {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-user-plus mr-2"></i>Crear Cuenta';
            form.querySelectorAll('input, select, button').forEach(el => el.disabled = false);
        }

        // ===================================
        // EVENT LISTENERS
        // ===================================

        togglePasswordBtn?.addEventListener('click', () => {
            togglePasswordVisibility(passwordInput, eyeIcon1);
        });

        toggleConfirmPasswordBtn?.addEventListener('click', () => {
            togglePasswordVisibility(confirmPasswordInput, eyeIcon2);
        });

        passwordInput?.addEventListener('input', () => {
            updatePasswordStrength();
            checkPasswordMatch();
            window.formValidator.clearFieldError('password');
        });

        confirmPasswordInput?.addEventListener('input', () => {
            checkPasswordMatch();
            window.formValidator.clearFieldError('confirmPassword');
        });

        [nombreInput, primerApellidoInput, segundoApellidoInput, correoInput].forEach(input => {
            input?.addEventListener('input', (e) => {
                window.formValidator.clearFieldError(e.target.id);
                hideError();
            });
        });

        idiomaSelect?.addEventListener('change', () => {
            window.formValidator.clearFieldError('idioma_aprendizaje');
            hideError();
        });

        // ===================================
        // SUBMIT DEL FORMULARIO
        // ===================================

        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideError();
            window.formValidator.clearAllErrors('register-form');

            const formData = {
                nombre: nombreInput.value.trim(),
                primer_apellido: primerApellidoInput.value.trim(),
                segundo_apellido: segundoApellidoInput.value.trim(),
                correo: correoInput.value.trim(),
                password: passwordInput.value,
                confirmPassword: confirmPasswordInput.value,
                idioma_aprendizaje: idiomaSelect.value
            };

            // Validaciones
            let hasErrors = false;

            const nombreValidation = window.formValidator.validateNombre(formData.nombre, 'nombre');
            if (!nombreValidation.valid) {
                window.formValidator.showFieldError('nombre', nombreValidation.error);
                hasErrors = true;
            }

            const apellidoValidation = window.formValidator.validateNombre(formData.primer_apellido, 'primer apellido');
            if (!apellidoValidation.valid) {
                window.formValidator.showFieldError('primer_apellido', apellidoValidation.error);
                hasErrors = true;
            }

            const emailValidation = window.formValidator.validateEmail(formData.correo);
            if (!emailValidation.valid) {
                window.formValidator.showFieldError('correo', emailValidation.error);
                hasErrors = true;
            }

            const passwordValidation = window.formValidator.validatePassword(formData.password);
            if (!passwordValidation.valid) {
                window.formValidator.showFieldError('password', passwordValidation.error);
                hasErrors = true;
            }

            const matchValidation = window.formValidator.validatePasswordMatch(
                formData.password, 
                formData.confirmPassword
            );
            if (!matchValidation.valid) {
                window.formValidator.showFieldError('confirmPassword', matchValidation.error);
                hasErrors = true;
            }

            const idiomaValidation = window.formValidator.validateSelect(formData.idioma_aprendizaje, 'idioma');
            if (!idiomaValidation.valid) {
                window.formValidator.showFieldError('idioma_aprendizaje', idiomaValidation.error);
                hasErrors = true;
            }

            if (hasErrors) {
                showError('Por favor corrige los errores en el formulario');
                return;
            }

            // Enviar al servidor
            disableForm();

            try {
                console.log('📤 Enviando registro al servidor...');
                
                const response = await window.apiClient.registro({
                    nombre: formData.nombre,
                    primer_apellido: formData.primer_apellido,
                    segundo_apellido: formData.segundo_apellido || null,
                    correo: formData.correo,
                    password: formData.password,
                    idioma_aprendizaje: formData.idioma_aprendizaje
                });

                console.log('📥 Respuesta del servidor:', response);

                if (!response.success) {
                    if (response.errores && response.errores.length > 0) {
                        response.errores.forEach(error => {
                            if (error.campo) {
                                window.formValidator.showFieldError(error.campo, error.mensaje);
                            }
                        });
                        showError('Por favor corrige los errores indicados');
                    } else {
                        showError(response.error || 'Error al crear la cuenta');
                    }
                    return;
                }

                console.log('✅ Registro exitoso');
                window.toastManager.success('¡Cuenta creada! Revisa tu correo para verificarla.');

                // ✅ CORREGIDO: Guardar EMAIL E IDIOMA para los siguientes pasos del onboarding
                const storageKeys = window.APP_CONFIG.STORAGE.KEYS;
                localStorage.setItem(storageKeys.EMAIL, formData.correo);
                localStorage.setItem(storageKeys.IDIOMA, formData.idioma_aprendizaje);

                // ✅ Debug: Confirmar que se guardó correctamente
                if (window.APP_CONFIG.ENV.DEBUG) {
                    console.log('💾 Datos guardados en localStorage:', {
                        correo: formData.correo,
                        idioma: formData.idioma_aprendizaje,
                        keys_usadas: {
                            EMAIL: storageKeys.EMAIL,
                            IDIOMA: storageKeys.IDIOMA
                        }
                    });
                }

                // Redirigir a verificación de email
                setTimeout(() => {
                    window.location.href = `verificar-email.html?email=${encodeURIComponent(formData.correo)}`;
                }, 1500);

            } catch (error) {
                console.error('❌ Error en registro:', error);
                showError('Error inesperado. Por favor intenta nuevamente.');
            } finally {
                enableForm();
            }
        });

        // Log final
        if (window.APP_CONFIG.ENV.DEBUG) {
            console.log('📋 Registro configurado:', {
                apiUrl: window.APP_CONFIG.API.API_URL,
                validation: window.APP_CONFIG.VALIDATION
            });
        }
    }

})();