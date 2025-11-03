/* ============================================
   SPEAKLEXI - GESTOR DE TEMA OSCURO/CLARO
   Archivo: assets/js/theme-manager.js
   Usa: window.APP_CONFIG desde app-config.js
   ============================================ */

class ThemeManager {
    constructor() {
        this.config = window.APP_CONFIG || {};
        this.storageKey = this.config.STORAGE?.KEYS?.THEME || 'color-theme';
        this.init();
    }

    /**
     * Inicializa el gestor de temas
     */
    init() {
        this.loadTheme();
        this.setupEventListeners();
        console.log('✅ Theme Manager inicializado');
    }

    /**
     * Carga el tema guardado o preferencia del sistema
     */
    loadTheme() {
        const savedTheme = localStorage.getItem(this.storageKey);
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
            this.setTheme('dark');
        } else {
            this.setTheme('light');
        }
    }

    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Buscar botón de tema
        this.findThemeButton();
        
        // Escuchar cambios del sistema
        this.setupSystemListener();
    }

    /**
     * Busca el botón de tema
     */
    findThemeButton() {
        this.themeButton = document.getElementById('theme-toggle');
        this.themeIcon = document.getElementById('theme-icon');
        
        if (this.themeButton && this.themeIcon) {
            this.themeButton.addEventListener('click', () => this.toggleTheme());
        }
    }

    /**
     * Escucha cambios del sistema
     */
    setupSystemListener() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            if (!localStorage.getItem(this.storageKey)) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    /**
     * Establece el tema
     */
    setTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            this.updateIcon('dark');
        } else {
            document.documentElement.classList.remove('dark');
            this.updateIcon('light');
        }
        
        localStorage.setItem(this.storageKey, theme);
    }

    /**
     * Actualiza el ícono
     */
    updateIcon(theme) {
        if (!this.themeIcon) {
            this.themeIcon = document.getElementById('theme-icon');
            if (!this.themeIcon) return;
        }
        
        if (theme === 'dark') {
            this.themeIcon.classList.remove('fa-moon');
            this.themeIcon.classList.add('fa-sun');
        } else {
            this.themeIcon.classList.remove('fa-sun');
            this.themeIcon.classList.add('fa-moon');
        }
    }

    /**
     * Cambia entre temas
     */
    toggleTheme() {
        const isDark = document.documentElement.classList.contains('dark');
        this.setTheme(isDark ? 'light' : 'dark');
    }

    /**
     * Obtiene el tema actual
     */
    getCurrentTheme() {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
}

// Inicializar automáticamente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeManager = new ThemeManager();
    });
} else {
    window.themeManager = new ThemeManager();
}