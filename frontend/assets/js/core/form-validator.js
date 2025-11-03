/* ============================================
   SPEAKLEXI - VALIDADOR DE FORMULARIOS
   Archivo: assets/js/form-validator.js
   Usa: window.APP_CONFIG desde app-config.js
   ============================================ */

class FormValidator {
    constructor() {
        this.config = window.APP_CONFIG?.VALIDATION || this.getDefaultConfig();
        console.log('✅ Form Validator inicializado');
    }

    getDefaultConfig() {
        return {
            PASSWORD: {
                MIN_LENGTH: 6,
                REQUIRE_UPPERCASE: false,
                REQUIRE_LOWERCASE: true,
                REQUIRE_NUMBERS: true
            },
            EMAIL: {
                PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            },
            NOMBRE: {
                MIN_LENGTH: 2,
                MAX_LENGTH: 100
            }
        };
    }

    /**
     * Valida un email
     */
    validateEmail(email) {
        if (!email || email.trim() === '') {
            return { valid: false, error: 'El correo electrónico es requerido' };
        }

        if (!this.config.EMAIL.PATTERN.test(email.trim())) {
            return { valid: false, error: 'Formato de correo electrónico inválido' };
        }

        return { valid: true };
    }

    /**
     * Valida una contraseña
     */
    validatePassword(password) {
        if (!password) {
            return { valid: false, error: 'La contraseña es requerida' };
        }

        const errors = [];
        const rules = this.config.PASSWORD;

        if (password.length < rules.MIN_LENGTH) {
            errors.push(`Mínimo ${rules.MIN_LENGTH} caracteres`);
        }

        if (rules.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
            errors.push('Debe incluir minúsculas');
        }

        if (rules.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
            errors.push('Debe incluir mayúsculas');
        }

        if (rules.REQUIRE_NUMBERS && !/\d/.test(password)) {
            errors.push('Debe incluir números');
        }

        if (errors.length > 0) {
            return { valid: false, error: errors.join(', ') };
        }

        return { valid: true };
    }

    /**
     * Valida que las contraseñas coincidan
     */
    validatePasswordMatch(password, confirmPassword) {
        if (!confirmPassword) {
            return { valid: false, error: 'Confirma tu contraseña' };
        }

        if (password !== confirmPassword) {
            return { valid: false, error: 'Las contraseñas no coinciden' };
        }

        return { valid: true };
    }

    /**
     * Valida un nombre
     */
    validateNombre(nombre) {
        if (!nombre || nombre.trim() === '') {
            return { valid: false, error: 'El nombre es requerido' };
        }

        const trimmed = nombre.trim();
        const rules = this.config.NOMBRE;

        if (trimmed.length < rules.MIN_LENGTH) {
            return { valid: false, error: `Mínimo ${rules.MIN_LENGTH} caracteres` };
        }

        if (trimmed.length > rules.MAX_LENGTH) {
            return { valid: false, error: `Máximo ${rules.MAX_LENGTH} caracteres` };
        }

        return { valid: true };
    }

    /**
     * Valida un campo requerido
     */
    validateRequired(value, fieldName = 'campo') {
        if (!value || value.toString().trim() === '') {
            return { valid: false, error: `${fieldName} es requerido` };
        }
        return { valid: true };
    }

    /**
     * Muestra error en un campo
     */
    showError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        // Agregar borde rojo
        field.classList.add('border-red-500');
        field.classList.remove('border-green-500');

        // Crear mensaje de error
        let errorElement = document.getElementById(`${fieldId}-error`);
        if (!errorElement) {
            errorElement = document.createElement('p');
            errorElement.id = `${fieldId}-error`;
            errorElement.className = 'text-red-500 text-sm mt-1';
            field.parentNode.appendChild(errorElement);
        }

        errorElement.textContent = message;
    }

    /**
     * Limpia error de un campo
     */
    clearError(fieldId) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.remove('border-red-500');
        }

        const errorElement = document.getElementById(`${fieldId}-error`);
        if (errorElement) {
            errorElement.remove();
        }
    }

    /**
     * Valida formulario completo
     */
    validateForm(formData, validationRules) {
        const errors = {};

        for (const [field, rule] of Object.entries(validationRules)) {
            const value = formData[field];
            let result = { valid: true };

            if (rule.required) {
                result = this.validateRequired(value, rule.label || field);
            }

            if (result.valid && rule.type === 'email') {
                result = this.validateEmail(value);
            }

            if (result.valid && rule.type === 'password') {
                result = this.validatePassword(value);
            }

            if (result.valid && rule.type === 'nombre') {
                result = this.validateNombre(value);
            }

            if (!result.valid) {
                errors[field] = result.error;
            }
        }

        return {
            valid: Object.keys(errors).length === 0,
            errors: errors
        };
    }
}

// Crear instancia global
window.formValidator = new FormValidator();