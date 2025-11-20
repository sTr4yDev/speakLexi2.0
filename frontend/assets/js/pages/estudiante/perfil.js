/* ============================================
   SPEAKLEXI - PERFIL DEL ESTUDIANTE
   Archivo: assets/js/pages/estudiante/perfil.js
   Usa: APP_CONFIG, apiClient, formValidator, toastManager, Utils
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
        'Utils',
        'ModuleLoader'
    ];

    const inicializado = await window.ModuleLoader.initModule({
        moduleName: 'Perfil Estudiante',
        dependencies: dependencias,
        onReady: inicializarModulo,
        onError: (error) => {
            console.error('💥 Error al cargar perfil:', error);
            window.ModuleLoader.showModuleError(
                'Error al cargar el perfil. Por favor recarga la página.'
            );
        }
    });

    if (!inicializado) return;

    // ============================================
    // 2. FUNCIÓN PRINCIPAL DE INICIALIZACIÓN
    // ============================================
    async function inicializarModulo() {
        console.log('✅ Perfil estudiante listo');

        // ===================================
        // CONFIGURACIÓN DESDE APP_CONFIG
        // ===================================
        const config = {
            API: window.APP_CONFIG.API,
            ENDPOINTS: window.APP_CONFIG.API.ENDPOINTS,
            STORAGE: window.APP_CONFIG.STORAGE.KEYS,
            VALIDATION: window.APP_CONFIG.VALIDATION,
            UI: window.APP_CONFIG.UI,
            ROLES: window.APP_CONFIG.ROLES
        };

        // ===================================
        // ELEMENTOS DEL DOM
        // ===================================
        const elementos = {
            // Formularios
            personalInfoForm: document.getElementById('personal-info-form'),
            changePasswordForm: document.getElementById('change-password-form'),
            
            // Campos de información personal
            nombreInput: document.getElementById('nombre'),
            apellidosInput: document.getElementById('apellidos'),
            emailInput: document.getElementById('email'),
            
            // Campos de contraseña
            currentPasswordInput: document.getElementById('current-password'),
            newPasswordInput: document.getElementById('new-password'),
            confirmPasswordInput: document.getElementById('confirm-password'),
            
            // Información académica
            idiomaDisplay: document.getElementById('idioma-display'),
            nivelDisplay: document.getElementById('nivel-display'),
            
            // Botones
            savePersonalBtn: document.getElementById('save-personal-btn'),
            changePasswordBtn: document.getElementById('change-password-btn'),
            deactivateBtn: document.getElementById('deactivate-btn'),
            deleteBtn: document.getElementById('delete-btn'),
            
            // Modales
            deactivateModal: document.getElementById('deactivate-modal'),
            deleteModal: document.getElementById('delete-modal'),
            deleteConfirmationInput: document.getElementById('delete-confirmation-input'),
            confirmDeleteBtn: document.getElementById('confirm-delete-btn'),
            
            // Foto de perfil
            profilePhoto: document.getElementById('profile-photo'),
            photoInput: document.getElementById('photo-input')
        };

        // ===================================
        // ESTADO DE LA APLICACIÓN
        // ===================================
        const estado = {
            usuario: null,
            token: null,
            datosPerfil: null,
            isLoading: false
        };

        // ===================================
        // FUNCIONES AUXILIARES
        // ===================================
        
        function mostrarCargando(mostrar = true) {
            estado.isLoading = mostrar;
        }

        function deshabilitarFormularios(deshabilitar = true) {
            const botones = [elementos.savePersonalBtn, elementos.changePasswordBtn];
            botones.forEach(btn => {
                if (btn) btn.disabled = deshabilitar;
            });
        }

        // ===================================
        // FUNCIONES PRINCIPALES
        // ===================================

        /**
         * Verifica la autenticación del usuario
         */
        function verificarAutenticacion() {
            estado.usuario = window.Utils.getFromStorage(config.STORAGE.USUARIO);
            estado.token = window.Utils.getFromStorage(config.STORAGE.TOKEN);

            if (!estado.usuario || !estado.token) {
                window.toastManager.error('Debes iniciar sesión para acceder al perfil');
                setTimeout(() => {
                    window.location.href = config.UI.RUTAS.LOGIN;
                }, 1500);
                return false;
            }
            return true;
        }

        /**
         * Configura todos los event listeners
         */
        function configurarEventListeners() {
            // Formulario de información personal
            elementos.personalInfoForm?.addEventListener('submit', manejarGuardarInformacionPersonal);
            
            // Formulario de cambio de contraseña
            elementos.changePasswordForm?.addEventListener('submit', manejarCambioContraseña);
            
            // Gestión de cuenta
            elementos.deactivateBtn?.addEventListener('click', mostrarModalDesactivar);
            elementos.deleteBtn?.addEventListener('click', mostrarModalEliminar);
            
            // Modales
            document.getElementById('cancel-deactivate-btn')?.addEventListener('click', ocultarModalDesactivar);
            document.getElementById('confirm-deactivate-btn')?.addEventListener('click', manejarDesactivarCuenta);
            document.getElementById('cancel-delete-btn')?.addEventListener('click', ocultarModalEliminar);
            elementos.deleteConfirmationInput?.addEventListener('input', validarConfirmacionEliminar);
            elementos.confirmDeleteBtn?.addEventListener('click', manejarEliminarCuenta);
            
            // Foto de perfil
            elementos.photoInput?.addEventListener('change', manejarCambioFoto);
            
            // Logout
            document.addEventListener('click', (e) => {
                if (e.target.closest('#logout-btn')) {
                    manejarLogout();
                }
            });
        }

        /**
         * Carga los datos del usuario - VERSIÓN MEJORADA
         */
        async function cargarDatosUsuario() {
            if (estado.isLoading) return;

            mostrarCargando(true);

            try {
                // 1. PRIMERO intentar cargar del backend
                console.log('🔄 Intentando cargar datos del backend...');
                const response = await window.apiClient.get(config.ENDPOINTS.USUARIO.PERFIL);

                if (response.success) {
                    estado.datosPerfil = response.data;
                    console.log('✅ Datos del backend cargados:', estado.datosPerfil);
                    actualizarUI();
                } else {
                    throw new Error(response.error || 'Error del servidor');
                }

            } catch (error) {
                console.error('💥 Error al cargar datos del backend:', error);
                
                // 2. SI FALLA, usar datos del localStorage
                console.log('🔄 Usando datos del localStorage como respaldo...');
                estado.datosPerfil = obtenerDatosDesdeLocalStorage();
                
                if (estado.datosPerfil.usuario) {
                    actualizarUI();
                    window.toastManager.warning('Datos cargados desde caché. El servidor tiene problemas temporales.');
                    console.log('✅ Datos del localStorage cargados:', estado.datosPerfil);
                } else {
                    window.toastManager.error('No se pudieron cargar los datos del perfil');
                }
            } finally {
                mostrarCargando(false);
            }
        }

        /**
         * Obtiene datos REALES desde localStorage
         */
        function obtenerDatosDesdeLocalStorage() {
            const usuarioStorage = window.Utils.getFromStorage(config.STORAGE.USUARIO);
            
            if (!usuarioStorage) {
                return null;
            }

            return {
                usuario: {
                    id: usuarioStorage.id,
                    nombre: usuarioStorage.nombre,
                    primer_apellido: usuarioStorage.primer_apellido,
                    segundo_apellido: usuarioStorage.segundo_apellido,
                    correo: usuarioStorage.correo,
                    rol: usuarioStorage.rol,
                    estado_cuenta: usuarioStorage.estado_cuenta,
                    fecha_registro: usuarioStorage.fecha_registro,
                    foto_perfil: usuarioStorage.foto_perfil,
                    correo_verificado: usuarioStorage.correo_verificado
                },
                datos_estudiante: {
                    idioma_aprendizaje: usuarioStorage.idioma_aprendizaje || 'Inglés',
                    nivel_actual: usuarioStorage.nivel_actual || 'A1',
                    puntos_experiencia: usuarioStorage.puntos_experiencia || 0,
                    racha_actual: usuarioStorage.racha_actual || 0
                }
            };
        }

        /**
         * Actualiza la interfaz con los datos del usuario
         */
        function actualizarUI() {
            if (!estado.datosPerfil) {
                console.log('⚠️ No hay datos para mostrar');
                return;
            }

            const { usuario, datos_estudiante } = estado.datosPerfil;

            console.log('🔄 Actualizando UI con datos:', { usuario, datos_estudiante });

            // Información personal
            if (elementos.nombreInput) {
                elementos.nombreInput.value = usuario?.nombre || '';
                console.log('📝 Nombre:', usuario?.nombre);
            }
            
            if (elementos.apellidosInput) {
                elementos.apellidosInput.value = `${usuario?.primer_apellido || ''} ${usuario?.segundo_apellido || ''}`.trim();
                console.log('📝 Apellidos:', elementos.apellidosInput.value);
            }
            
            if (elementos.emailInput) {
                elementos.emailInput.value = usuario?.correo || '';
                console.log('📝 Email:', usuario?.correo);
            }

            // Información académica
            if (elementos.idiomaDisplay) {
                elementos.idiomaDisplay.textContent = datos_estudiante?.idioma_aprendizaje || 'Inglés';
                console.log('🌎 Idioma:', datos_estudiante?.idioma_aprendizaje);
            }
            
            if (elementos.nivelDisplay) {
                elementos.nivelDisplay.textContent = datos_estudiante?.nivel_actual || 'A1';
                console.log('📊 Nivel:', datos_estudiante?.nivel_actual);
            }

            // Foto de perfil
            actualizarFotoPerfil(usuario);
            
            console.log('✅ UI actualizada correctamente');
        }

        /**
         * Actualiza la foto de perfil
         */
        function actualizarFotoPerfil(usuario) {
            if (!elementos.profilePhoto) return;

            if (usuario?.foto_perfil && usuario.foto_perfil !== 'default-avatar.png') {
                elementos.profilePhoto.src = usuario.foto_perfil;
                console.log('🖼️ Foto de perfil cargada:', usuario.foto_perfil);
            } else {
                const nombreCompleto = `${usuario?.nombre || 'Usuario'} ${usuario?.primer_apellido || ''}`;
                elementos.profilePhoto.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreCompleto)}&background=9333ea&color=fff&size=128`;
                console.log('🖼️ Foto por defecto generada');
            }
        }

        /**
         * Maneja el guardado de información personal
         */
        async function manejarGuardarInformacionPersonal(e) {
            e.preventDefault();
            
            if (estado.isLoading) return;

            mostrarCargando(true);
            deshabilitarFormularios(true);
            
            if (elementos.savePersonalBtn) {
                elementos.savePersonalBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Guardando...';
            }

            try {
                const datosActualizados = {
                    nombre: elementos.nombreInput?.value.trim() || '',
                    primer_apellido: elementos.apellidosInput?.value.split(' ')[0] || '',
                    segundo_apellido: elementos.apellidosInput?.value.split(' ').slice(1).join(' ') || null
                };

                console.log('📤 Enviando datos actualizados:', datosActualizados);

                // Intentar guardar en el backend
                const response = await window.apiClient.put(config.ENDPOINTS.USUARIO.ACTUALIZAR_PERFIL, datosActualizados);

                if (response.success) {
                    window.toastManager.success('Información actualizada correctamente');
                    
                    // Actualizar datos locales
                    if (response.data.usuario) {
                        estado.datosPerfil.usuario = { ...estado.datosPerfil.usuario, ...response.data.usuario };
                        window.Utils.saveToStorage(config.STORAGE.USUARIO, estado.datosPerfil.usuario);
                        console.log('💾 Datos guardados en localStorage');
                    }
                } else {
                    throw new Error(response.error || 'Error al actualizar la información');
                }

            } catch (error) {
                console.error('💥 Error al guardar información:', error);
                window.toastManager.error('No se pudo guardar. El servidor no está disponible.');
            } finally {
                mostrarCargando(false);
                deshabilitarFormularios(false);
                
                if (elementos.savePersonalBtn) {
                    elementos.savePersonalBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Guardar Cambios';
                }
            }
        }

        /**
         * Maneja el cambio de contraseña
         */
        async function manejarCambioContraseña(e) {
            e.preventDefault();
            
            if (estado.isLoading) return;

            // Validaciones
            if (elementos.newPasswordInput?.value !== elementos.confirmPasswordInput?.value) {
                window.toastManager.error('Las contraseñas no coinciden');
                return;
            }

            const validacionContraseña = window.formValidator.validatePassword(elementos.newPasswordInput?.value || '');
            if (!validacionContraseña.isValid) {
                window.toastManager.error(`La contraseña debe cumplir con: ${validacionContraseña.errors?.join(', ') || 'requisitos mínimos'}`);
                return;
            }

            mostrarCargando(true);
            deshabilitarFormularios(true);
            
            if (elementos.changePasswordBtn) {
                elementos.changePasswordBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Cambiando...';
            }

            try {
                const datosContraseña = {
                    currentPassword: elementos.currentPasswordInput?.value || '',
                    newPassword: elementos.newPasswordInput?.value || ''
                };

                const response = await window.apiClient.put(config.ENDPOINTS.USUARIO.CAMBIAR_PASSWORD, datosContraseña);

                if (response.success) {
                    window.toastManager.success('Contraseña actualizada correctamente');
                    
                    // Limpiar formulario
                    if (elementos.currentPasswordInput) elementos.currentPasswordInput.value = '';
                    if (elementos.newPasswordInput) elementos.newPasswordInput.value = '';
                    if (elementos.confirmPasswordInput) elementos.confirmPasswordInput.value = '';
                    elementos.changePasswordForm?.reset();
                } else {
                    throw new Error(response.error || 'Error al cambiar la contraseña');
                }

            } catch (error) {
                console.error('💥 Error al cambiar contraseña:', error);
                window.toastManager.error('No se pudo cambiar la contraseña. El servidor no está disponible.');
            } finally {
                mostrarCargando(false);
                deshabilitarFormularios(false);
                
                if (elementos.changePasswordBtn) {
                    elementos.changePasswordBtn.innerHTML = '<i class="fas fa-key mr-2"></i>Cambiar Contraseña';
                }
            }
        }

        /**
         * Maneja el cambio de foto de perfil
         */
        async function manejarCambioFoto(e) {
            const archivo = e.target.files[0];
            if (!archivo) return;

            // Validar tipo y tamaño
            const tiposPermitidos = ['image/jpeg', 'image/png'];
            const tamañoMaximo = 5 * 1024 * 1024; // 5MB

            if (!tiposPermitidos.includes(archivo.type)) {
                window.toastManager.error('Solo se permiten archivos JPG y PNG');
                return;
            }

            if (archivo.size > tamañoMaximo) {
                window.toastManager.error('El archivo no debe superar los 5MB');
                return;
            }

            try {
                const formData = new FormData();
                formData.append('foto_perfil', archivo);

                const response = await window.apiClient.uploadFile(config.ENDPOINTS.MULTIMEDIA.SUBIR, formData);

                if (response.success) {
                    window.toastManager.success('Foto de perfil actualizada correctamente');
                    
                    // Actualizar imagen en tiempo real
                    if (response.data.url && elementos.profilePhoto) {
                        elementos.profilePhoto.src = response.data.url;
                        
                        // Actualizar datos locales
                        if (estado.datosPerfil.usuario) {
                            estado.datosPerfil.usuario.foto_perfil = response.data.url;
                            window.Utils.saveToStorage(config.STORAGE.USUARIO, estado.datosPerfil.usuario);
                        }
                    }
                } else {
                    throw new Error(response.error || 'Error al subir la foto');
                }

            } catch (error) {
                console.error('💥 Error al cambiar foto:', error);
                window.toastManager.error('No se pudo cambiar la foto. El servidor no está disponible.');
            }
        }

        // ===================================
        // GESTIÓN DE CUENTA (DESACTIVAR/ELIMINAR)
        // ===================================

        function mostrarModalDesactivar() {
            if (elementos.deactivateModal) {
                elementos.deactivateModal.classList.remove('hidden');
            }
        }

        function ocultarModalDesactivar() {
            if (elementos.deactivateModal) {
                elementos.deactivateModal.classList.add('hidden');
            }
        }

        function mostrarModalEliminar() {
            if (elementos.deleteModal) {
                elementos.deleteModal.classList.remove('hidden');
            }
        }

        function ocultarModalEliminar() {
            if (elementos.deleteModal) {
                elementos.deleteModal.classList.add('hidden');
            }
            if (elementos.deleteConfirmationInput) {
                elementos.deleteConfirmationInput.value = '';
            }
            if (elementos.confirmDeleteBtn) {
                elementos.confirmDeleteBtn.disabled = true;
            }
        }

        function validarConfirmacionEliminar(e) {
            if (elementos.confirmDeleteBtn) {
                elementos.confirmDeleteBtn.disabled = e.target.value !== 'ELIMINAR';
            }
        }

        async function manejarDesactivarCuenta() {
            const btn = document.getElementById('confirm-deactivate-btn');
            if (!btn) return;

            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Desactivando...';

            try {
                const response = await window.apiClient.post(config.ENDPOINTS.USUARIO.DESACTIVAR);

                if (response.success) {
                    window.toastManager.success('Cuenta desactivada. Tienes 30 días para reactivarla.');
                    
                    setTimeout(() => {
                        window.Utils.clearStorage();
                        window.location.href = config.UI.RUTAS.LOGIN;
                    }, 2000);
                } else {
                    throw new Error(response.error || 'Error al desactivar la cuenta');
                }

            } catch (error) {
                console.error('💥 Error al desactivar cuenta:', error);
                window.toastManager.error('No se pudo desactivar la cuenta. El servidor no está disponible.');
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-pause mr-2"></i>Sí, Desactivar Mi Cuenta';
            }
        }

        async function manejarEliminarCuenta() {
            const btn = document.getElementById('confirm-delete-btn');
            if (!btn) return;

            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Eliminando...';

            try {
                const response = await window.apiClient.delete(config.ENDPOINTS.USUARIO.ELIMINAR);

                if (response.success) {
                    window.toastManager.success('Cuenta eliminada permanentemente');
                    
                    setTimeout(() => {
                        window.Utils.clearStorage();
                        window.location.href = config.UI.RUTAS.REGISTRO;
                    }, 2000);
                } else {
                    throw new Error(response.error || 'Error al eliminar la cuenta');
                }

            } catch (error) {
                console.error('💥 Error al eliminar cuenta:', error);
                window.toastManager.error('No se pudo eliminar la cuenta. El servidor no está disponible.');
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-trash mr-2"></i>Sí, Eliminar Permanentemente';
            }
        }

        /**
         * Maneja el cierre de sesión
         */
        function manejarLogout() {
            window.Utils.removeFromStorage(config.STORAGE.USUARIO);
            window.Utils.removeFromStorage(config.STORAGE.TOKEN);
            
            window.toastManager.success('Sesión cerrada correctamente');
            
            setTimeout(() => {
                window.location.href = config.UI.RUTAS.LOGIN;
            }, 1000);
        }

        // ===================================
        // INICIALIZACIÓN
        // ===================================
        
        function inicializar() {
            if (!verificarAutenticacion()) {
                return;
            }

            configurarEventListeners();
            cargarDatosUsuario();

            if (window.APP_CONFIG.ENV.DEBUG) {
                console.log('🔧 Perfil configurado:', { 
                    usuario: estado.usuario,
                    elementos: Object.keys(elementos).filter(key => elementos[key] !== null)
                });
            }
        }

        // Ejecutar inicialización
        inicializar();
    }

})();