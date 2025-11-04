/* ============================================
   SPEAKLEXI - EDITOR DE LECCIONES (ADMIN)
   Archivo: /assets/js/pages/admin/editar-leccion/editar-leccion.js
   ============================================ */
(() => {
    'use strict';

    // Variables globales
    let editorQuill;
    let actividades = [];
    let archivosMultimedia = [];
    let leccionId = null;
    let autoSaveInterval;
    let leccionData = null;

    // Configuración
    const config = {
        autoSaveDelay: 30000,
        maxFileSize: 50 * 1024 * 1024,
        allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'audio/mp3', 'application/pdf']
    };

    // Inicialización principal
    async function init() {
        console.log('🚀 Iniciando Editor de Lección...');
        
        await waitForDependencies();
        await cargarModulosActividades();
        
        if (!verificarPermisosAdmin()) {
            window.location.href = '/pages/auth/login.html';
            return;
        }
        
        inicializarEditor();
        setupEventListeners();
        inicializarQuill();
        iniciarAutoSave();
        
        // Verificar si estamos editando una lección existente
        const urlParams = new URLSearchParams(window.location.search);
        leccionId = urlParams.get('id');
        
        if (leccionId) {
            await cargarLeccionExistente(leccionId);
        } else {
            // Modo creación nueva
            document.title = 'Crear Nueva Lección - SpeakLexi';
            actualizarProgreso();
        }
        
        console.log('✅ Editor de Lección inicializado');
    }

    // Cargar módulos de actividades dinámicamente
    async function cargarModulosActividades() {
        const modulos = [
            '/assets/js/pages/admin/editar-leccion/actividades/actividad-base.js',
            '/assets/js/pages/admin/editar-leccion/actividades/seleccion-multiple.js',
            '/assets/js/pages/admin/editar-leccion/actividades/verdadero-falso.js',
            '/assets/js/pages/admin/editar-leccion/actividades/completar-espacios.js',
            '/assets/js/pages/admin/editar-leccion/actividades/emparejamiento.js',
            '/assets/js/pages/admin/editar-leccion/actividades/escritura.js',
            '/assets/js/pages/admin/editar-leccion/componentes/galeria-imagenes.js',
            '/assets/js/pages/admin/editar-leccion/componentes/progreso.js',
            '/assets/js/pages/admin/editar-leccion/componentes/guardado.js'
        ];

        for (const modulo of modulos) {
            try {
                await cargarScript(modulo);
                console.log(`✅ Módulo cargado: ${modulo}`);
            } catch (error) {
                console.warn(`⚠️ Módulo no encontrado: ${modulo}`, error);
            }
        }
    }

    function cargarScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    function inicializarEditor() {
        // Activar primer módulo
        document.querySelectorAll('.editor-modulo').forEach((modulo, index) => {
            if (index === 0) {
                modulo.classList.add('active');
            }
        });
    }

    function inicializarQuill() {
        const editorElement = document.getElementById('editor-contenido');
        if (!editorElement) {
            console.warn('❌ Elemento editor-contenido no encontrado');
            return;
        }

        editorQuill = new Quill('#editor-contenido', {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link', 'image', 'video'],
                    ['clean']
                ]
            },
            placeholder: 'Escribe el contenido de tu lección aquí...'
        });

        editorQuill.on('text-change', () => {
            marcarModuloCompletado('contenido');
            actualizarProgreso();
        });
    }

    function setupEventListeners() {
        // Navegación entre módulos
        document.querySelectorAll('.badge-progreso').forEach(badge => {
            badge.addEventListener('click', (e) => {
                e.preventDefault();
                const modulo = badge.dataset.etapa;
                navegarAModulo(modulo);
            });
        });

        // Form inputs básicos
        document.querySelectorAll('#form-leccion input, #form-leccion select, #form-leccion textarea').forEach(input => {
            input.addEventListener('input', () => {
                if (input.name === 'titulo' || input.name === 'descripcion' || input.name === 'nivel' || input.name === 'idioma') {
                    marcarModuloCompletado('info');
                }
                actualizarProgreso();
            });
        });

        // Actividades
        const btnAgregarActividad = document.getElementById('btn-agregar-actividad');
        if (btnAgregarActividad) {
            btnAgregarActividad.addEventListener('click', mostrarModalTipoActividad);
        }

        const btnCancelarTipo = document.getElementById('btn-cancelar-tipo');
        if (btnCancelarTipo) {
            btnCancelarTipo.addEventListener('click', ocultarModalTipoActividad);
        }

        // Multimedia
        const btnSeleccionarArchivos = document.getElementById('btn-seleccionar-archivos');
        if (btnSeleccionarArchivos) {
            btnSeleccionarArchivos.addEventListener('click', () => {
                document.getElementById('input-archivos').click();
            });
        }

        const inputArchivos = document.getElementById('input-archivos');
        if (inputArchivos) {
            inputArchivos.addEventListener('change', manejarSubidaArchivos);
        }

        setupDragAndDrop();

        // Guardado
        const btnGuardarBorrador = document.getElementById('btn-guardar-borrador');
        if (btnGuardarBorrador) {
            btnGuardarBorrador.addEventListener('click', guardarBorrador);
        }

        const formLeccion = document.getElementById('form-leccion');
        if (formLeccion) {
            formLeccion.addEventListener('submit', publicarLeccion);
        }

        // Tipos de actividad
        document.querySelectorAll('.tipo-actividad-card').forEach(card => {
            card.addEventListener('click', () => {
                const tipo = card.dataset.tipo;
                crearNuevaActividad(tipo);
            });
        });
    }

    function setupDragAndDrop() {
        const dropZone = document.getElementById('zona-upload');
        if (!dropZone) return;
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('drag-over');
            }, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('drag-over');
            }, false);
        });
        
        dropZone.addEventListener('drop', manejarDrop, false);
    }

    function manejarDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        manejarArchivosSeleccionados(files);
    }

    function manejarSubidaArchivos(e) {
        const files = e.target.files;
        manejarArchivosSeleccionados(files);
    }

    async function manejarArchivosSeleccionados(files) {
        for (let file of files) {
            // Validar tipo de archivo
            if (!config.allowedFileTypes.includes(file.type)) {
                window.toastManager.error(`Tipo de archivo no permitido: ${file.type}`);
                continue;
            }

            // Validar tamaño
            if (file.size > config.maxFileSize) {
                window.toastManager.error(`Archivo demasiado grande: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
                continue;
            }

            try {
                // Subir archivo
                const formData = new FormData();
                formData.append('archivo', file);
                formData.append('leccion_id', leccionId);

                const response = await window.apiClient.upload('/api/lecciones/upload', formData);
                
                if (response.success) {
                    archivosMultimedia.push(response.data);
                    actualizarGaleriaMultimedia();
                    window.toastManager.success('Archivo subido exitosamente');
                } else {
                    throw new Error(response.error);
                }
            } catch (error) {
                console.error('Error subiendo archivo:', error);
                window.toastManager.error('Error al subir archivo');
            }
        }
    }

    function actualizarGaleriaMultimedia() {
        const galeria = document.getElementById('galeria-archivos');
        if (!galeria) return;

        galeria.innerHTML = archivosMultimedia.map(archivo => `
            <div class="archivo-item bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div class="flex items-center gap-3">
                    <i class="fas fa-${obtenerIconoArchivo(archivo.tipo)} text-purple-500"></i>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900 dark:text-white truncate">${archivo.nombre}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">${formatearTamañoArchivo(archivo.tamaño)}</p>
                    </div>
                    <button onclick="eliminarArchivo('${archivo.id}')" class="text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // Actualizar contador
        const contador = document.getElementById('contador-multimedia');
        if (contador) {
            contador.textContent = `${archivosMultimedia.length} archivo${archivosMultimedia.length !== 1 ? 's' : ''}`;
        }
    }

    function obtenerIconoArchivo(tipo) {
        if (tipo.startsWith('image/')) return 'file-image';
        if (tipo.startsWith('video/')) return 'file-video';
        if (tipo.startsWith('audio/')) return 'file-audio';
        if (tipo === 'application/pdf') return 'file-pdf';
        return 'file';
    }

    function formatearTamañoArchivo(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Funciones de actividades
    function mostrarModalTipoActividad() {
        const modal = document.getElementById('modal-tipo-actividad');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    function ocultarModalTipoActividad() {
        const modal = document.getElementById('modal-tipo-actividad');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    function crearNuevaActividad(tipo) {
        if (window.ActividadManager && window.ActividadManager.crearActividad) {
            window.ActividadManager.crearActividad(tipo);
            ocultarModalTipoActividad();
        } else {
            console.warn('ActividadManager no disponible');
            // Crear actividad básica
            const nuevaActividad = {
                id: Date.now(),
                tipo: tipo,
                titulo: `Nueva actividad ${tipo}`,
                pregunta: '',
                opciones: [],
                respuesta_correcta: '',
                puntaje: 10,
                orden: actividades.length + 1
            };
            
            actividades.push(nuevaActividad);
            actualizarListaActividades();
            marcarModuloCompletado('actividades');
            actualizarProgreso();
            window.toastManager.success('Actividad creada');
        }
    }

    function actualizarListaActividades() {
        const lista = document.getElementById('lista-actividades');
        const placeholder = document.getElementById('placeholder-actividades');
        
        if (!lista) return;

        if (actividades.length === 0) {
            if (placeholder) placeholder.style.display = 'block';
            lista.innerHTML = '';
        } else {
            if (placeholder) placeholder.style.display = 'none';
            
            lista.innerHTML = actividades.map(actividad => `
                <div class="actividad-item bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <i class="fas fa-${obtenerIconoActividad(actividad.tipo)} text-purple-500"></i>
                            <div>
                                <h4 class="font-semibold text-gray-900 dark:text-white">${actividad.titulo}</h4>
                                <p class="text-sm text-gray-600 dark:text-gray-400">${actividad.tipo} - ${actividad.puntaje} puntos</p>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="editarActividad(${actividad.id})" class="text-blue-600 hover:text-blue-800">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="eliminarActividad(${actividad.id})" class="text-red-600 hover:text-red-800">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        actualizarContadorActividades();
    }

    function obtenerIconoActividad(tipo) {
        const icons = {
            seleccion_multiple: 'list-ul',
            verdadero_falso: 'check-circle',
            completar_espacios: 'edit',
            emparejamiento: 'object-group',
            escritura: 'keyboard'
        };
        return icons[tipo] || 'puzzle-piece';
    }

    // Funciones de guardado
    async function guardarBorrador(e) {
        if (e) e.preventDefault();
        await guardarLeccion('borrador');
    }

    async function publicarLeccion(e) {
        if (e) e.preventDefault();
        await guardarLeccion('activa');
    }

    async function guardarLeccion(estado = 'borrador') {
        try {
            const formData = new FormData(document.getElementById('form-leccion'));
            const contenido = editorQuill ? editorQuill.root.innerHTML : '';

            const datosLeccion = {
                titulo: formData.get('titulo'),
                descripcion: formData.get('descripcion'),
                nivel: formData.get('nivel'),
                idioma: formData.get('idioma'),
                duracion_minutos: parseInt(formData.get('duracion_minutos') || 30),
                orden: parseInt(formData.get('orden') || 0),
                contenido: contenido,
                estado: estado,
                actividades: actividades,
                archivos_multimedia: archivosMultimedia
            };

            let response;
            if (leccionId) {
                // Actualizar lección existente
                response = await window.apiClient.put(`/api/lecciones/${leccionId}`, datosLeccion);
            } else {
                // Crear nueva lección
                response = await window.apiClient.post('/api/lecciones', datosLeccion);
            }

            if (response.success) {
                const mensaje = estado === 'activa' ? 'Lección publicada exitosamente' : 'Borrador guardado exitosamente';
                window.toastManager.success(mensaje);
                
                if (!leccionId && response.data.id) {
                    leccionId = response.data.id;
                    // Actualizar URL sin recargar
                    window.history.replaceState({}, '', `?id=${leccionId}`);
                }
                
                if (estado === 'activa') {
                    setTimeout(() => {
                        window.location.href = '/pages/admin/gestion-lecciones.html';
                    }, 1500);
                }
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.error('Error guardando lección:', error);
            window.toastManager.error('Error al guardar la lección');
        }
    }

    // Cargar lección existente
    async function cargarLeccionExistente(id) {
        try {
            const response = await window.apiClient.get(`/api/lecciones/${id}`);
            
            if (response.success) {
                leccionData = response.data;
                cargarDatosEnFormulario(leccionData);
                window.toastManager.success('Lección cargada exitosamente');
            } else {
                throw new Error(response.error || 'Error al cargar lección');
            }
        } catch (error) {
            console.error('Error cargando lección:', error);
            window.toastManager.error('Error al cargar la lección');
            
            // Cargar datos de demostración para desarrollo
            cargarDatosDemo();
        }
    }

    function cargarDatosEnFormulario(leccion) {
        // Información básica
        document.querySelector('input[name="titulo"]').value = leccion.titulo || '';
        document.querySelector('textarea[name="descripcion"]').value = leccion.descripcion || '';
        document.querySelector('select[name="idioma"]').value = leccion.idioma || '';
        document.querySelector('select[name="nivel"]').value = leccion.nivel || '';
        document.querySelector('input[name="duracion_minutos"]').value = leccion.duracion_minutos || 30;
        document.querySelector('input[name="orden"]').value = leccion.orden || 0;
        
        // Contenido
        if (leccion.contenido && editorQuill) {
            editorQuill.root.innerHTML = leccion.contenido;
        }
        
        // Actividades
        if (leccion.actividades && Array.isArray(leccion.actividades)) {
            actividades = leccion.actividades;
            actualizarListaActividades();
        }
        
        // Multimedia
        if (leccion.archivos_multimedia && Array.isArray(leccion.archivos_multimedia)) {
            archivosMultimedia = leccion.archivos_multimedia;
            actualizarGaleriaMultimedia();
        }
        
        // Actualizar título de página
        document.title = `Editando: ${leccion.titulo} - SpeakLexi`;
        
        // Marcar módulos como completados
        if (leccion.titulo) marcarModuloCompletado('info');
        if (leccion.contenido) marcarModuloCompletado('contenido');
        if (actividades.length > 0) marcarModuloCompletado('actividades');
        if (archivosMultimedia.length > 0) marcarModuloCompletado('multimedia');
    }

    function cargarDatosDemo() {
        // Datos de demostración para desarrollo
        const datosDemo = {
            titulo: 'Lección de Demostración',
            descripcion: 'Esta es una lección de demostración',
            idioma: 'Inglés',
            nivel: 'A1',
            duracion_minutos: 45,
            orden: 1,
            contenido: '<p>Contenido de demostración</p>',
            actividades: [],
            archivos_multimedia: []
        };
        
        cargarDatosEnFormulario(datosDemo);
        window.toastManager.info('Cargados datos de demostración');
    }

    function iniciarAutoSave() {
        autoSaveInterval = setInterval(() => {
            if (leccionId || document.querySelector('input[name="titulo"]').value) {
                guardarBorrador();
            }
        }, config.autoSaveDelay);
    }

    // Funciones globales para los módulos
    window.leccionEditor = {
        getActividades: () => actividades,
        setActividades: (nuevasActividades) => {
            actividades = nuevasActividades;
            actualizarListaActividades();
        },
        getArchivosMultimedia: () => archivosMultimedia,
        setArchivosMultimedia: (nuevosArchivos) => {
            archivosMultimedia = nuevosArchivos;
            actualizarGaleriaMultimedia();
        },
        getLeccionId: () => leccionId,
        getLeccionData: () => leccionData,
        recargarActividad: (actividadId) => {
            // Implementar recarga de actividad específica
            console.log('Recargar actividad:', actividadId);
        },
        actualizarProgreso: () => actualizarProgreso(),
        actualizarContadorActividades: () => actualizarContadorActividades(),
        mostrarToast: (mensaje, tipo = 'success') => {
            if (window.toastManager) {
                window.toastManager[tipo](mensaje);
            }
        }
    };

    // Funciones auxiliares globales
    window.eliminarActividad = (id) => {
        if (confirm('¿Estás seguro de eliminar esta actividad?')) {
            actividades = actividades.filter(a => a.id !== id);
            actualizarListaActividades();
            actualizarProgreso();
            window.toastManager.success('Actividad eliminada');
        }
    };

    window.editarActividad = (id) => {
        // Esta función será implementada por el módulo de actividades
        if (window.ActividadManager && window.ActividadManager.editarActividad) {
            window.ActividadManager.editarActividad(id);
        } else {
            window.toastManager.info('Funcionalidad de edición no disponible');
        }
    };

    window.eliminarArchivo = (id) => {
        if (confirm('¿Estás seguro de eliminar este archivo?')) {
            archivosMultimedia = archivosMultimedia.filter(a => a.id !== id);
            actualizarGaleriaMultimedia();
            window.toastManager.success('Archivo eliminado');
        }
    };

    // Funciones de progreso y navegación
    function actualizarContadorActividades() {
        const contador = document.getElementById('contador-actividades');
        if (contador) {
            contador.textContent = `${actividades.length} actividad${actividades.length !== 1 ? 'es' : ''}`;
        }
    }

    function actualizarProgreso() {
        if (window.ProgresoManager && window.ProgresoManager.actualizar) {
            window.ProgresoManager.actualizar();
        } else {
            // Implementación básica si el módulo no está disponible
            const progresoBar = document.getElementById('progreso-bar');
            const progresoPorcentaje = document.getElementById('progreso-porcentaje');
            
            if (progresoBar && progresoPorcentaje) {
                // Cálculo simple del progreso
                let progreso = 0;
                if (document.querySelector('input[name="titulo"]').value) progreso += 25;
                if (editorQuill && editorQuill.getText().trim().length > 0) progreso += 25;
                if (actividades.length > 0) progreso += 25;
                if (archivosMultimedia.length > 0) progreso += 25;
                
                progresoBar.style.width = `${progreso}%`;
                progresoPorcentaje.textContent = `${progreso}%`;
            }
        }
    }

    function marcarModuloCompletado(modulo) {
        if (window.ProgresoManager && window.ProgresoManager.marcarModuloCompletado) {
            window.ProgresoManager.marcarModuloCompletado(modulo);
        }
    }

    function navegarAModulo(modulo) {
        if (window.ProgresoManager && window.ProgresoManager.navegarAModulo) {
            window.ProgresoManager.navegarAModulo(modulo);
        } else {
            // Navegación básica
            document.querySelectorAll('.editor-modulo').forEach(mod => {
                mod.classList.remove('active');
            });
            document.getElementById(`modulo-${modulo}`)?.classList.add('active');
        }
    }

    // Dependencias
    async function waitForDependencies() {
        const dependencies = ['apiClient', 'toastManager'];
        
        while (dependencies.some(dep => !window[dep])) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    function verificarPermisosAdmin() {
        // En una implementación real, verificaría el token JWT o sesión
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.role === 'admin';
    }

    // Limpieza al salir
    window.addEventListener('beforeunload', () => {
        if (autoSaveInterval) {
            clearInterval(autoSaveInterval);
        }
    });

    // Inicialización
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();