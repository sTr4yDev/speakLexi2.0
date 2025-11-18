/* ============================================
   SPEAKLEXI - GESTIÓN DE RETROALIMENTACIÓN (PROFESOR) - CON SISTEMA DE MENSAJERÍA
   Archivo: assets/js/pages/profesor/retroalimentacion-profesor.js
   UC-14: Gestionar retroalimentación + Sistema de Mensajería Integrado
   ============================================ */

class RetroalimentacionProfesor {
    constructor() {
        this.API_URL = window.APP_CONFIG?.API?.API_URL || 'http://localhost:5000/api';
        this.token = localStorage.getItem('token');
        this.estado = {
            estudiantes: [],
            retroalimentaciones: [],
            estudianteSeleccionado: null,
            // Estado para mensajería
            mensajeria: {
                conversaciones: [],
                conversacionActual: null,
                mensajesActuales: [],
                estudianteMensaje: null
            },
            filtroBusqueda: ''
        };
        this.init();
    }

    async init() {
        try {
            console.log('✅ Módulo Retroalimentación Profesor iniciando...');
            
            await this.verificarAutenticacion();
            await this.cargarDatosCompletos();
            this.configurarEventListeners();
            
            console.log('✅ Módulo Retroalimentación Profesor listo');
        } catch (error) {
            console.error('💥 Error inicializando módulo:', error);
            this.mostrarError('Error al cargar el módulo de retroalimentación');
        }
    }

    async verificarAutenticacion() {
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
        
        if (!usuario || !usuario.id) {
            window.location.href = '/pages/auth/login.html';
            throw new Error('Usuario no autenticado');
        }

        if (usuario.rol !== 'profesor' && usuario.rol !== 'admin') {
            window.location.href = '/pages/estudiante/dashboard.html';
            throw new Error('Acceso denegado: rol no autorizado');
        }

        if (!this.token) {
            window.location.href = '/pages/auth/login.html';
            throw new Error('Token no disponible');
        }
    }

    // ELEMENTOS DOM
    get elementos() {
        return {
            // Panel lateral - Lista de Alumnos
            listaAlumnos: document.getElementById('lista-alumnos'),
            buscadorAlumnos: document.getElementById('buscador-alumnos'),
            loadingAlumnos: document.getElementById('loading-alumnos'),
            estadoVacioAlumnos: document.getElementById('estado-vacio-alumnos'),
            
            // Panel de Mensajería
            panelMensajeria: document.getElementById('panel-mensajeria'),
            headerConversacion: document.getElementById('header-conversacion'),
            nombreConversacion: document.getElementById('nombre-conversacion'),
            rolConversacion: document.getElementById('rol-conversacion'),
            contenedorMensajes: document.getElementById('contenedor-mensajes'),
            mensajesConversacion: document.getElementById('mensajes-conversacion'),
            formRespuesta: document.getElementById('form-respuesta'),
            inputMensaje: document.getElementById('input-mensaje'),
            btnEnviarRespuesta: document.getElementById('btn-enviar-respuesta'),
            charCount: document.getElementById('char-count'),
            emptyState: document.getElementById('empty-state'),
            loadingMensajes: document.getElementById('loading-mensajes'),
            
            // Panel de Retroalimentación
            panelRetroalimentacion: document.getElementById('panel-retroalimentacion'),
            alumnoSeleccionadoNombre: document.getElementById('alumno-seleccionado-nombre'),
            alumnoSeleccionadoNivel: document.getElementById('alumno-seleccionado-nivel'),
            loadingRetroalimentacion: document.getElementById('loading-retroalimentacion'),
            estadoVacioAlumno: document.getElementById('estado-vacio-alumno'),
            listaRetroalimentacionAlumno: document.getElementById('lista-retroalimentacion-alumno'),
            
            // Botones
            btnNuevoComentario: document.getElementById('btn-nuevo-comentario'),
            btnNuevoPrimerComentario: document.getElementById('btn-nuevo-primer-comentario'),
            btnNuevoMensaje: document.getElementById('btn-nuevo-mensaje'),
            
            // Modal Nuevo Mensaje
            modalNuevoMensaje: document.getElementById('modal-nuevo-mensaje'),
            btnCerrarModal: document.getElementById('btn-cerrar-modal'),
            formNuevoMensaje: document.getElementById('form-nuevo-mensaje'),
            selectDestinatario: document.getElementById('select-destinatario'),
            textareaMensaje: document.getElementById('textarea-mensaje'),
            btnEnviarModal: document.getElementById('btn-enviar-modal'),
            btnCancelarModal: document.getElementById('btn-cancelar-modal'),

            // Estados globales
            loadingGlobal: document.getElementById('loading-global'),
            errorGlobal: document.getElementById('error-global'),
            contenidoPrincipal: document.getElementById('contenido-principal')
        };
    }

