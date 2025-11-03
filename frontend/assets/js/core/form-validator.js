/* ============================================
   SPEAKLEXI - VALIDADOR DE FORMULARIOS
   Archivo: assets/js/core/form-validator.js
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
     * Obtiene la fortaleza de una contraseña
     */
    getPasswordStrength(password) {
        if (!password) {
            return { score: -1, text: '', color: '' };
        }

        let score = 0;
        
        // Criterios de fortaleza
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;

        // Mapear score a categorías
        const strength = {
            0: { text: 'Muy débil', color: 'bg-red-500' },
            1: { text: 'Débil', color: 'bg-orange-500' },
            2: { text: 'Media', color: 'bg-yellow-500' },
            3: { text: 'Buena', color: 'bg-blue-500' },
            4: { text: 'Fuerte', color: 'bg-green-500' },
            5: { text: 'Muy fuerte', color: 'bg-green-600' }
        };

        const normalizedScore = Math.min(score, 5);
        
        return {
            score: normalizedScore,
            text: strength[normalizedScore].text,
            color: strength[normalizedScore].color
        };
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
    validateNombre(nombre, fieldLabel = 'nombre') {
        if (!nombre || nombre.trim() === '') {
            return { valid: false, error: `El ${fieldLabel} es requerido` };
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
     * Valida un campo select
     */
    validateSelect(value, fieldLabel = 'campo') {
        if (!value || value === '' || value === 'null' || value === 'undefined') {
            return { valid: false, error: `Por favor selecciona un ${fieldLabel}` };
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
     * Muestra error en un campo (alias para compatibilidad)
     */
    showFieldError(fieldId, message) {
        return this.showError(fieldId, message);
    }

    /**
     * Muestra error en un campo
     */
    showError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (!field) {
            console.warn(`Campo ${fieldId} no encontrado`);
            return;
        }

        // Agregar borde rojo
        field.classList.add('border-red-500', 'dark:border-red-500');
        field.classList.remove('border-green-500', 'dark:border-green-500');

        // Crear mensaje de error
        let errorElement = document.getElementById(`${fieldId}-error`);
        if (!errorElement) {
            errorElement = document.createElement('p');
            errorElement.id = `${fieldId}-error`;
            errorElement.className = 'text-red-500 dark:text-red-400 text-sm mt-1 animate-slide-in';
            
            // Insertar después del campo o su contenedor
            const parent = field.closest('.relative') || field.parentNode;
            if (parent.nextSibling) {
                parent.parentNode.insertBefore(errorElement, parent.nextSibling);
            } else {
                parent.parentNode.appendChild(errorElement);
            }
        }

        errorElement.textContent = message;
    }

    /**
     * Limpia error de un campo (alias para compatibilidad)
     */
    clearFieldError(fieldId) {
        return this.clearError(fieldId);
    }

    /**
     * Limpia error de un campo
     */
    clearError(fieldId) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.remove('border-red-500', 'dark:border-red-500');
        }

        const errorElement = document.getElementById(`${fieldId}-error`);
        if (errorElement) {
            errorElement.remove();
        }
    }

    /**
     * Limpia todos los errores de un formulario
     */
    clearAllErrors(formId) {
        const form = document.getElementById(formId);
        if (!form) {
            console.warn(`Formulario ${formId} no encontrado`);
            return;
        }

        // Limpiar todos los campos con borde rojo
        form.querySelectorAll('.border-red-500').forEach(field => {
            field.classList.remove('border-red-500', 'dark:border-red-500');
        });

        // Eliminar todos los mensajes de error
        form.querySelectorAll('[id$="-error"]').forEach(error => {
            error.remove();
        });
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
                result = this.validateNombre(value, rule.label);
            }

            if (result.valid && rule.type === 'select') {
                result = this.validateSelect(value, rule.label);
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

    /**
     * Valida múltiples campos y muestra errores
     */
    validateFields(fields) {
        let isValid = true;

        for (const [fieldId, validator] of Object.entries(fields)) {
            const result = validator();
            if (!result.valid) {
                this.showFieldError(fieldId, result.error);
                isValid = false;
            }
        }

        return isValid;
    }
}

// Crear instancia global
window.formValidator = new FormValidator();