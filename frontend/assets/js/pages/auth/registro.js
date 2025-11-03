/* ============================================
   SPEAKLEXI - LÓGICA DE REGISTRO
   Archivo: assets/js/pages/registro.js
   Usa: window.APP_CONFIG, window.apiClient, window.formValidator
   ============================================ */

(() => {
    'use strict';

    // ===================================
    // VERIFICAR DEPENDENCIAS
    // ===================================
    if (!window.APP_CONFIG) {
        console.error('❌ APP_CONFIG no está cargado');
        return;
    }

    if (!window.apiClient) {
        console.error('❌ apiClient no está cargado');
        return;
    }

    if (!window.formValidator) {
        console.error('❌ formValidator no está cargado');
        return;
    }

    console.log('✅ Módulo de registro inicializado');

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
    
    /**
     * Muestra un error general
     */
    function showError(msg) {
        errorMessage.textContent = msg;
        errorAlert.classList.remove('hidden');
        errorAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    /**
     * Oculta el error general
     */
    function hideError() {
        errorAlert.classList.add('hidden');
    }

    /**
     * Actualiza el indicador de fortaleza de contraseña
     */
    function updatePasswordStrength() {
        const password = passwordInput.value;
        const strength = window.formValidator.getPasswordStrength(password);

        // Actualizar barras
        strengthBars.forEach((bar, index) => {
            bar.className = 'password-strength flex-1 rounded transition-all duration-300';
            
            if (index <= strength.score) {
                bar.classList.add(strength.color);
            } else {
                bar.classList.add('bg-gray-200', 'dark:bg-gray-700');
            }
        });

        // Actualizar texto
        if (password.length > 0) {
            passwordFeedback.textContent = `Fortaleza: ${strength.text}`;
            passwordFeedback.className = `text-xs ${strength.color.replace('bg-', 'text-')}`;
        } else {
            passwordFeedback.textContent = '';
        }
    }

    /**
     * Verifica si las contraseñas coinciden
     */
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

    /**
     * Toggle visibilidad de contraseña
     */
    function togglePasswordVisibility(input, icon) {
        const type = input.type === 'password' ? 'text' : 'password';
        input.type = type;
        icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    }

    /**
     * Deshabilita el formulario
     */
    function disableForm() {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creando cuenta...';
        
        // Deshabilitar todos los inputs
        form.querySelectorAll('input, select, button').forEach(el => {
            el.disabled = true;
        });
    }

    /**
     * Habilita el formulario
     */
    function enableForm() {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-user-plus mr-2"></i>Crear Cuenta';
        
        // Habilitar todos los inputs
        form.querySelectorAll('input, select, button').forEach(el => {
            el.disabled = false;
        });
    }

    // ===================================
    // EVENT LISTENERS
    // ===================================

    // Toggle password visibility
    togglePasswordBtn?.addEventListener('click', () => {
        togglePasswordVisibility(passwordInput, eyeIcon1);
    });

    toggleConfirmPasswordBtn?.addEventListener('click', () => {
        togglePasswordVisibility(confirmPasswordInput, eyeIcon2);
    });

    // Password strength
    passwordInput?.addEventListener('input', () => {
        updatePasswordStrength();
        checkPasswordMatch();
        window.formValidator.clearFieldError('password');
    });

    // Password match
    confirmPasswordInput?.addEventListener('input', () => {
        checkPasswordMatch();
        window.formValidator.clearFieldError('confirmPassword');
    });

    // Limpiar errores al escribir
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
    // VALIDACIÓN Y ENVÍO DEL FORMULARIO
    // ===================================

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();
        window.formValidator.clearAllErrors('register-form');

        // ✅ Recopilar datos del formulario
        const formData = {
            nombre: nombreInput.value.trim(),
            primer_apellido: primerApellidoInput.value.trim(),
            segundo_apellido: segundoApellidoInput.value.trim(),
            correo: correoInput.value.trim(),
            password: passwordInput.value,
            confirmPassword: confirmPasswordInput.value,
            idioma_aprendizaje: idiomaSelect.value
        };

        // ✅ Validar campos individuales
        let hasErrors = false;

        // Validar nombre
        const nombreValidation = window.formValidator.validateNombre(formData.nombre, 'nombre');
        if (!nombreValidation.valid) {
            window.formValidator.showFieldError('nombre', nombreValidation.error);
            hasErrors = true;
        }

        // Validar primer apellido
        const apellidoValidation = window.formValidator.validateNombre(formData.primer_apellido, 'primer apellido');
        if (!apellidoValidation.valid) {
            window.formValidator.showFieldError('primer_apellido', apellidoValidation.error);
            hasErrors = true;
        }

        // Validar correo
        const emailValidation = window.formValidator.validateEmail(formData.correo);
        if (!emailValidation.valid) {
            window.formValidator.showFieldError('correo', emailValidation.error);
            hasErrors = true;
        }

        // Validar contraseña
        const passwordValidation = window.formValidator.validatePassword(formData.password);
        if (!passwordValidation.valid) {
            window.formValidator.showFieldError('password', passwordValidation.error);
            hasErrors = true;
        }

        // Validar confirmación de contraseña
        const matchValidation = window.formValidator.validatePasswordMatch(
            formData.password, 
            formData.confirmPassword
        );
        if (!matchValidation.valid) {
            window.formValidator.showFieldError('confirmPassword', matchValidation.error);
            hasErrors = true;
        }

        // Validar idioma
        const idiomaValidation = window.formValidator.validateSelect(formData.idioma_aprendizaje, 'idioma');
        if (!idiomaValidation.valid) {
            window.formValidator.showFieldError('idioma_aprendizaje', idiomaValidation.error);
            hasErrors = true;
        }

        if (hasErrors) {
            showError('Por favor corrige los errores en el formulario');
            return;
        }

        // ✅ Enviar datos al servidor
        disableForm();

        try {
            // ✅ Usar apiClient (que ya tiene la URL correcta desde app-config)
            const response = await window.apiClient.registro({
                nombre: formData.nombre,
                primer_apellido: formData.primer_apellido,
                segundo_apellido: formData.segundo_apellido || null,
                correo: formData.correo,
                password: formData.password,
                idioma_aprendizaje: formData.idioma_aprendizaje
            });

            if (!response.success) {
                // Manejar errores específicos
                if (response.errores && response.errores.length > 0) {
                    // Mostrar errores de validación del servidor
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

            // ✅ Registro exitoso
            console.log('✅ Registro exitoso:', response.data);

            // Mostrar toast de éxito
            if (window.toastManager) {
                window.toastManager.success('¡Cuenta creada exitosamente! Revisa tu correo para verificar tu cuenta.');
            }

            // ✅ Guardar email para la página de verificación
            const storageKeys = window.APP_CONFIG.STORAGE.KEYS;
            localStorage.setItem(storageKeys.EMAIL, formData.correo);

            // Redirigir a verificación de email
            setTimeout(() => {
                window.location.href = `/pages/auth/verificar-email.html?email=${encodeURIComponent(formData.correo)}`;
            }, 1500);

        } catch (error) {
            console.error('❌ Error en registro:', error);
            showError('Ocurrió un error inesperado. Por favor intenta nuevamente.');
        } finally {
            enableForm();
        }
    });

    // ===================================
    // LOG DE INICIALIZACIÓN
    // ===================================
    if (window.APP_CONFIG.ENV.DEBUG) {
        console.log('📋 Módulo de registro listo');
        console.log('🔧 Configuración:', {
            apiUrl: window.APP_CONFIG.API.API_URL,
            validationRules: window.APP_CONFIG.VALIDATION
        });
    }

})();