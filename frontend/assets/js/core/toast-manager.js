/* ============================================
   SPEAKLEXI - GESTOR DE NOTIFICACIONES TOAST
   Archivo: assets/js/toast-manager.js
   Usa: window.APP_CONFIG desde app-config.js
   ============================================ */

class ToastManager {
    constructor() {
        this.config = window.APP_CONFIG?.UI?.TOAST || {
            DURATION: 4000,
            POSITION: 'top-right'
        };
        this.createContainer();
        console.log('✅ Toast Manager inicializado');
    }

    /**
     * Crea el contenedor de toasts
     */
    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.className = `fixed z-50 space-y-2 max-w-sm w-full pointer-events-none ${this.getPositionClass()}`;
        document.body.appendChild(this.container);
    }

    /**
     * Obtiene la clase de posición
     */
    getPositionClass() {
        const positions = {
            'top-right': 'top-4 right-4',
            'top-left': 'top-4 left-4',
            'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
            'bottom-right': 'bottom-4 right-4',
            'bottom-left': 'bottom-4 left-4',
            'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
        };
        return positions[this.config.POSITION] || 'top-4 right-4';
    }

    /**
     * Muestra un toast
     */
    show(message, type = 'info', duration = null) {
        const toast = this.createToast(message, type);
        this.container.appendChild(toast);

        // Animación de entrada
        setTimeout(() => toast.classList.add('show'), 10);

        // Auto-remover
        if (duration !== 0) {
            setTimeout(() => this.remove(toast), duration || this.config.DURATION);
        }

        return toast;
    }

    /**
     * Crea el elemento toast
     */
    createToast(message, type) {
        const config = this.getToastConfig(type);
        const toast = document.createElement('div');
        
        toast.className = `${config.bg} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 transition-all duration-300 transform translate-x-full opacity-0 pointer-events-auto`;
        toast.innerHTML = `
            <i class="fas ${config.icon}"></i>
            <span class="flex-1 text-sm">${this.escapeHtml(message)}</span>
            <button class="toast-close text-white/70 hover:text-white">
                <i class="fas fa-times text-sm"></i>
            </button>
        `;

        // Botón cerrar
        toast.querySelector('.toast-close').addEventListener('click', () => this.remove(toast));
        
        return toast;
    }

    /**
     * Configuración de estilos por tipo
     */
    getToastConfig(type) {
        const configs = {
            success: { bg: 'bg-green-500', icon: 'fa-check-circle' },
            error: { bg: 'bg-red-500', icon: 'fa-exclamation-circle' },
            warning: { bg: 'bg-yellow-500', icon: 'fa-exclamation-triangle' },
            info: { bg: 'bg-blue-500', icon: 'fa-info-circle' }
        };
        return configs[type] || configs.info;
    }

    /**
     * Remueve un toast
     */
    remove(toast) {
        toast.classList.remove('show');
        toast.classList.add('opacity-0', 'translate-x-full');
        setTimeout(() => toast.remove(), 300);
    }

    /**
     * Métodos rápidos
     */
    success(message, duration = null) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = null) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = null) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = null) {
        return this.show(message, 'info', duration);
    }

    /**
     * Limpia todos los toasts
     */
    clearAll() {
        this.container.innerHTML = '';
    }

    /**
     * Previene XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Agregar estilos CSS
const toastStyles = `
    .toast.show {
        transform: translateX(0) !important;
        opacity: 1 !important;
    }
`;

if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = toastStyles;
    document.head.appendChild(style);
}

// Inicializar automáticamente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.toastManager = new ToastManager();
    });
} else {
    window.toastManager = new ToastManager();
}