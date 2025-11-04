window.ProgresoManager = {
    init() {
        this.actualizar();
    },

    actualizar() {
        const modulos = ['info', 'contenido', 'actividades', 'multimedia'];
        let completados = 0;
        
        modulos.forEach(modulo => {
            if (this.esModuloCompletado(modulo)) {
                completados++;
                this.marcarBadgeCompletado(modulo);
            } else {
                this.removerBadgeCompletado(modulo);
            }
        });
        
        const porcentaje = Math.round((completados / modulos.length) * 100);
        this.actualizarBarraProgreso(porcentaje);
        
        // Efecto especial al completar todo
        if (porcentaje === 100) {
            this.mostrarCelebracionCompletado();
        }
    },

    esModuloCompletado(modulo) {
        switch(modulo) {
            case 'info':
                const titulo = document.querySelector('input[name="titulo"]').value;
                const descripcion = document.querySelector('textarea[name="descripcion"]').value;
                const nivel = document.querySelector('select[name="nivel"]').value;
                const idioma = document.querySelector('select[name="idioma"]').value;
                return titulo && descripcion && nivel && idioma;
                
            case 'contenido':
                // Asumiendo que editorQuill está disponible globalmente
                return window.editorQuill && window.editorQuill.getText().trim().length > 100;
                
            case 'actividades':
                const actividades = window.leccionEditor.getActividades();
                return actividades.length > 0;
                
            case 'multimedia':
                const archivos = window.leccionEditor.getArchivosMultimedia();
                return archivos.length > 0;
                
            default:
                return false;
        }
    },

    marcarBadgeCompletado(modulo) {
        const badge = document.querySelector(`[data-etapa="${modulo}"]`);
        if (badge) {
            badge.classList.add('completed');
        }
    },

    removerBadgeCompletado(modulo) {
        const badge = document.querySelector(`[data-etapa="${modulo}"]`);
        if (badge) {
            badge.classList.remove('completed');
        }
    },

    actualizarBarraProgreso(porcentaje) {
        const barra = document.getElementById('progreso-bar');
        const porcentajeElement = document.getElementById('progreso-porcentaje');
        
        if (barra) {
            barra.style.width = porcentaje + '%';
        }
        
        if (porcentajeElement) {
            porcentajeElement.textContent = porcentaje + '%';
        }
        
        // Efecto especial
        if (porcentaje === 100) {
            barra.classList.add('animate-pulse-glow');
        } else {
            barra.classList.remove('animate-pulse-glow');
        }
    },

    marcarModuloCompletado(modulo) {
        const moduloElement = document.querySelector(`[data-modulo="${modulo}"]`);
        const indicator = moduloElement ? moduloElement.querySelector('.completado-indicator') : null;
        
        if (this.esModuloCompletado(modulo)) {
            if (indicator) indicator.classList.remove('hidden');
            if (moduloElement) moduloElement.classList.add('border-green-200', 'dark:border-green-800');
        } else {
            if (indicator) indicator.classList.add('hidden');
            if (moduloElement) moduloElement.classList.remove('border-green-200', 'dark:border-green-800');
        }
        
        this.actualizar();
    },

    navegarAModulo(modulo) {
        // Ocultar todos los módulos
        document.querySelectorAll('.editor-modulo').forEach(mod => {
            mod.classList.remove('active');
        });
        
        // Mostrar módulo seleccionado
        const moduloTarget = document.querySelector(`[data-modulo="${modulo}"]`);
        if (moduloTarget) {
            moduloTarget.classList.add('active');
            moduloTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        // Actualizar badges
        document.querySelectorAll('.badge-progreso').forEach(badge => {
            badge.classList.remove('active');
        });
        document.querySelector(`[data-etapa="${modulo}"]`).classList.add('active');
    },

    mostrarCelebracionCompletado() {
        if (window.toastManager) {
            window.toastManager.success('🎊 ¡Lección Completa! Lista para publicar.', { duration: 5000 });
        }
    }
};

// Inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.ProgresoManager.init();
    });
} else {
    window.ProgresoManager.init();
}