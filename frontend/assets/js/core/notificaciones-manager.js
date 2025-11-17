// Sistema de notificaciones y mensajes
class NotificacionesManager {
    constructor() {
        this.notificaciones = [];
        this.mensajes = [];
        this.init();
    }

    async init() {
        await this.cargarNotificaciones();
        await this.cargarMensajes();
        this.actualizarBadges();
        this.setupNavbarListeners();
        
        // Actualizar cada 30 segundos
        setInterval(() => {
            this.cargarNotificaciones();
            this.cargarMensajes();
        }, 30000);
    }

    async cargarNotificaciones() {
        try {
            const { success, data } = await window.apiClient.get('/notificaciones');
            
            if (success && data) {
                this.notificaciones = Array.isArray(data.data) ? data.data : [];
                this.renderizarNotificaciones();
                this.actualizarBadges();
            }
        } catch (error) {
            console.error('Error cargando notificaciones:', error);
            this.notificaciones = [];
        }
    }

    async cargarMensajes() {
        try {
            const { success, data } = await window.apiClient.get('/mensajes/no-leidos');
            
            if (success && data) {
                this.mensajes = Array.isArray(data.data) ? data.data : [];
                this.renderizarMensajes();
                this.actualizarBadges();
            }
        } catch (error) {
            console.error('Error cargando mensajes:', error);
            this.mensajes = [];
        }
    }

    renderizarNotificaciones() {
        const lista = document.getElementById('lista-notificaciones');
        if (!lista) return;

        if (this.notificaciones.length === 0) {
            lista.innerHTML = '<div class="p-4 text-center text-gray-500 dark:text-gray-400">No hay notificaciones nuevas</div>';
            return;
        }

        lista.innerHTML = this.notificaciones.map(n => `
            <div class="p-4 ${n.leida ? 'bg-white dark:bg-gray-800' : 'bg-blue-50 dark:bg-blue-900/20'} hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                 onclick="notificacionesManager.marcarLeida(${n.id})">
                <div class="flex justify-between items-start">
                    <h4 class="font-medium text-gray-800 dark:text-white">${n.titulo}</h4>
                    ${!n.leida ? '<span class="w-2 h-2 bg-blue-500 rounded-full"></span>' : ''}
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">${n.descripcion}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">${this.formatearFecha(n.creado_en)}</p>
            </div>
        `).join('');
    }

    renderizarMensajes() {
        const lista = document.getElementById('lista-mensajes');
        if (!lista) return;

        if (this.mensajes.length === 0) {
            lista.innerHTML = '<div class="p-4 text-center text-gray-500 dark:text-gray-400">No hay mensajes nuevos</div>';
            return;
        }

        lista.innerHTML = this.mensajes.map(m => `
            <a href="/pages/mensajes.html?id=${m.id}" class="block p-4 ${m.leido ? 'bg-white dark:bg-gray-800' : 'bg-blue-50 dark:bg-blue-900/20'} hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div class="flex justify-between items-start">
                    <h4 class="font-medium text-gray-800 dark:text-white">${m.remitente_nombre}</h4>
                    ${!m.leido ? '<span class="w-2 h-2 bg-blue-500 rounded-full"></span>' : ''}
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-300 mt-1 truncate">${m.mensaje.substring(0, 50)}...</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">${this.formatearFecha(m.creado_en)}</p>
            </a>
        `).join('');
    }

    actualizarBadges() {
        const badgeNotif = document.getElementById('badge-notificaciones');
        const badgeMsg = document.getElementById('badge-mensajes');

        // ✅ FIX: Asegurarse de que sean arrays antes de usar filter
        const noLeidas = Array.isArray(this.notificaciones) 
            ? this.notificaciones.filter(n => !n.leida).length 
            : 0;
        
        const noLeidos = Array.isArray(this.mensajes) 
            ? this.mensajes.filter(m => !m.leido).length 
            : 0;

        if (badgeNotif) {
            if (noLeidas > 0) {
                badgeNotif.textContent = noLeidas;
                badgeNotif.classList.remove('hidden');
            } else {
                badgeNotif.classList.add('hidden');
            }
        }

        if (badgeMsg) {
            if (noLeidos > 0) {
                badgeMsg.textContent = noLeidos;
                badgeMsg.classList.remove('hidden');
            } else {
                badgeMsg.classList.add('hidden');
            }
        }
    }