    // ============================================
    // CARGA DE DATOS
    // ============================================

    async cargarDatosCompletos() {
        try {
            this.mostrarCargandoGlobal(true);
            this.ocultarErrorGlobal();
            this.ocultarContenidoPrincipal();

            console.log('🔄 Cargando datos completos...');

            // ✅ CARGAR TODOS LOS ESTUDIANTES SIN FILTRO
            await Promise.all([
                this.cargarTodosLosEstudiantes(),
                this.cargarConversaciones()
            ]);

            console.log('✅ Datos cargados:', {
                estudiantes: this.estado.estudiantes.length,
                conversaciones: this.estado.mensajeria.conversaciones.length
            });

            this.renderizarListaAlumnos();
            this.mostrarContenidoPrincipal();
            
        } catch (error) {
            console.error('❌ Error cargando datos completos:', error);
            this.mostrarErrorGlobal('Error al cargar los datos. Verifica tu conexión e intenta nuevamente.');
        } finally {
            this.mostrarCargandoGlobal(false);
        }
    }

    async cargarTodosLosEstudiantes() {
        try {
            console.log('👥 Cargando TODOS los estudiantes...');
            
            // ✅ ENDPOINT ESPECÍFICO PARA OBTENER TODOS LOS ESTUDIANTES
            const response = await fetch(`${this.API_URL}/profesor/estudiantes`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                
                if (result.success && result.data) {
                    this.estado.estudiantes = result.data;
                    console.log(`✅ ${this.estado.estudiantes.length} estudiantes cargados`);
                } else {
                    throw new Error('Formato de respuesta inválido');
                }
            } else {
                // Si falla, usar datos de ejemplo
                throw new Error(`Error ${response.status}`);
            }

        } catch (error) {
            console.error('❌ Error cargando estudiantes, usando datos de ejemplo:', error);
            // Datos de ejemplo para desarrollo con TODOS los alumnos
            this.estado.estudiantes = this.generarTodosLosEstudiantesEjemplo();
        }
    }

