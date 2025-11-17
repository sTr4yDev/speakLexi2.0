// ============================================
// SISTEMA DE MENSAJERÍA - SPEAKLEXI 2.0
// ============================================

// Configuración global
const CONFIG_MENSAJERIA = {
    MAX_CARACTERES: 1000,
    POLLING_INTERVAL: 15000,
    MAX_REINTENTOS: 3,
    TIMEOUT_MENSAJE: 30000,
    ANIMACION_SCROLL: true
};

// Mensajes de error específicos
const MENSAJES_ERROR = {
    401: 'Tu sesión expiró. Por favor inicia sesión nuevamente',
    403: 'No tienes permisos para realizar esta acción',
    404: 'Mensaje o conversación no encontrada',
    429: 'Demasiados mensajes enviados. Espera un momento',
    500: 'Error del servidor. Intenta nuevamente',
    network: 'Sin conexión a internet. Verifica tu red',
    timeout: 'La operación tardó demasiado. Intenta nuevamente'
};

// Sistema de notificaciones interno (fallback)
class NotificadorInterno {
    mostrar(mensaje, tipo, duracion = 4000) {
        const notif = document.createElement('div');
        notif.className = this.getClasses(tipo);
        notif.textContent = mensaje;
        notif.style.cssText = `
            position: fixed;
            top: 5rem;
            right: 1rem;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            z-index: 50;
            animation: fadeIn 0.3s ease-in-out;
            max-width: 320px;
            word-wrap: break-word;
        `;
        
        document.body.appendChild(notif);
        
        setTimeout(() => {
            notif.style.animation = 'fadeOut 0.3s ease-in-out';
            setTimeout(() => notif.remove(), 300);
        }, duracion);
    }
    
    getClasses(tipo) {
        const base = 'text-white font-medium';
        const tipos = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };
        return `${base} ${tipos[tipo] || tipos.info}`;
    }
}

class MensajeriaManager {
    constructor() {
        this.conversaciones = [];
        this.conversacionActual = null;
        this.mensajesActuales = [];
        this.profesores = [];
        this.notificadorInterno = new NotificadorInterno();
        this.pollingInterval = null;
        this.estadoEnvio = new Map();
        this.mensajesPendientes = new Map();
        this.isLoading = false;
        this.init();
    }

    async init() {
        console.log('🚀 Iniciando sistema de mensajería 2.0...');
        
        // Esperar a que apiClient esté disponible
        if (!window.apiClient) {
            console.error('❌ apiClient no disponible');
            this.notificar('Error de configuración del sistema', 'error');
            return;
        }

        // Cargar datos iniciales
        await this.cargarDatosIniciales();
        
        // Setup event listeners mejorado
        this.setupEventListeners();
        
        // Verificar si hay un mensaje específico en la URL
        this.verificarMensajeEnURL();
        
        // Iniciar polling inteligente
        this.iniciarPolling();
        
        console.log('✅ Sistema de mensajería 2.0 listo');
    }

    async cargarDatosIniciales() {
        try {
            this.mostrarLoading('global');
            
            // Cargar en paralelo
            await Promise.all([
                this.cargarProfesores(),
                this.cargarConversaciones()
            ]);
            
            this.ocultarLoading('global');
        } catch (error) {
            this.ocultarLoading('global');
            this.manejarError(error, 'cargar datos iniciales');
        }
    }