    async marcarLeida(id) {
        try {
            await window.apiClient.post(`/notificaciones/${id}/marcar-leida`);
            await this.cargarNotificaciones();
        } catch (error) {
            console.error('Error marcando notificación como leída:', error);
        }
    }

    async marcarTodasLeidas() {
        try {
            await window.apiClient.post('/notificaciones/marcar-todas-leidas');
            await this.cargarNotificaciones();
        } catch (error) {
            console.error('Error marcando todas como leídas:', error);
        }
    }

    formatearFecha(fecha) {
        const ahora = new Date();
        const fechaObj = new Date(fecha);
        const diff = ahora - fechaObj;

        const minutos = Math.floor(diff / 60000);
        const horas = Math.floor(diff / 3600000);
        const dias = Math.floor(diff / 86400000);

        if (minutos < 1) return 'Ahora';
        if (minutos < 60) return `Hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
        if (horas < 24) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
        if (dias < 7) return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
        return fechaObj.toLocaleDateString();
    }

    setupNavbarListeners() {
        // Toggle notificaciones
        const btnNotificaciones = document.getElementById('btn-notificaciones');
        const panelNotificaciones = document.getElementById('panel-notificaciones');
        
        if (btnNotificaciones && panelNotificaciones) {
            btnNotificaciones.addEventListener('click', (e) => {
                e.stopPropagation();
                panelNotificaciones.classList.toggle('hidden');
                
                // Cerrar otros paneles
                const panelMensajes = document.getElementById('panel-mensajes');
                const dropdownPerfil = document.getElementById('dropdown-perfil');
                if (panelMensajes) panelMensajes.classList.add('hidden');
                if (dropdownPerfil) dropdownPerfil.classList.add('hidden');
            });
        }

        // Toggle mensajes
        const btnMensajes = document.getElementById('btn-mensajes');
        const panelMensajes = document.getElementById('panel-mensajes');
        
        if (btnMensajes && panelMensajes) {
            btnMensajes.addEventListener('click', (e) => {
                e.stopPropagation();
                panelMensajes.classList.toggle('hidden');
                
                // Cerrar otros paneles
                if (panelNotificaciones) panelNotificaciones.classList.add('hidden');
                const dropdownPerfil = document.getElementById('dropdown-perfil');
                if (dropdownPerfil) dropdownPerfil.classList.add('hidden');
            });
        }

        // Toggle perfil
        const btnPerfil = document.getElementById('btn-perfil');
        const dropdownPerfil = document.getElementById('dropdown-perfil');
        
        if (btnPerfil && dropdownPerfil) {
            btnPerfil.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownPerfil.classList.toggle('hidden');
                
                // Cerrar otros paneles
                if (panelNotificaciones) panelNotificaciones.classList.add('hidden');
                if (panelMensajes) panelMensajes.classList.add('hidden');
            });
        }

        // Marcar todas como leídas
        const btnMarcar = document.getElementById('btn-marcar-todas-leidas');
        if (btnMarcar) {
            btnMarcar.addEventListener('click', () => {
                this.marcarTodasLeidas();
            });
        }
    }
}

// ==================== EVENT LISTENERS DE NAVBAR ====================

// Inicializar al cargar
let notificacionesManager;
document.addEventListener('DOMContentLoaded', () => {
    // Esperar a que apiClient esté disponible
    setTimeout(() => {
        if (window.apiClient) {
            notificacionesManager = new NotificacionesManager();
        } else {
            console.warn('apiClient no disponible, reintentando en 500ms...');
            setTimeout(() => {
                if (window.apiClient) {
                    notificacionesManager = new NotificacionesManager();
                } else {
                    console.error('apiClient no disponible después de reintento');
                }
            }, 500);
        }
    }, 100);
});

// Función global para cerrar sesión
function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/frontend/pages/auth/login.html';
}