    async cargarConversaciones() {
        try {
            console.log('💬 Cargando conversaciones...');
            
            const response = await fetch(`${this.API_URL}/mensajes`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error(`Error ${response.status}`);

            const result = await response.json();
            
            if (result.success && result.data?.data) {
                this.estado.mensajeria.conversaciones = this.agruparMensajesPorEstudiante(result.data.data);
                console.log(`✅ ${this.estado.mensajeria.conversaciones.length} conversaciones cargadas`);
            }

        } catch (error) {
            console.error('❌ Error cargando conversaciones:', error);
            this.estado.mensajeria.conversaciones = [];
        }
    }

    // ============================================
    // RENDERIZADO - LISTA DE ALUMNOS
    // ============================================

    renderizarListaAlumnos() {
        const elementos = this.elementos;
        if (!elementos.listaAlumnos || !elementos.estadoVacioAlumnos) return;

        const alumnosFiltrados = this.filtrarAlumnos();

        if (alumnosFiltrados.length === 0) {
            elementos.estadoVacioAlumnos.classList.remove('hidden');
            elementos.listaAlumnos.innerHTML = '';
            return;
        }

        elementos.estadoVacioAlumnos.classList.add('hidden');

        elementos.listaAlumnos.innerHTML = alumnosFiltrados.map(alumno => {
            const nombreCompleto = alumno.nombre_completo || 
                                  `${alumno.nombre || ''} ${alumno.primer_apellido || ''}`.trim();
            const iniciales = nombreCompleto.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            
            // Buscar si hay conversación con este alumno
            const conversacion = this.estado.mensajeria.conversaciones.find(c => c.estudiante_id === alumno.id);
            const mensajesNoLeidos = conversacion?.no_leidos || 0;
            const ultimoMensaje = conversacion?.ultimo_mensaje;

            return `
                <div class="p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                     data-alumno-id="${alumno.id}">
                    <div class="flex items-start gap-3">
                        <!-- Avatar -->
                        <div class="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
                            ${iniciales}
                        </div>
                        
                        <!-- Información del alumno -->
                        <div class="flex-1 min-w-0">
                            <div class="flex items-start justify-between mb-1">
                                <h3 class="font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary-600 transition-colors">
                                    ${nombreCompleto}
                                </h3>
                                ${mensajesNoLeidos > 0 ? `
                                    <span class="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full flex-shrink-0">
                                        ${mensajesNoLeidos}
                                    </span>
                                ` : ''}
                            </div>
                            
                            <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                <span class="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs rounded-full font-medium">
                                    ${alumno.nivel_actual || alumno.nivel || 'A1'}
                                </span>
                                <span class="mx-2">•</span>
                                ${alumno.idioma_aprendizaje || alumno.idioma || 'Inglés'}
                            </p>
                            
                            <!-- Información de progreso -->
                            <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                <span class="flex items-center gap-1">
                                    <i class="fas fa-star text-yellow-500"></i>
                                    ${alumno.total_xp || 0} XP
                                </span>
                                <span class="flex items-center gap-1">
                                    <i class="fas fa-check-circle text-green-500"></i>
                                    ${alumno.lecciones_completadas || 0} lecciones
                                </span>
                            </div>
                            
                            <!-- Último mensaje (si existe) -->
                            ${ultimoMensaje ? `
                                <div class="mt-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-600">
                                    <p class="text-xs text-gray-600 dark:text-gray-400 truncate">
                                        <strong>Último mensaje:</strong> ${ultimoMensaje.mensaje.substring(0, 50)}${ultimoMensaje.mensaje.length > 50 ? '...' : ''}
                                    </p>
                                    <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                        ${this.formatearFecha(ultimoMensaje.creado_en)}
                                    </p>
                                </div>
                            ` : ''}
                            
                            <!-- Botones de acción -->
                            <div class="flex gap-2 mt-3">
                                <button class="flex-1 px-3 py-1 bg-primary-600 text-white text-xs rounded hover:bg-primary-700 transition-colors flex items-center justify-center gap-1"
                                        onclick="event.stopPropagation(); retroalimentacionProfesor.enviarMensajeAlumno(${alumno.id})">
                                    <i class="fas fa-paper-plane text-xs"></i>
                                    Mensaje
                                </button>
                                <button class="flex-1 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                                        onclick="event.stopPropagation(); retroalimentacionProfesor.verRetroalimentacion(${alumno.id})">
                                    <i class="fas fa-comment text-xs"></i>
                                    Retroalimentación
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.configurarEventListenersAlumnos();
    }

    filtrarAlumnos() {
        return this.estado.estudiantes.filter(alumno => {
            const nombreCompleto = (alumno.nombre_completo || `${alumno.nombre || ''} ${alumno.primer_apellido || ''}`).toLowerCase();
            const nivel = alumno.nivel_actual || alumno.nivel || '';
            const busqueda = this.estado.filtroBusqueda.toLowerCase();
            
            return nombreCompleto.includes(busqueda) || 
                   nivel.toLowerCase().includes(busqueda);
        });
    }

    // ============================================
    // SISTEMA DE MENSAJERÍA INTEGRADO - SIMPLIFICADO
    // ============================================

    async enviarMensajeAlumno(alumnoId) {
        const alumno = this.estado.estudiantes.find(e => e.id === alumnoId);
        if (!alumno) return;

        // Abrir modal de nuevo mensaje con el alumno pre-seleccionado
        this.abrirModalNuevoMensaje(alumno);
    }

    abrirModalNuevoMensaje(alumnoPreSeleccionado = null) {
        const elementos = this.elementos;
        if (!elementos.modalNuevoMensaje) return;

        // Llenar selector de destinatarios con TODOS los alumnos
        this.actualizarSelectorDestinatarios();

        // Si hay un alumno pre-seleccionado, seleccionarlo
        if (alumnoPreSeleccionado && elementos.selectDestinatario) {
            elementos.selectDestinatario.value = alumnoPreSeleccionado.id;
        }

        elementos.modalNuevoMensaje.classList.remove('hidden');
        elementos.textareaMensaje?.focus();
    }

    actualizarSelectorDestinatarios() {
        const elementos = this.elementos;
        if (!elementos.selectDestinatario) return;

        elementos.selectDestinatario.innerHTML = '<option value="">Selecciona un alumno...</option>';
        
        // ✅ MOSTRAR TODOS LOS ESTUDIANTES SIN FILTRAR
        this.estado.estudiantes.forEach(alumno => {
            const nombreCompleto = alumno.nombre_completo || 
                                  `${alumno.nombre || ''} ${alumno.primer_apellido || ''}`.trim();
            const nivel = alumno.nivel_actual || alumno.nivel || 'A1';
            
            const option = document.createElement('option');
            option.value = alumno.id;
            option.textContent = `${nombreCompleto} (${nivel})`;
            elementos.selectDestinatario.appendChild(option);
        });
    }

    async abrirConversacion(alumnoId) {
        const alumno = this.estado.estudiantes.find(e => e.id === alumnoId);
        if (!alumno) return;

        // Mostrar panel de mensajería y ocultar retroalimentación
        this.mostrarPanelMensajeria();
        this.ocultarPanelRetroalimentacion();
        
        // Actualizar header de conversación
        if (this.elementos.nombreConversacion) {
            const nombreCompleto = alumno.nombre_completo || 
                                  `${alumno.nombre || ''} ${alumno.primer_apellido || ''}`.trim();
            this.elementos.nombreConversacion.textContent = nombreCompleto;
        }
        if (this.elementos.rolConversacion) {
            this.elementos.rolConversacion.textContent = `Alumno - ${alumno.nivel_actual || alumno.nivel || 'A1'}`;
        }

        // Establecer conversación actual
        this.estado.mensajeria.conversacionActual = {
            estudiante_id: alumnoId,
            estudiante_nombre: nombreCompleto
        };

        // Cargar mensajes de la conversación
        await this.cargarMensajesConversacion(alumnoId);
        
        // Ocultar estado vacío
        if (this.elementos.emptyState) {
            this.elementos.emptyState.classList.add('hidden');
        }
        
        // Mostrar mensajes y formulario
        if (this.elementos.mensajesConversacion) {
            this.elementos.mensajesConversacion.classList.remove('hidden');
        }
        if (this.elementos.formRespuesta) {
            this.elementos.formRespuesta.classList.remove('hidden');
        }
    }

    async cargarMensajesConversacion(alumnoId) {
        try {
            this.mostrarLoadingMensajes(true);
            
            const response = await fetch(`${this.API_URL}/mensajes/estudiante/${alumnoId}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error(`Error ${response.status}`);

            const result = await response.json();
            
            if (result.success && result.data) {
                this.estado.mensajeria.mensajesActuales = result.data;
                this.renderizarMensajes();
                this.scrollToBottom();
            }

        } catch (error) {
            console.error('❌ Error cargando mensajes:', error);
            this.estado.mensajeria.mensajesActuales = [];
        } finally {
            this.mostrarLoadingMensajes(false);
        }
    }

    renderizarMensajes() {
        const elementos = this.elementos;
        if (!elementos.mensajesConversacion) return;

        const usuarioId = this.obtenerUsuarioId();

        elementos.mensajesConversacion.innerHTML = this.estado.mensajeria.mensajesActuales.map(mensaje => {
            const esMio = mensaje.remitente_id === usuarioId;
            
            return `
                <div class="flex ${esMio ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in">
                    <div class="max-w-[70%]">
                        <div class="${esMio ? 
                            'bg-primary-600 text-white rounded-br-none' : 
                            'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'
                        } rounded-2xl px-4 py-3 shadow-sm border border-gray-200 dark:border-gray-600">
                            <p class="text-sm">${this.escaparHTML(mensaje.mensaje)}</p>
                        </div>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 ${
                            esMio ? 'text-right' : 'text-left'
                        }">
                            ${this.formatearFecha(mensaje.creado_en)}
                            ${mensaje.leido ? ' • Leído' : ''}
                        </p>
                    </div>
                </div>
            `;
        }).join('');
    }

    async enviarMensaje() {
        const elementos = this.elementos;
        const input = elementos.inputMensaje;
        
        if (!input || !this.estado.mensajeria.conversacionActual) return;

        const mensaje = input.value.trim();
        if (!mensaje) return;

        try {
            // Deshabilitar input temporalmente
            this.toggleInputMensaje(false);

            const alumnoId = this.estado.mensajeria.conversacionActual.estudiante_id;
            
            // ✅ ENVIAR MENSAJE CON LA MISMA LÓGICA
            const response = await fetch(`${this.API_URL}/mensajes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    destinatario_id: alumnoId,
                    mensaje: mensaje
                })
            });

            if (!response.ok) throw new Error(`Error ${response.status}`);

            const result = await response.json();
            
            if (result.success) {
                // Limpiar input
                input.value = '';
                this.actualizarContadorCaracteres(0);
                
                // Recargar mensajes
                await this.cargarMensajesConversacion(alumnoId);
                // Recargar conversaciones para actualizar lista
                await this.cargarConversaciones();
                this.renderizarListaAlumnos();
                
                this.mostrarExito('Mensaje enviado');
            }

        } catch (error) {
            console.error('❌ Error enviando mensaje:', error);
            this.mostrarError('Error al enviar el mensaje');
        } finally {
            this.toggleInputMensaje(true);
        }
    }

    async enviarNuevoMensaje() {
        const elementos = this.elementos;
        const select = elementos.selectDestinatario;
        const textarea = elementos.textareaMensaje;

        if (!select || !textarea) return;

        const alumnoId = parseInt(select.value);
        const mensaje = textarea.value.trim();

        if (!alumnoId || !mensaje) {
            this.mostrarError('Completa todos los campos');
            return;
        }

        try {
            elementos.btnEnviarModal.disabled = true;
            elementos.btnEnviarModal.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Enviando...';

            // ✅ ENVIAR MENSAJE CON LA MISMA LÓGICA
            const response = await fetch(`${this.API_URL}/mensajes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    destinatario_id: alumnoId,
                    mensaje: mensaje
                })
            });

            if (!response.ok) throw new Error(`Error ${response.status}`);

            const result = await response.json();
            
            if (result.success) {
                this.cerrarModalNuevoMensaje();
                this.mostrarExito('Mensaje enviado exitosamente');
                
                // Recargar conversaciones y lista
                await this.cargarConversaciones();
                this.renderizarListaAlumnos();
            }

        } catch (error) {
            console.error('❌ Error enviando mensaje:', error);
            this.mostrarError('Error al enviar el mensaje');
        } finally {
            elementos.btnEnviarModal.disabled = false;
            elementos.btnEnviarModal.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Enviar';
        }
    }

    // ============================================
    // FUNCIONES AUXILIARES
    // ============================================

    agruparMensajesPorEstudiante(mensajes) {
        const grupos = {};
        const usuarioId = this.obtenerUsuarioId();

        mensajes.forEach(mensaje => {
            const estudianteId = mensaje.remitente_id === usuarioId ? 
                mensaje.destinatario_id : mensaje.remitente_id;

            if (!grupos[estudianteId]) {
                grupos[estudianteId] = {
                    estudiante_id: estudianteId,
                    mensajes: [],
                    ultimo_mensaje: null,
                    no_leidos: 0
                };
            }

            grupos[estudianteId].mensajes.push(mensaje);
            
            if (!grupos[estudianteId].ultimo_mensaje || 
                new Date(mensaje.creado_en) > new Date(grupos[estudianteId].ultimo_mensaje.creado_en)) {
                grupos[estudianteId].ultimo_mensaje = mensaje;
            }

            if (mensaje.destinatario_id === usuarioId && !mensaje.leido) {
                grupos[estudianteId].no_leidos++;
            }
        });

        return Object.values(grupos);
    }

    obtenerUsuarioId() {
        try {
            const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
            return usuario.id || 0;
        } catch {
            return 0;
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
        if (minutos < 60) return `Hace ${minutos}m`;
        if (horas < 24) return `Hace ${horas}h`;
        if (dias === 1) return 'Ayer';
        if (dias < 7) return `Hace ${dias}d`;
        
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

    scrollToBottom() {
        const contenedor = this.elementos.contenedorMensajes;
        if (contenedor) {
            contenedor.scrollTop = contenedor.scrollHeight;
        }
    }

    toggleInputMensaje(habilitado) {
        const input = this.elementos.inputMensaje;
        const boton = this.elementos.btnEnviarRespuesta;
        
        if (input) {
            input.disabled = !habilitado;
            input.placeholder = habilitado ? 'Escribe tu mensaje...' : 'Enviando...';
        }
        
        if (boton) {
            boton.disabled = !habilitado;
        }
    }

    actualizarContadorCaracteres(longitud) {
        const contador = this.elementos.charCount;
        if (!contador) return;
        
        contador.textContent = `${longitud}/1000`;
        
        if (longitud > 900) {
            contador.classList.add('text-red-500');
        } else if (longitud > 750) {
            contador.classList.add('text-yellow-500');
        } else {
            contador.classList.add('text-gray-500');
        }
    }

    mostrarPanelMensajeria() {
        const elementos = this.elementos;
        if (elementos.panelMensajeria) {
            elementos.panelMensajeria.classList.remove('hidden');
        }
        if (elementos.headerConversacion) {
            elementos.headerConversacion.classList.remove('hidden');
        }
    }

    ocultarPanelRetroalimentacion() {
        const elementos = this.elementos;
        if (elementos.panelRetroalimentacion) {
            elementos.panelRetroalimentacion.classList.add('hidden');
        }
    }

    cerrarModalNuevoMensaje() {
        const elementos = this.elementos;
        if (elementos.modalNuevoMensaje) {
            elementos.modalNuevoMensaje.classList.add('hidden');
        }
        if (elementos.formNuevoMensaje) {
            elementos.formNuevoMensaje.reset();
        }
    }

    // ============================================
    // CONFIGURACIÓN DE EVENT LISTENERS
    // ============================================

    configurarEventListeners() {
        const elementos = this.elementos;

        // Búsqueda de alumnos
        if (elementos.buscadorAlumnos) {
            elementos.buscadorAlumnos.addEventListener('input', (e) => {
                this.estado.filtroBusqueda = e.target.value;
                this.renderizarListaAlumnos();
            });
        }

        // Botón nuevo mensaje
        if (elementos.btnNuevoMensaje) {
            elementos.btnNuevoMensaje.addEventListener('click', () => this.abrirModalNuevoMensaje());
        }

        // Modal nuevo mensaje
        if (elementos.btnCerrarModal) {
            elementos.btnCerrarModal.addEventListener('click', () => this.cerrarModalNuevoMensaje());
        }
        if (elementos.btnCancelarModal) {
            elementos.btnCancelarModal.addEventListener('click', () => this.cerrarModalNuevoMensaje());
        }

        // Form nuevo mensaje
        if (elementos.formNuevoMensaje) {
            elementos.formNuevoMensaje.addEventListener('submit', (e) => {
                e.preventDefault();
                this.enviarNuevoMensaje();
            });
        }

        // Form respuesta mensaje
        if (elementos.formRespuesta) {
            elementos.formRespuesta.addEventListener('submit', (e) => {
                e.preventDefault();
                this.enviarMensaje();
            });
        }

        // Contador de caracteres
        if (elementos.inputMensaje) {
            elementos.inputMensaje.addEventListener('input', (e) => {
                this.actualizarContadorCaracteres(e.target.value.length);
                if (elementos.btnEnviarRespuesta) {
                    elementos.btnEnviarRespuesta.disabled = !e.target.value.trim();
                }
            });
        }

        // Contador de caracteres modal
        if (elementos.textareaMensaje) {
            elementos.textareaMensaje.addEventListener('input', (e) => {
                const longitud = e.target.value.length;
                if (elementos.btnEnviarModal) {
                    elementos.btnEnviarModal.disabled = !longitud || longitud > 1000;
                }
            });
        }
    }

    configurarEventListenersAlumnos() {
        document.querySelectorAll('[data-alumno-id]').forEach(element => {
            element.addEventListener('click', () => {
                const alumnoId = parseInt(element.getAttribute('data-alumno-id'));
                this.abrirConversacion(alumnoId);
            });
        });
    }

    // ============================================
    // FUNCIONES DE ESTADO Y UTILIDAD
    // ============================================

    mostrarLoadingAlumnos(mostrar) {
        const elementos = this.elementos;
        if (elementos.loadingAlumnos) {
            elementos.loadingAlumnos.classList.toggle('hidden', !mostrar);
        }
    }

    mostrarLoadingMensajes(mostrar) {
        const elementos = this.elementos;
        if (elementos.loadingMensajes) {
            elementos.loadingMensajes.classList.toggle('hidden', !mostrar);
        }
    }

    mostrarCargandoGlobal(mostrar) {
        const elementos = this.elementos;
        if (elementos.loadingGlobal) {
            elementos.loadingGlobal.classList.toggle('hidden', !mostrar);
        }
    }

    mostrarErrorGlobal(mensaje) {
        const elementos = this.elementos;
        if (elementos.errorGlobal) {
            elementos.errorGlobal.textContent = mensaje;
            elementos.errorGlobal.classList.remove('hidden');
        }
        this.ocultarContenidoPrincipal();
    }

    ocultarErrorGlobal() {
        const elementos = this.elementos;
        if (elementos.errorGlobal) {
            elementos.errorGlobal.classList.add('hidden');
        }
    }

    mostrarContenidoPrincipal() {
        const elementos = this.elementos;
        if (elementos.contenidoPrincipal) {
            elementos.contenidoPrincipal.classList.remove('hidden');
        }
    }

    ocultarContenidoPrincipal() {
        const elementos = this.elementos;
        if (elementos.contenidoPrincipal) {
            elementos.contenidoPrincipal.classList.add('hidden');
        }
    }

    mostrarExito(mensaje) {
        if (window.toastManager) {
            window.toastManager.success(mensaje);
        } else {
            alert(`✅ ${mensaje}`);
        }
    }

    mostrarError(mensaje) {
        if (window.toastManager) {
            window.toastManager.error(mensaje);
        } else {
            alert(`❌ ${mensaje}`);
        }
    }

    // ============================================
    // FUNCIONES DE EJEMPLO (DESARROLLO) - ACTUALIZADO CON TODOS LOS ALUMNOS
    // ============================================

    generarTodosLosEstudiantesEjemplo() {
        return [
            {
                id: 1,
                nombre: 'Prueba',
                primer_apellido: 'Alumno',
                nombre_completo: 'Prueba Alumno',
                correo: 'sergiolivares18@gmail.com',
                nivel_actual: 'B1',
                idioma_aprendizaje: 'Inglés',
                lecciones_completadas: 25,
                total_xp: 1200,
                promedio_progreso: 85,
                racha_actual: 15
            },
            {
                id: 2,
                nombre: 'Ana',
                primer_apellido: 'García',
                nombre_completo: 'Ana García',
                correo: 'ana.garcia@email.com',
                nivel_actual: 'A2',
                idioma_aprendizaje: 'Inglés',
                lecciones_completadas: 12,
                total_xp: 450,
                promedio_progreso: 65,
                racha_actual: 5
            },
            {
                id: 3,
                nombre: 'Carlos',
                primer_apellido: 'Rodríguez',
                nombre_completo: 'Carlos Rodríguez',
                correo: 'carlos.rodriguez@email.com',
                nivel_actual: 'B1',
                idioma_aprendizaje: 'Inglés',
                lecciones_completadas: 18,
                total_xp: 720,
                promedio_progreso: 82,
                racha_actual: 12
            },
            {
                id: 4,
                nombre: 'María',
                primer_apellido: 'López',
                nombre_completo: 'María López',
                correo: 'maria.lopez@email.com',
                nivel_actual: 'A1',
                idioma_aprendizaje: 'Inglés',
                lecciones_completadas: 8,
                total_xp: 280,
                promedio_progreso: 45,
                racha_actual: 3
            },
            {
                id: 5,
                nombre: 'Luis',
                primer_apellido: 'Martínez',
                nombre_completo: 'Luis Martínez',
                correo: 'luis.martinez@email.com',
                nivel_actual: 'B2',
                idioma_aprendizaje: 'Inglés',
                lecciones_completadas: 32,
                total_xp: 1500,
                promedio_progreso: 92,
                racha_actual: 21
            },
            {
                id: 6,
                nombre: 'Elena',
                primer_apellido: 'Fernández',
                nombre_completo: 'Elena Fernández',
                correo: 'elena.fernandez@email.com',
                nivel_actual: 'A2',
                idioma_aprendizaje: 'Inglés',
                lecciones_completadas: 14,
                total_xp: 520,
                promedio_progreso: 58,
                racha_actual: 7
            }
        ];
    }

    verRetroalimentacion(alumnoId) {
        this.mostrarExito(`Funcionalidad de retroalimentación para alumno ${alumnoId} - En desarrollo`);
    }
}

// ============================================
// INICIALIZACIÓN GLOBAL
// ============================================

let retroalimentacionProfesor;

document.addEventListener('DOMContentLoaded', () => {
    retroalimentacionProfesor = new RetroalimentacionProfesor();
});

window.retroalimentacionProfesor = retroalimentacionProfesor;