    setupEventListeners() {
        // Botón nuevo mensaje
        const btnNuevo = document.getElementById('btn-nuevo-mensaje');
        if (btnNuevo) {
            btnNuevo.addEventListener('click', () => this.abrirModalNuevoMensaje());
        }

        // Modal nuevo mensaje
        const btnCerrar = document.getElementById('btn-cerrar-modal');
        const btnCancelar = document.getElementById('btn-cancelar-modal');
        
        if (btnCerrar) btnCerrar.addEventListener('click', () => this.cerrarModal());
        if (btnCancelar) btnCancelar.addEventListener('click', () => this.cerrarModal());

        // Form nuevo mensaje
        const formNuevo = document.getElementById('form-nuevo-mensaje');
        if (formNuevo) {
            formNuevo.addEventListener('submit', (e) => {
                e.preventDefault();
                this.enviarNuevoMensaje();
            });
        }

        // Form respuesta con validación mejorada
        const formRespuesta = document.getElementById('form-enviar-respuesta');
        if (formRespuesta) {
            formRespuesta.addEventListener('submit', (e) => {
                e.preventDefault();
                this.enviarRespuesta();
            });
        }

        // Input de mensaje con contador de caracteres
        const inputMensaje = document.getElementById('input-mensaje');
        if (inputMensaje) {
            inputMensaje.addEventListener('input', (e) => {
                this.actualizarContadorCaracteres(e.target.value.length);
                this.toggleBotonEnvio(e.target.value.trim());
            });
            
            // Enter para enviar (Shift+Enter para nueva línea)
            inputMensaje.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.enviarRespuesta();
                }
            });
        }

        // Cerrar modal al hacer click fuera
        const modal = document.getElementById('modal-nuevo-mensaje');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.cerrarModal();
                }
            });
        }

        // Botón scroll to bottom
        const btnScroll = document.getElementById('scroll-to-bottom');
        if (btnScroll) {
            btnScroll.addEventListener('click', () => this.scrollToBottom(true));
        }

        // Detectar cambios de visibilidad para optimizar polling
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.detenerPolling();
            } else {
                this.iniciarPolling();
            }
        });
    }

    // ============================================
    // CORE FUNCTIONS CON MANEJO DE ERRORES
    // ============================================

    async cargarProfesores() {
        try {
            const response = await this.fetchConReintentos('/profesor/lista');
            
            if (response.success && response.data?.data) {
                this.profesores = response.data.data;
                this.renderizarSelectorProfesores();
            } else {
                throw new Error('Formato de respuesta inválido');
            }
        } catch (error) {
            console.warn('Error cargando profesores, usando datos de ejemplo:', error);
            // Fallback para desarrollo
            this.profesores = [
                { id: 2, nombre: 'Profesor Demo', correo: 'profesor@speaklexi.com' }
            ];
            this.renderizarSelectorProfesores();
            this.notificar('Usando datos de demostración', 'warning');
        }
    }

    async cargarConversaciones() {
        try {
            this.mostrarLoading('conversaciones');
            
            const response = await this.fetchConReintentos('/mensajes');
            
            if (response.success && response.data?.data) {
                this.conversaciones = this.agruparMensajesPorContacto(response.data.data);
                this.renderizarConversaciones();
                this.ocultarLoading('conversaciones');
            } else {
                throw new Error('Formato de respuesta inválido');
            }
        } catch (error) {
            this.ocultarLoading('conversaciones');
            this.manejarError(error, 'cargar conversaciones');
            this.mostrarEstadoVacio('error');
        }
    }

    async abrirConversacion(contactoId) {
        console.log('📬 Abriendo conversación con contacto:', contactoId);

        // Encontrar la conversación
        const conversacion = this.conversaciones.find(c => c.contacto_id === contactoId);
        if (!conversacion) {
            this.notificar('Conversación no encontrada', 'error');
            return;
        }

        this.conversacionActual = conversacion;
        this.mensajesActuales = conversacion.mensajes;

        try {
            this.mostrarLoading('mensajes');
            
            // Mostrar interfaz de conversación
            document.getElementById('header-conversacion')?.classList.remove('hidden');
            document.getElementById('form-respuesta')?.classList.remove('hidden');
            document.getElementById('empty-state')?.classList.add('hidden');
            document.getElementById('mensajes-conversacion')?.classList.remove('hidden');

            // Actualizar header
            const nombreElement = document.getElementById('nombre-conversacion');
            const rolElement = document.getElementById('rol-conversacion');
            
            if (nombreElement) nombreElement.textContent = conversacion.contacto_nombre;
            if (rolElement) rolElement.textContent = 'Profesor';

            // Renderizar mensajes
            this.renderizarMensajes();
            this.ocultarLoading('mensajes');

            // Marcar mensajes como leídos
            await this.marcarMensajesComoLeidos(conversacion.mensajes);

            // Scroll al último mensaje
            this.scrollToBottom(false);

        } catch (error) {
            this.ocultarLoading('mensajes');
            this.manejarError(error, 'abrir conversación');
        }
    }

    async enviarRespuesta() {
        const input = document.getElementById('input-mensaje');
        if (!input || !this.conversacionActual) return;

        const mensaje = input.value.trim();
        
        // Validaciones mejoradas
        if (!this.validarMensaje(mensaje)) return;
        
        // Crear ID temporal para el mensaje
        const mensajeTempId = `temp_${Date.now()}`;
        
        try {
            // Mostrar estado de envío
            this.agregarMensajeTemp(mensajeTempId, mensaje, 'enviando');
            
            // Deshabilitar input y botón
            this.toggleInputState(false);
            
            // ✅ FIX CORREGIDO: Usar apiClient.post directamente
            const response = await window.apiClient.post('/mensajes', {
                destinatario_id: this.conversacionActual.contacto_id,
                mensaje: mensaje
            });

            if (response.success) {
                // ✅ FIX: Eliminar mensaje temporal inmediatamente
                const tempElement = document.getElementById(`mensaje-${mensajeTempId}`);
                if (tempElement) tempElement.remove();
                
                // Limpiar input
                input.value = '';
                this.actualizarContadorCaracteres(0);
                this.toggleBotonEnvio('');
                
                // Notificar éxito
                this.notificar('Mensaje enviado', 'success');
                
                // ✅ FIX: Recargar conversaciones y reabrir conversación para evitar duplicados
                await this.cargarConversaciones();
                await this.abrirConversacion(this.conversacionActual.contacto_id);
                
            } else {
                throw new Error('Error en respuesta del servidor');
            }
            
        } catch (error) {
            // Marcar mensaje como error
            this.marcarMensajeError(mensajeTempId);
            this.manejarError(error, 'enviar mensaje');
            
        } finally {
            // Rehabilitar input
            this.toggleInputState(true);
        }
    }

    // ============================================
    // MANEJO DE ERRORES ROBUSTO
    // ============================================

    async fetchConReintentos(endpoint, options = {}, maxIntentos = CONFIG_MENSAJERIA.MAX_REINTENTOS) {
        for (let intento = 1; intento <= maxIntentos; intento++) {
            try {
                // Verificar conexión antes de intentar
                if (!navigator.onLine) {
                    throw new Error('network');
                }

                // ✅ FIX CORREGIDO: Usar métodos específicos de apiClient
                const metodo = options.method || 'GET';
                let response;

                switch (metodo) {
                    case 'POST':
                        response = await window.apiClient.post(endpoint, options.body || {});
                        break;
                    case 'PUT':
                        response = await window.apiClient.put(endpoint, options.body || {});
                        break;
                    case 'DELETE':
                        response = await window.apiClient.delete(endpoint);
                        break;
                    default:
                        response = await window.apiClient.get(endpoint);
                        break;
                }

                return response;
                
            } catch (error) {
                console.warn(`Intento ${intento} falló para ${endpoint}:`, error);
                
                if (intento === maxIntentos) {
                    throw error;
                }
                
                // Esperar con backoff exponencial
                await this.esperarConExponencial(intento);
            }
        }
    }

    esperarConExponencial(intento) {
        const delay = Math.min(1000 * Math.pow(2, intento), 10000);
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    manejarError(error, contexto) {
        console.error(`Error en ${contexto}:`, error);
        
        let mensaje = 'Ocurrió un error inesperado';
        
        if (error.status) {
            mensaje = MENSAJES_ERROR[error.status] || mensaje;
        } else if (!navigator.onLine) {
            mensaje = MENSAJES_ERROR.network;
        } else if (error.name === 'TimeoutError') {
            mensaje = MENSAJES_ERROR.timeout;
        } else if (error.message === 'network') {
            mensaje = MENSAJES_ERROR.network;
        }
        
        this.notificar(mensaje, 'error');
    }

    // ============================================
    // SISTEMA DE NOTIFICACIONES
    // ============================================

    notificar(mensaje, tipo) {
        // Intentar usar toastManager primero, luego fallback interno
        if (window.toastManager && typeof window.toastManager.mostrar === 'function') {
            window.toastManager.mostrar(mensaje, tipo);
        } else {
            this.notificadorInterno.mostrar(mensaje, tipo);
        }
    }

    // ============================================
    // VALIDACIONES MEJORADAS
    // ============================================

    validarMensaje(mensaje) {
        if (!mensaje || mensaje.trim() === '') {
            this.notificar('El mensaje no puede estar vacío', 'warning');
            return false;
        }
        
        if (mensaje.length > CONFIG_MENSAJERIA.MAX_CARACTERES) {
            this.notificar(
                `El mensaje es demasiado largo (máx. ${CONFIG_MENSAJERIA.MAX_CARACTERES} caracteres)`, 
                'warning'
            );
            return false;
        }
        
        return true;
    }

    actualizarContadorCaracteres(longitud) {
        const contador = document.getElementById('char-count');
        if (!contador) return;
        
        contador.textContent = `${longitud}/${CONFIG_MENSAJERIA.MAX_CARACTERES}`;
        
        // Cambiar color si se acerca al límite
        if (longitud > CONFIG_MENSAJERIA.MAX_CARACTERES * 0.9) {
            contador.classList.add('text-red-500');
            contador.classList.remove('text-gray-500', 'text-yellow-500');
        } else if (longitud > CONFIG_MENSAJERIA.MAX_CARACTERES * 0.75) {
            contador.classList.add('text-yellow-500');
            contador.classList.remove('text-gray-500', 'text-red-500');
        } else {
            contador.classList.add('text-gray-500');
            contador.classList.remove('text-red-500', 'text-yellow-500');
        }
    }

    toggleBotonEnvio(mensaje) {
        const boton = document.getElementById('btn-enviar-respuesta');
        if (!boton) return;
        
        const habilitado = mensaje.length > 0 && mensaje.length <= CONFIG_MENSAJERIA.MAX_CARACTERES;
        boton.disabled = !habilitado;
        
        if (habilitado) {
            boton.classList.remove('opacity-50', 'cursor-not-allowed');
            boton.classList.add('hover:bg-primary-700');
        } else {
            boton.classList.add('opacity-50', 'cursor-not-allowed');
            boton.classList.remove('hover:bg-primary-700');
        }
    }

    toggleInputState(habilitado) {
        const input = document.getElementById('input-mensaje');
        const boton = document.getElementById('btn-enviar-respuesta');
        
        if (input) {
            input.disabled = !habilitado;
            input.placeholder = habilitado ? 'Escribe tu mensaje...' : 'Enviando mensaje...';
        }
        
        if (boton) {
            if (!habilitado) {
                boton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                boton.disabled = true;
            } else {
                boton.innerHTML = '<i class="fas fa-paper-plane"></i>';
                // El estado del botón se actualizará con toggleBotonEnvio
            }
        }
    }

    // ============================================
    // ESTADOS DE CARGA Y UI
    // ============================================

    mostrarLoading(tipo) {
        switch (tipo) {
            case 'global':
                // Podría mostrar un overlay global
                break;
                
            case 'conversaciones':
                const lista = document.getElementById('lista-conversaciones');
                if (lista) {
                    lista.innerHTML = this.generarSkeletonConversaciones();
                }
                break;
                
            case 'mensajes':
                const contenedor = document.getElementById('mensajes-conversacion');
                if (contenedor) {
                    contenedor.innerHTML = this.generarSkeletonMensajes();
                }
                break;
        }
    }

    ocultarLoading(tipo) {
        // Los skeletons se reemplazan automáticamente al renderizar contenido
    }

    generarSkeletonConversaciones() {
        return Array.from({ length: 5 }, () => `
            <div class="p-4 animate-pulse">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-gray-300 rounded-full"></div>
                    <div class="flex-1">
                        <div class="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                        <div class="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    generarSkeletonMensajes() {
        return Array.from({ length: 8 }, (_, i) => {
            const esMio = i % 2 === 0;
            return `
                <div class="flex ${esMio ? 'justify-end' : 'justify-start'} mb-4">
                    <div class="max-w-[70%]">
                        <div class="${esMio ? 'bg-gray-300' : 'bg-gray-200'} rounded-2xl px-4 py-3 w-32 h-10"></div>
                        <div class="h-3 bg-gray-200 rounded w-16 mt-1 ${esMio ? 'ml-auto' : ''}"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    mostrarEstadoVacio(tipo) {
        const lista = document.getElementById('lista-conversaciones');
        if (!lista) return;

        if (tipo === 'error') {
            lista.innerHTML = `
                <div class="p-8 text-center">
                    <i class="fas fa-exclamation-circle text-3xl text-red-500 mb-2"></i>
                    <p class="text-gray-500 dark:text-gray-400 mb-2">Error cargando conversaciones</p>
                    <button onclick="mensajeriaManager.cargarConversaciones()" 
                            class="text-sm text-primary-600 hover:text-primary-700">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }

    // ============================================
    // MANEJO DE MENSAJES TEMPORALES
    // ============================================

    agregarMensajeTemp(id, mensaje, estado) {
        const contenedor = document.getElementById('mensajes-conversacion');
        if (!contenedor) return;

        const mensajeElement = document.createElement('div');
        mensajeElement.id = `mensaje-${id}`;
        mensajeElement.className = 'flex justify-end mb-4 animate-fade-in';
        mensajeElement.innerHTML = `
            <div class="max-w-[70%]">
                <div class="bg-primary-600 text-white rounded-2xl px-4 py-3 shadow-sm opacity-80">
                    <p class="text-sm">${this.escaparHTML(mensaje)}</p>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                    ${estado === 'enviando' ? 'Enviando...' : 'Error al enviar'}
                </p>
            </div>
        `;

        contenedor.appendChild(mensajeElement);
        this.scrollToBottom(true);
    }

    reemplazarMensajeTemp(tempId, mensajeReal) {
        // ✅ FIX: Ya no reemplazamos, solo eliminamos el temporal
        // El mensaje real vendrá del servidor en la siguiente carga
        const elemento = document.getElementById(`mensaje-${tempId}`);
        if (elemento) {
            elemento.remove();
        }
    }

    marcarMensajeError(tempId) {
        const elemento = document.getElementById(`mensaje-${tempId}`);
        if (!elemento) return;

        const mensajeDiv = elemento.querySelector('.bg-primary-600');
        if (mensajeDiv) {
            mensajeDiv.classList.remove('bg-primary-600');
            mensajeDiv.classList.add('bg-red-500');
        }

        const textoEstado = elemento.querySelector('.text-xs');
        if (textoEstado) {
            textoEstado.textContent = 'Error al enviar. Intenta nuevamente.';
            textoEstado.classList.add('text-red-500');
        }
    }

    // ============================================
    // SCROLL MEJORADO
    // ============================================

    scrollToBottom(suave = true) {
        const contenedor = document.getElementById('contenedor-mensajes');
        if (!contenedor) return;
        
        if (suave && CONFIG_MENSAJERIA.ANIMACION_SCROLL) {
            contenedor.scrollTo({
                top: contenedor.scrollHeight,
                behavior: 'smooth'
            });
        } else {
            contenedor.scrollTop = contenedor.scrollHeight;
        }
    }

    // ============================================
    // POLLING INTELIGENTE
    // ============================================

    iniciarPolling() {
        // Limpiar intervalo existente
        this.detenerPolling();
        
        this.pollingInterval = setInterval(() => {
            if (document.visibilityState === 'visible' && navigator.onLine) {
                this.actualizarConversaciones();
            }
        }, CONFIG_MENSAJERIA.POLLING_INTERVAL);
    }

    detenerPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    async actualizarConversaciones() {
        try {
            const response = await this.fetchConReintentos('/mensajes');
            
            if (response.success && response.data?.data) {
                const nuevasConversaciones = this.agruparMensajesPorContacto(response.data.data);
                
                // Solo actualizar si hay cambios
                if (JSON.stringify(this.conversaciones) !== JSON.stringify(nuevasConversaciones)) {
                    this.conversaciones = nuevasConversaciones;
                    this.renderizarConversaciones();
                    
                    // Si hay una conversación abierta, actualizar los mensajes
                    if (this.conversacionActual) {
                        const conversacionActualizada = this.conversaciones.find(
                            c => c.contacto_id === this.conversacionActual.contacto_id
                        );
                        if (conversacionActualizada) {
                            this.conversacionActual = conversacionActualizada;
                            this.mensajesActuales = conversacionActualizada.mensajes;
                            this.renderizarMensajes();
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('Error en polling:', error);
        }
    }

    // ============================================
    // MÉTODOS EXISTENTES (modificados ligeramente)
    // ============================================

    renderizarSelectorProfesores() {
        const select = document.getElementById('select-destinatario');
        if (!select || this.profesores.length === 0) return;

        select.innerHTML = '<option value="">Selecciona un profesor...</option>';
        
        this.profesores.forEach(profesor => {
            const option = document.createElement('option');
            option.value = profesor.id;
            option.textContent = `${profesor.nombre} (${profesor.correo})`;
            select.appendChild(option);
        });
    }

    agruparMensajesPorContacto(mensajes) {
        const grupos = {};
        const usuarioActualId = this.obtenerUsuarioId();

        mensajes.forEach(mensaje => {
            const contactoId = mensaje.remitente_id === usuarioActualId 
                ? mensaje.destinatario_id 
                : mensaje.remitente_id;

            if (!grupos[contactoId]) {
                grupos[contactoId] = {
                    contacto_id: contactoId,
                    contacto_nombre: mensaje.nombre_contacto,
                    mensajes: [],
                    ultimo_mensaje: null,
                    no_leidos: 0
                };
            }

            grupos[contactoId].mensajes.push(mensaje);
            
            if (!grupos[contactoId].ultimo_mensaje || 
                new Date(mensaje.creado_en) > new Date(grupos[contactoId].ultimo_mensaje.creado_en)) {
                grupos[contactoId].ultimo_mensaje = mensaje;
            }

            if (mensaje.destinatario_id === usuarioActualId && !mensaje.leido) {
                grupos[contactoId].no_leidos++;
            }
        });

        return Object.values(grupos).sort((a, b) => {
            const fechaA = new Date(a.ultimo_mensaje.creado_en);
            const fechaB = new Date(b.ultimo_mensaje.creado_en);
            return fechaB - fechaA;
        });
    }

    renderizarConversaciones() {
        const lista = document.getElementById('lista-conversaciones');
        if (!lista) return;

        if (this.conversaciones.length === 0) {
            lista.innerHTML = `
                <div class="p-8 text-center">
                    <div class="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                        <i class="fas fa-inbox text-2xl text-gray-400"></i>
                    </div>
                    <p class="text-gray-500 dark:text-gray-400">No tienes conversaciones</p>
                    <button onclick="mensajeriaManager.abrirModalNuevoMensaje()" 
                            class="mt-3 text-sm text-primary-600 hover:text-primary-700">
                        Enviar tu primer mensaje
                    </button>
                </div>
            `;
            return;
        }

        lista.innerHTML = this.conversaciones.map(conv => {
            const ultimoMensaje = conv.ultimo_mensaje;
            const preview = ultimoMensaje.mensaje.substring(0, 50) + 
                          (ultimoMensaje.mensaje.length > 50 ? '...' : '');
            
            return `
                <div class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                    conv.no_leidos > 0 ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }" onclick="mensajeriaManager.abrirConversacion(${conv.contacto_id})">
                    <div class="flex items-start gap-3">
                        <div class="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                            <i class="fas fa-user text-primary-600 dark:text-primary-400"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between mb-1">
                                <h4 class="font-medium text-gray-900 dark:text-white truncate">
                                    ${conv.contacto_nombre}
                                </h4>
                                ${conv.no_leidos > 0 ? 
                                    `<span class="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">${conv.no_leidos}</span>` : 
                                    ''
                                }
                            </div>
                            <p class="text-sm text-gray-600 dark:text-gray-400 truncate">${preview}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                ${this.formatearFecha(ultimoMensaje.creado_en)}
                            </p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderizarMensajes() {
        const contenedor = document.getElementById('mensajes-conversacion');
        if (!contenedor) return;

        const usuarioId = this.obtenerUsuarioId();

        // ✅ FIX: Ordenar mensajes de más antiguo a más reciente (ascendente)
        const mensajesOrdenados = [...this.mensajesActuales].sort((a, b) => {
            return new Date(a.creado_en) - new Date(b.creado_en);
        });

        contenedor.innerHTML = mensajesOrdenados.map(mensaje => {
            const esMio = mensaje.remitente_id === usuarioId;
            const estado = this.estadoEnvio.get(mensaje.id) || 'enviado';
            
            return `
                <div class="flex ${esMio ? 'justify-end' : 'justify-start'} mb-4">
                    <div class="max-w-[70%]">
                        <div class="${
                            esMio ? 
                                estado === 'error' ? 'bg-red-500 text-white' : 'bg-primary-600 text-white' :
                                'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                        } rounded-2xl px-4 py-3 shadow-sm">
                            <p class="text-sm">${this.escaparHTML(mensaje.mensaje)}</p>
                        </div>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 ${
                            esMio ? 'text-right' : 'text-left'
                        }">
                            ${this.formatearFecha(mensaje.creado_en)}
                            ${esMio && estado === 'enviando' ? ' • Enviando...' : ''}
                            ${esMio && estado === 'error' ? ' • Error' : ''}
                        </p>
                    </div>
                </div>
            `;
        }).join('');
    }

    async marcarMensajesComoLeidos(mensajes) {
        const usuarioId = this.obtenerUsuarioId();
        const mensajesNoLeidos = mensajes.filter(m => 
            m.destinatario_id === usuarioId && !m.leido
        );

        for (const mensaje of mensajesNoLeidos) {
            try {
                await window.apiClient.post(`/mensajes/${mensaje.id}/marcar-leido`);
                mensaje.leido = true;
            } catch (error) {
                console.error('Error marcando mensaje como leído:', error);
            }
        }

        if (this.conversacionActual) {
            this.conversacionActual.no_leidos = 0;
            this.renderizarConversaciones();
        }
    }

    abrirModalNuevoMensaje() {
        const modal = document.getElementById('modal-nuevo-mensaje');
        if (modal) {
            modal.classList.remove('hidden');
            // Enfocar el primer campo
            const select = document.getElementById('select-destinatario');
            if (select) select.focus();
        }
    }

    cerrarModal() {
        const modal = document.getElementById('modal-nuevo-mensaje');
        if (modal) {
            modal.classList.add('hidden');
        }

        const form = document.getElementById('form-nuevo-mensaje');
        if (form) form.reset();
    }

    async enviarNuevoMensaje() {
        const select = document.getElementById('select-destinatario');
        const textarea = document.getElementById('textarea-mensaje');

        if (!select || !textarea) return;

        const destinatarioId = parseInt(select.value);
        const mensaje = textarea.value.trim();

        if (!destinatarioId || !mensaje) {
            this.notificar('Completa todos los campos', 'warning');
            return;
        }

        if (!this.validarMensaje(mensaje)) return;

        try {
            this.toggleInputState(false);
            
            // ✅ FIX CORREGIDO: Usar apiClient.post directamente
            const response = await window.apiClient.post('/mensajes', {
                destinatario_id: destinatarioId,
                mensaje: mensaje
            });

            if (response.success) {
                this.cerrarModal();
                this.notificar('Mensaje enviado exitosamente', 'success');
                
                await this.cargarConversaciones();
                await this.abrirConversacion(destinatarioId);
            } else {
                throw new Error('Error en respuesta del servidor');
            }
            
        } catch (error) {
            this.manejarError(error, 'enviar nuevo mensaje');
        } finally {
            this.toggleInputState(true);
        }
    }

    verificarMensajeEnURL() {
        const params = new URLSearchParams(window.location.search);
        const mensajeId = params.get('id');

        if (mensajeId) {
            for (const conv of this.conversaciones) {
                const mensaje = conv.mensajes.find(m => m.id === parseInt(mensajeId));
                if (mensaje) {
                    this.abrirConversacion(conv.contacto_id);
                    break;
                }
            }
        }
    }

    obtenerUsuarioId() {
        try {
            const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
            return usuario.id || 0;
        } catch {
            return 0;
        }
    }

    // ============================================
    // SOLUCIÓN SIMPLE Y EFECTIVA PARA FECHAS
    // ============================================

    formatearFecha(fecha) {
        const ahora = new Date();
        
        // ✅ Parsear la fecha como UTC y obtener timestamp
        const fechaObj = new Date(fecha);
        
        // Calcular diferencia en milisegundos
        const diff = ahora - fechaObj;

        const minutos = Math.floor(diff / 60000);
        const horas = Math.floor(diff / 3600000);
        const dias = Math.floor(diff / 86400000);

        // DEBUG: Descomentar para ver cálculos
        // console.log('Ahora:', ahora, 'Mensaje:', fechaObj, 'Diff mins:', minutos);

        if (minutos < 1) return 'Ahora';
        if (minutos < 60) return `Hace ${minutos}m`;
        if (horas < 24) return `Hace ${horas}h`;
        if (dias === 1) return 'Ayer';
        if (dias < 7) return `Hace ${dias}d`;
        
        // Mostrar fecha formateada para mensajes antiguos
        return fechaObj.toLocaleString('es-MX', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    escaparHTML(texto) {
        const div = document.createElement('div');
        div.textContent = texto;
        return div.innerHTML;
    }
}

// ============================================
// INICIALIZACIÓN MEJORADA
// ============================================

let mensajeriaManager;

document.addEventListener('DOMContentLoaded', () => {
    // Agregar estilos CSS para animaciones
    const styles = document.createElement('style');
    styles.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(-10px); }
        }
        .animate-fade-in {
            animation: fadeIn 0.3s ease-in-out;
        }
    `;
    document.head.appendChild(styles);

    // Inicialización con verificación robusta
    const iniciarMensajeria = () => {
        if (window.apiClient) {
            mensajeriaManager = new MensajeriaManager();
        } else {
            console.warn('⚠️ apiClient no disponible, reintentando...');
            setTimeout(iniciarMensajeria, 500);
        }
    };

    // Esperar a que la página esté completamente cargada
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciarMensajeria);
    } else {
        iniciarMensajeria();
    }
});

// Exponer globalmente para acceso desde HTML
window.mensajeriaManager = mensajeriaManager;