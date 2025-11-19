/* ============================================
   SPEAKLEXI - EDITOR DE LECCIÓN CORREGIDO Y COMPATIBLE
   ============================================ */
(() => {
    'use strict';

    let editorQuill;
    let actividades = [];
    let archivosMultimedia = [];
    let leccionId = null;
    let autoSaveInterval;
    let leccionData = null;

    const config = {
        autoSaveDelay: 30000,
        maxFileSize: 50 * 1024 * 1024,
        allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'audio/mp3', 'application/pdf']
    };

    // 🎯 FORMATO BACKEND - Compatible con Python y leccion-activa.js
    const TIPO_MAPPING_BACKEND = {
        'seleccion_multiple': 'multiple_choice',
        'verdadero_falso': 'true_false',
        'completar_espacios': 'fill_blank',
        'emparejamiento': 'matching',
        'escritura': 'writing'
    };

    const TIPO_MAPPING_EDITOR = {
        'multiple_choice': 'seleccion_multiple',
        'true_false': 'verdadero_falso',
        'fill_blank': 'completar_espacios',
        'matching': 'emparejamiento',
        'writing': 'escritura'
    };

    // 🎯 FUNCIÓN CRÍTICA: Diagnóstico y corrección de actividades
    function diagnosticarYCorregirActividades() {
        console.group('🔍 DIAGNÓSTICO Y CORRECCIÓN DE ACTIVIDADES');
        
        let actividadesCorregidas = 0;
        
        actividades.forEach((actividad, index) => {
            console.log(`📋 Actividad ${index} antes de corrección:`, {
                id: actividad.id,
                tipo: actividad.tipo,
                tiene_contenido: !!actividad.contenido,
                contenido_keys: Object.keys(actividad.contenido || {}),
                tiene_preguntas: !!actividad.contenido?.preguntas,
                preguntas_count: actividad.contenido?.preguntas?.length || 0,
                tiene_opciones: !!actividad.contenido?.preguntas?.[0]?.opciones,
                opciones_count: actividad.contenido?.preguntas?.[0]?.opciones?.length || 0
            });
            
            // 🎯 CORREGIR ACTIVIDADES DE SELECCIÓN MÚLTIPLE
            if (actividad.tipo === 'seleccion_multiple') {
                const necesitaCorreccion = 
                    !actividad.contenido ||
                    !actividad.contenido.preguntas ||
                    !actividad.contenido.preguntas[0] ||
                    !actividad.contenido.preguntas[0].opciones ||
                    actividad.contenido.preguntas[0].opciones.length === 0;
                
                if (necesitaCorreccion) {
                    console.warn(`🔄 Corrigiendo actividad ${index} (${actividad.id})`);
                    
                    // Inicializar estructura correcta
                    actividad.contenido = actividad.contenido || {};
                    actividad.contenido.preguntas = actividad.contenido.preguntas || [{}];
                    actividad.contenido.preguntas[0] = actividad.contenido.preguntas[0] || {};
                    actividad.contenido.preguntas[0].pregunta = actividad.contenido.preguntas[0].pregunta || actividad.titulo || "Pregunta de selección múltiple";
                    actividad.contenido.preguntas[0].opciones = actividad.contenido.preguntas[0].opciones || [
                        "Opción correcta (edita esto)",
                        "Opción incorrecta 1",
                        "Opción incorrecta 2", 
                        "Opción incorrecta 3"
                    ];
                    
                    // Asegurar respuesta correcta
                    if (!actividad.respuesta_correcta) {
                        actividad.respuesta_correcta = {
                            respuestas: [0],
                            tipo: "indices"
                        };
                    }
                    
                    actividadesCorregidas++;
                }
            }

            // 🎯 CORREGIR ACTIVIDADES DE VERDADERO/FALSO
            if (actividad.tipo === 'verdadero_falso') {
                if (!actividad.contenido || !actividad.contenido.afirmaciones || actividad.contenido.afirmaciones.length === 0) {
                    console.warn(`🔄 Corrigiendo actividad verdadero/falso ${index} (${actividad.id})`);
                    
                    actividad.contenido = actividad.contenido || {};
                    actividad.contenido.afirmaciones = actividad.contenido.afirmaciones || [{
                        afirmacion: "Esta es una afirmación de ejemplo",
                        respuesta: true
                    }];
                    
                    if (!actividad.respuesta_correcta) {
                        actividad.respuesta_correcta = {
                            respuestas: [true],
                            tipo: "booleanos"
                        };
                    }
                    
                    actividadesCorregidas++;
                }
            }

            // 🎯 CORREGIR ACTIVIDADES DE ESCRITURA
            if (actividad.tipo === 'escritura') {
                if (!actividad.contenido || !actividad.contenido.consigna) {
                    console.warn(`🔄 Corrigiendo actividad escritura ${index} (${actividad.id})`);
                    
                    actividad.contenido = actividad.contenido || {};
                    actividad.contenido.consigna = actividad.contenido.consigna || actividad.titulo || "Escribe un texto sobre...";
                    actividad.contenido.placeholder = actividad.contenido.placeholder || "Escribe tu respuesta aquí...";
                    actividad.contenido.palabras_minimas = actividad.contenido.palabras_minimas || 50;
                    
                    if (!actividad.respuesta_correcta) {
                        actividad.respuesta_correcta = {
                            tipo: "evaluacion_manual",
                            criterios: ["Claridad", "Precisión", "Coherencia"]
                        };
                    }
                    
                    actividadesCorregidas++;
                }
            }

            // 🎯 CORREGIR ACTIVIDADES DE COMPLETAR ESPACIOS
            if (actividad.tipo === 'completar_espacios') {
                if (!actividad.contenido || !actividad.contenido.texto) {
                    console.warn(`🔄 Corrigiendo actividad completar espacios ${index} (${actividad.id})`);
                    
                    actividad.contenido = actividad.contenido || {};
                    actividad.contenido.texto = actividad.contenido.texto || "Este es un texto de ejemplo con ______ espacios.";
                    actividad.contenido.palabras_faltantes = actividad.contenido.palabras_faltantes || ["palabras"];
                    
                    if (!actividad.respuesta_correcta) {
                        actividad.respuesta_correcta = {
                            respuestas: actividad.contenido.palabras_faltantes,
                            tipo: "palabras"
                        };
                    }
                    
                    actividadesCorregidas++;
                }
            }

            // 🎯 CORREGIR ACTIVIDADES DE EMPAREJAMIENTO
            if (actividad.tipo === 'emparejamiento') {
                if (!actividad.contenido || !actividad.contenido.pares || actividad.contenido.pares.length === 0) {
                    console.warn(`🔄 Corrigiendo actividad emparejamiento ${index} (${actividad.id})`);
                    
                    actividad.contenido = actividad.contenido || {};
                    actividad.contenido.pares = actividad.contenido.pares || [
                        { item: "Elemento A", match: "Corresponde a A" },
                        { item: "Elemento B", match: "Corresponde a B" }
                    ];
                    actividad.contenido.instrucciones = actividad.contenido.instrucciones || "Empareja cada elemento con su correspondiente";
                    
                    if (!actividad.respuesta_correcta) {
                        actividad.respuesta_correcta = {
                            respuestas: [0, 1],
                            tipo: "pares_ordenados"
                        };
                    }
                    
                    actividadesCorregidas++;
                }
            }
        });
        
        console.log(`✅ ${actividadesCorregidas} actividades corregidas`);
        console.groupEnd();
        
        return actividadesCorregidas;
    }

    async function init() {
        console.log('🚀 Iniciando Editor de Lección...');
        
        try {
            await waitForDependencies();
            
            if (!verificarPermisosAdmin()) {
                window.location.href = '/pages/auth/login.html';
                return;
            }
            
            inicializarEditor();
            inicializarQuill();
            setupEventListeners();
            
            const urlParams = new URLSearchParams(window.location.search);
            leccionId = urlParams.get('id');
            
            if (leccionId) {
                console.log('🔄 Cargando lección existente ID:', leccionId);
                await new Promise(resolve => setTimeout(resolve, 500));
                await cargarLeccionExistente(leccionId);
            } else {
                console.log('🆕 Creando nueva lección...');
                document.title = 'Crear Nueva Lección - SpeakLexi';
                actualizarProgreso();
            }
            
            if (window.ActividadManager) {
                window.ActividadManager.init();
            }
            
            iniciarAutoSave();
            console.log('✅ Editor de Lección inicializado completamente');
        } catch (error) {
            console.error('❌ Error en inicialización:', error);
            window.toastManager?.error('Error al inicializar el editor: ' + error.message);
        }
    }

    function inicializarEditor() {
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

        try {
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
            
            console.log('✅ Quill inicializado correctamente');
        } catch (error) {
            console.error('❌ Error inicializando Quill:', error);
        }
    }

    function setupEventListeners() {
        document.querySelectorAll('.badge-progreso').forEach(badge => {
            badge.addEventListener('click', (e) => {
                e.preventDefault();
                const etapa = badge.dataset.etapa;
                navegarAModulo(etapa);
            });
        });

        document.querySelectorAll('#form-leccion input, #form-leccion select, #form-leccion textarea').forEach(input => {
            input.addEventListener('input', () => {
                if (['titulo', 'descripcion', 'nivel', 'idioma'].includes(input.name)) {
                    marcarModuloCompletado('info');
                }
                actualizarProgreso();
            });
        });

        document.getElementById('btn-agregar-actividad')?.addEventListener('click', () => {
            if (window.ActividadManager) {
                window.ActividadManager.mostrarModalTipo();
            }
        });
        
        document.getElementById('btn-cancelar-tipo')?.addEventListener('click', () => {
            if (window.ActividadManager) {
                window.ActividadManager.ocultarModalTipo();
            }
        });
        
        document.getElementById('btn-seleccionar-archivos')?.addEventListener('click', () => {
            document.getElementById('input-archivos').click();
        });
        
        document.getElementById('input-archivos')?.addEventListener('change', manejarSubidaArchivos);
        document.getElementById('btn-guardar-borrador')?.addEventListener('click', guardarBorrador);
        
        document.getElementById('btn-vista-previa')?.addEventListener('click', mostrarVistaPrevia);
        
        const formLeccion = document.getElementById('form-leccion');
        if (formLeccion) {
            formLeccion.addEventListener('submit', (e) => {
                e.preventDefault();
                publicarLeccion(e);
            });
        }

        setupDragAndDrop();
    }

    function setupDragAndDrop() {
        const dropZone = document.getElementById('zona-upload');
        if (!dropZone) return;
        
        const preventDefaults = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-over'), false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-over'), false);
        });
        
        dropZone.addEventListener('drop', (e) => {
            manejarArchivosSeleccionados(e.dataTransfer.files);
        }, false);
    }

    async function cargarLeccionExistente(id) {
        try {
            console.log('📥 Cargando lección ID:', id);
            
            const endpoint = `/lecciones/${id}`;
            const response = await window.apiClient.get(endpoint);
            
            console.log('📦 Respuesta COMPLETA:', response);
            
            if (!response.success) {
                throw new Error(response.error || 'Error al cargar lección');
            }
            
            let datos = null;
            
            if (response.data && response.data.data && response.data.data.titulo) {
                datos = response.data.data;
                console.log('✅ Datos extraídos de: response.data.data');
            } else if (response.data && response.data.titulo) {
                datos = response.data;
                console.log('✅ Datos extraídos de: response.data');
            } else if (response.titulo) {
                datos = response;
                console.log('✅ Datos extraídos de: response');
            }
            
            if (!datos || !datos.titulo) {
                console.error('❌ No se encontraron datos válidos');
                throw new Error('Datos de lección inválidos o vacíos');
            }
            
            leccionData = datos;
            await new Promise(resolve => setTimeout(resolve, 300));
            cargarDatosEnFormulario(leccionData);
            
            // 🎯 CORREGIDO: Cargar actividades con formato correcto
            if (leccionData.actividades && Array.isArray(leccionData.actividades)) {
                console.log('📦 Actividades cargadas desde servidor:', leccionData.actividades);
                
                // Convertir actividades del backend al formato del editor
                actividades = convertirActividadesDesdeBackend(leccionData.actividades);
                
                // 🎯 APLICAR CORRECCIÓN A ACTIVIDADES CARGADAS
                diagnosticarYCorregirActividades();
                
                if (window.ActividadManager) {
                    window.ActividadManager.actividades = actividades;
                    actividades.forEach(act => {
                        window.ActividadManager.mostrarActividad(act);
                    });
                    console.log('✅ Actividades cargadas en el manager:', actividades.length);
                }
            } else {
                console.warn('⚠️ No se encontraron actividades en la lección');
                actividades = [];
            }
            
            if (leccionData.multimedia && Array.isArray(leccionData.multimedia)) {
                archivosMultimedia = leccionData.multimedia;
                actualizarGaleriaMultimedia();
            }
            
            window.toastManager.success('Lección cargada exitosamente');
            
        } catch (error) {
            console.error('❌ Error cargando lección:', error);
            
            let mensajeError = 'Error al cargar la lección: ';
            if (error.message.includes('Network Error')) {
                mensajeError += 'No se pudo conectar al servidor';
            } else if (error.message.includes('404')) {
                mensajeError += 'Lección no encontrada';
            } else {
                mensajeError += error.message;
            }
            
            window.toastManager.error(mensajeError);
        }
    }

    function cargarDatosEnFormulario(leccion) {
        console.log('📝 Cargando datos en formulario:', leccion);
        
        if (!leccion) {
            console.error('❌ No hay datos de lección para cargar');
            return;
        }
        
        const elementos = {
            titulo: document.querySelector('input[name="titulo"]'),
            descripcion: document.querySelector('textarea[name="descripcion"]'),
            idioma: document.querySelector('select[name="idioma"]'),
            nivel: document.querySelector('select[name="nivel"]'),
            duracion: document.querySelector('input[name="duracion_minutos"]'),
            orden: document.querySelector('input[name="orden"]')
        };
        
        if (elementos.titulo && leccion.titulo) {
            elementos.titulo.value = leccion.titulo;
        }
        if (elementos.descripcion && leccion.descripcion) {
            elementos.descripcion.value = leccion.descripcion;
        }
        if (elementos.idioma && leccion.idioma) {
            elementos.idioma.value = leccion.idioma;
        }
        if (elementos.nivel && leccion.nivel) {
            elementos.nivel.value = leccion.nivel;
        }
        if (elementos.duracion) {
            elementos.duracion.value = leccion.duracion_minutos || 30;
        }
        if (elementos.orden) {
            elementos.orden.value = leccion.orden || 0;
        }
        
        if (leccion.contenido && editorQuill) {
            setTimeout(() => {
                editorQuill.root.innerHTML = leccion.contenido;
            }, 100);
        }
        
        if (leccion.titulo) {
            document.title = `Editando: ${leccion.titulo} - SpeakLexi`;
        }
        
        if (leccion.titulo) marcarModuloCompletado('info');
        if (leccion.contenido) marcarModuloCompletado('contenido');
        
        actualizarProgreso();
    }

    // 🎯 NUEVA FUNCIÓN: Convertir actividades del backend al formato del editor
    function convertirActividadesDesdeBackend(actividadesBackend) {
        console.log('🔄 Convirtiendo actividades desde backend:', actividadesBackend);
        
        if (!actividadesBackend || !Array.isArray(actividadesBackend)) {
            return [];
        }

        return actividadesBackend.map((actividad, index) => {
            const tipoEditor = TIPO_MAPPING_EDITOR[actividad.tipo] || actividad.tipo;
            
            // Estructura base para editor
            const actividadEditor = {
                id: actividad.id || `act-${Date.now()}-${index}`,
                tipo: tipoEditor,
                titulo: actividad.titulo || `Actividad ${index + 1}`,
                puntos: actividad.puntos_maximos || 10,
                orden: actividad.orden || index + 1,
                contenido: {},
                respuesta_correcta: {}
            };

            // Convertir contenido según el tipo
            switch(actividad.tipo) {
                case 'multiple_choice':
                    actividadEditor.contenido = {
                        pregunta: actividad.contenido?.pregunta || actividad.titulo,
                        opciones: actividad.contenido?.opciones || [],
                        explicacion: actividad.contenido?.explicacion || ""
                    };
                    actividadEditor.respuesta_correcta = {
                        respuestas: actividad.respuesta_correcta?.respuestas || [0]
                    };
                    break;

                case 'fill_blank':
                    actividadEditor.contenido = {
                        texto: actividad.contenido?.texto || "",
                        palabras_faltantes: actividad.contenido?.espacios || [],
                        explicacion: actividad.contenido?.explicacion || ""
                    };
                    break;

                case 'matching':
                    actividadEditor.contenido = {
                        pares: actividad.contenido?.pares || [],
                        instrucciones: actividad.contenido?.instrucciones || "Empareja cada elemento",
                        explicacion: actividad.contenido?.explicacion || ""
                    };
                    break;

                case 'true_false':
                    actividadEditor.contenido = {
                        afirmaciones: actividad.contenido?.afirmaciones || [],
                        explicacion: actividad.contenido?.explicacion || ""
                    };
                    actividadEditor.respuesta_correcta = {
                        respuestas: actividad.respuesta_correcta?.respuestas || []
                    };
                    break;

                case 'writing':
                    actividadEditor.contenido = {
                        consigna: actividad.contenido?.consigna || actividad.titulo,
                        placeholder: actividad.contenido?.placeholder || "Escribe tu respuesta...",
                        palabras_minimas: actividad.contenido?.palabras_minimas || 50,
                        explicacion: actividad.contenido?.explicacion || ""
                    };
                    actividadEditor.respuesta_correcta = {
                        tipo: "evaluacion_manual",
                        criterios: actividad.respuesta_correcta?.criterios || ["Claridad", "Precisión", "Coherencia"]
                    };
                    break;

                default:
                    // Para tipos desconocidos, mantener estructura original
                    actividadEditor.contenido = actividad.contenido || {};
                    actividadEditor.respuesta_correcta = actividad.respuesta_correcta || {};
                    break;
            }

            console.log(`✅ Actividad ${index} convertida para editor:`, actividadEditor);
            return actividadEditor;
        });
    }

    // 🎯 NUEVA FUNCIÓN: Formatear actividades para el backend
    function formatearActividadesParaBackend(actividadesEditor) {
        console.log('🔄 Formateando actividades para backend:', actividadesEditor);
        
        if (!actividadesEditor || !Array.isArray(actividadesEditor)) {
            return [];
        }

        return actividadesEditor.map((actividad, index) => {
            const tipoBackend = TIPO_MAPPING_BACKEND[actividad.tipo] || actividad.tipo;
            
            // Estructura base para backend
            const actividadBackend = {
                id: actividad.id || `act-${Date.now()}-${index}`,
                titulo: actividad.titulo || `Actividad ${index + 1}`,
                descripcion: actividad.descripcion || "",
                tipo: tipoBackend,
                puntos_maximos: actividad.puntos || actividad.puntos_maximos || 10,
                orden: actividad.orden || index + 1,
                estado: actividad.estado || 'activo',
                contenido: {},
                respuesta_correcta: {}
            };

            // Formatear contenido según el tipo
            switch(actividad.tipo) {
                case 'seleccion_multiple':
                    actividadBackend.contenido = {
                        pregunta: actividad.contenido?.pregunta || actividad.titulo,
                        opciones: actividad.contenido?.opciones || [],
                        explicacion: actividad.contenido?.explicacion || ""
                    };
                    actividadBackend.respuesta_correcta = {
                        respuestas: actividad.respuesta_correcta?.respuestas || [0],
                        tipo: "indices"
                    };
                    break;

                case 'completar_espacios':
                    actividadBackend.contenido = {
                        texto: actividad.contenido?.texto || "",
                        espacios: actividad.contenido?.palabras_faltantes || [],
                        explicacion: actividad.contenido?.explicacion || ""
                    };
                    actividadBackend.respuesta_correcta = {
                        respuestas: actividad.contenido?.palabras_faltantes || [],
                        tipo: "palabras"
                    };
                    break;

                case 'emparejamiento':
                    actividadBackend.contenido = {
                        pares: actividad.contenido?.pares || [],
                        instrucciones: actividad.contenido?.instrucciones || "Empareja cada elemento",
                        explicacion: actividad.contenido?.explicacion || ""
                    };
                    actividadBackend.respuesta_correcta = {
                        respuestas: actividad.contenido?.pares?.map((_, idx) => idx) || [],
                        tipo: "pares_ordenados"
                    };
                    break;

                case 'verdadero_falso':
                    actividadBackend.contenido = {
                        afirmaciones: actividad.contenido?.afirmaciones || [],
                        explicacion: actividad.contenido?.explicacion || ""
                    };
                    actividadBackend.respuesta_correcta = {
                        respuestas: actividad.respuesta_correcta?.respuestas || [],
                        tipo: "booleanos"
                    };
                    break;

                case 'escritura':
                    actividadBackend.contenido = {
                        consigna: actividad.contenido?.consigna || actividad.titulo,
                        placeholder: actividad.contenido?.placeholder || "Escribe tu respuesta...",
                        palabras_minimas: actividad.contenido?.palabras_minimas || 50,
                        explicacion: actividad.contenido?.explicacion || ""
                    };
                    actividadBackend.respuesta_correcta = {
                        tipo: "evaluacion_manual",
                        criterios: actividad.respuesta_correcta?.criterios || ["Claridad", "Precisión", "Coherencia"]
                    };
                    break;

                default:
                    // Para tipos desconocidos, mantener estructura original
                    actividadBackend.contenido = actividad.contenido || {};
                    actividadBackend.respuesta_correcta = actividad.respuesta_correcta || {};
                    break;
            }

            console.log(`✅ Actividad ${index} formateada para backend:`, actividadBackend);
            return actividadBackend;
        });
    }

    async function manejarArchivosSeleccionados(files) {
        if (!leccionId) {
            window.toastManager.warning('Guarda la lección primero antes de subir archivos');
            return;
        }

        for (let file of files) {
            if (!config.allowedFileTypes.includes(file.type)) {
                window.toastManager.error(`Tipo de archivo no permitido: ${file.type}`);
                continue;
            }

            if (file.size > config.maxFileSize) {
                window.toastManager.error(`Archivo demasiado grande: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
                continue;
            }

            try {
                const formData = new FormData();
                formData.append('archivo', file);
                formData.append('leccion_id', leccionId);

                const response = await window.apiClient.uploadFile('/multimedia/subir', formData);
                
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

    function manejarSubidaArchivos(e) {
        manejarArchivosSeleccionados(e.target.files);
    }

    function actualizarGaleriaMultimedia() {
        const galeria = document.getElementById('galeria-archivos');
        if (!galeria) return;

        if (archivosMultimedia.length === 0) {
            galeria.innerHTML = '';
            return;
        }

        galeria.innerHTML = archivosMultimedia.map(archivo => `
            <div class="archivo-item bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div class="flex items-center gap-3">
                    <i class="fas fa-${obtenerIconoArchivo(archivo.tipo_archivo || archivo.tipo)} text-purple-500"></i>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900 dark:text-white truncate">${archivo.nombre_archivo || archivo.nombre}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">${formatearTamañoArchivo(archivo.tamaño)}</p>
                    </div>
                    <button onclick="window.leccionEditor.eliminarArchivo('${archivo.id}')" 
                            class="text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        const contador = document.getElementById('contador-multimedia');
        if (contador) {
            contador.textContent = `${archivosMultimedia.length} archivo${archivosMultimedia.length !== 1 ? 's' : ''}`;
        }
        
        marcarModuloCompletado('multimedia');
        actualizarProgreso();
    }

    function obtenerIconoArchivo(tipo) {
        if (!tipo) return 'file';
        if (tipo.startsWith('image/')) return 'file-image';
        if (tipo.startsWith('video/')) return 'file-video';
        if (tipo.startsWith('audio/')) return 'file-audio';
        if (tipo === 'application/pdf') return 'file-pdf';
        return 'file';
    }

    function formatearTamañoArchivo(bytes) {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async function guardarBorrador(e) {
        if (e) e.preventDefault();
        await guardarLeccion('borrador');
    }

    async function publicarLeccion(e) {
        if (e) e.preventDefault();
        
        const titulo = document.querySelector('input[name="titulo"]')?.value;
        if (!titulo) {
            window.toastManager.error('El título es obligatorio');
            return;
        }
        
        await guardarLeccion('activa');
    }

    // ✅ CORREGIDO: Flujo de guardado mejorado con actividades formateadas
    async function guardarLeccion(estado = 'borrador') {
        try {
            // 🎯 APLICAR CORRECCIÓN ANTES DE GUARDAR
            diagnosticarYCorregirActividades();

            const formData = new FormData(document.getElementById('form-leccion'));
            const contenido = editorQuill ? editorQuill.root.innerHTML : '';

            // 🎯 OBTENER Y FORMATEAR ACTIVIDADES PARA BACKEND
            let actividadesParaGuardar = [];
            
            if (window.ActividadManager && window.ActividadManager.actividades) {
                console.log('📦 Actividades del manager:', window.ActividadManager.actividades);
                actividadesParaGuardar = formatearActividadesParaBackend(window.ActividadManager.actividades);
            } else if (actividades && actividades.length > 0) {
                console.log('📦 Actividades del array local:', actividades);
                actividadesParaGuardar = formatearActividadesParaBackend(actividades);
            } else {
                console.warn('⚠️ No se encontraron actividades para guardar');
            }

            console.log('🎯 Actividades formateadas para guardar:', actividadesParaGuardar);

            const datosLeccion = {
                titulo: formData.get('titulo'),
                descripcion: formData.get('descripcion') || '',
                nivel: formData.get('nivel'),
                idioma: formData.get('idioma'),
                duracion_minutos: parseInt(formData.get('duracion_minutos') || 30),
                orden: parseInt(formData.get('orden') || 0),
                contenido: contenido,
                estado: estado,
                actividades: actividadesParaGuardar, // 🎯 ACTIVIDADES FORMATEADAS
                multimedia: archivosMultimedia
            };

            console.log('💾 Guardando lección con actividades:', datosLeccion);

            let response;
            
            if (leccionId) {
                response = await window.apiClient.put(`/lecciones/${leccionId}`, datosLeccion);
            } else {
                response = await window.apiClient.post('/lecciones', datosLeccion);
            }

            console.log('📦 Respuesta guardar:', response);

            if (response.success) {
                const mensaje = estado === 'activa' ? 'Lección publicada exitosamente' : 'Borrador guardado exitosamente';
                window.toastManager.success(mensaje);
                
                if (!leccionId && response.data) {
                    const serverData = response.data;
                    const nuevoId = serverData.data?.id || serverData.data?.leccion_id || serverData.id || serverData.leccion_id;
                    
                    if (nuevoId) {
                        leccionId = nuevoId;
                        console.log('✅ Lección creada con ID:', leccionId);
                        window.history.replaceState({}, '', `?id=${leccionId}`);
                    }
                }
                
                if (estado === 'activa') {
                    setTimeout(() => {
                        window.location.href = '/pages/admin/gestion-lecciones.html';
                    }, 1500);
                }
            } else {
                throw new Error(response.error || 'Error al guardar');
            }
        } catch (error) {
            console.error('❌ Error guardando lección:', error);
            window.toastManager.error('Error al guardar la lección: ' + error.message);
        }
    }

    function iniciarAutoSave() {
        autoSaveInterval = setInterval(() => {
            const titulo = document.querySelector('input[name="titulo"]')?.value;
            if (leccionId && titulo) {
                console.log('💾 Auto-guardado...');
                guardarBorrador();
            }
        }, config.autoSaveDelay);
    }

    function mostrarVistaPrevia() {
        const titulo = document.querySelector('input[name="titulo"]')?.value || 'Sin título';
        const descripcion = document.querySelector('textarea[name="descripcion"]')?.value || '';
        const contenido = editorQuill ? editorQuill.root.innerHTML : '';
        
        if (window.LeccionPreview) {
            window.LeccionPreview.mostrar({
                titulo: titulo,
                descripcion: descripcion,
                contenido: contenido,
                actividades: actividades,
                multimedia: archivosMultimedia
            });
        } else {
            window.toastManager.warning('Módulo de vista previa no disponible');
        }
    }

    function actualizarContadorActividades() {
        const contador = document.getElementById('contador-actividades');
        if (contador) {
            contador.textContent = `${actividades.length} actividad${actividades.length !== 1 ? 'es' : ''}`;
        }
        
        const placeholder = document.getElementById('placeholder-actividades');
        if (placeholder) {
            placeholder.style.display = actividades.length > 0 ? 'none' : 'block';
        }
    }

    function actualizarProgreso() {
        const progresoBar = document.getElementById('progreso-bar');
        const progresoPorcentaje = document.getElementById('progreso-porcentaje');
        
        if (!progresoBar || !progresoPorcentaje) return;
        
        let progreso = 0;
        const titulo = document.querySelector('input[name="titulo"]')?.value;
        const contenido = editorQuill?.getText().trim();
        
        if (titulo) progreso += 25;
        if (contenido && contenido.length > 10) progreso += 25;
        if (actividades.length > 0) progreso += 25;
        if (archivosMultimedia.length > 0) progreso += 25;
        
        progresoBar.style.width = `${progreso}%`;
        progresoPorcentaje.textContent = `${progreso}%`;
    }

    function marcarModuloCompletado(modulo) {
        const badge = document.querySelector(`.badge-progreso[data-etapa="${modulo}"]`);
        if (badge) badge.classList.add('completado');
    }

    function navegarAModulo(modulo) {
        document.querySelectorAll('.editor-modulo').forEach(mod => {
            mod.classList.remove('active');
        });
        document.getElementById(`modulo-${modulo}`)?.classList.add('active');
    }

    async function waitForDependencies() {
        const dependencies = ['apiClient', 'toastManager', 'APP_CONFIG', 'Quill'];
        const maxWaitTime = 10000;
        const startTime = Date.now();
        
        while (dependencies.some(dep => !window[dep])) {
            if (Date.now() - startTime > maxWaitTime) {
                console.error('❌ Timeout esperando dependencias');
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log('✅ Dependencias cargadas');
    }

    function verificarPermisosAdmin() {
        try {
            const usuario = window.Utils?.getFromStorage(window.APP_CONFIG?.STORAGE?.KEYS?.USUARIO) || 
                           JSON.parse(localStorage.getItem('usuario') || '{}');
            const token = localStorage.getItem('token');
            
            if (!token) {
                window.toastManager?.error('Debes iniciar sesión');
                return false;
            }
            
            const rol = (usuario.rol || usuario.role || '').toLowerCase();
            if (!['admin', 'administrador', 'profesor'].includes(rol)) {
                window.toastManager?.error('No tienes permisos para esta página');
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Error verificando permisos:', error);
            return false;
        }
    }

    window.addEventListener('beforeunload', () => {
        if (autoSaveInterval) clearInterval(autoSaveInterval);
    });

    // API PÚBLICA GLOBAL
    window.leccionEditor = {
        getLeccionId: () => leccionId,
        getLeccionData: () => leccionData,
        getActividades: () => actividades,
        getArchivosMultimedia: () => archivosMultimedia,
        
        setActividades: (nuevasActividades) => {
            actividades = nuevasActividades;
            actualizarContadorActividades();
        },
        
        actualizarProgreso: () => actualizarProgreso(),
        marcarModuloCompletado: (modulo) => marcarModuloCompletado(modulo),
        actualizarContadorActividades: () => actualizarContadorActividades(),
        
        recargarActividad: (actividadId) => {
            const actividad = actividades.find(a => a.id === actividadId);
            if (!actividad) {
                console.warn('⚠️ Actividad no encontrada:', actividadId);
                return;
            }
            
            const elemento = document.querySelector(`[data-actividad-id="${actividadId}"]`);
            if (!elemento) {
                console.warn('⚠️ Elemento HTML de actividad no encontrado');
                return;
            }
            
            elemento.remove();
            
            if (window.ActividadManager) {
                window.ActividadManager.mostrarActividad(actividad);
            }
        },
        
        mostrarToast: (mensaje, tipo = 'info') => {
            if (window.toastManager) {
                window.toastManager[tipo](mensaje);
            } else {
                console.log(`[${tipo}] ${mensaje}`);
            }
        },
        
        eliminarArchivo: (id) => {
            if (confirm('¿Estás seguro de eliminar este archivo?')) {
                archivosMultimedia = archivosMultimedia.filter(a => a.id != id);
                actualizarGaleriaMultimedia();
                window.toastManager.success('Archivo eliminado');
            }
        },

        // 🎯 EXPONER LA FUNCIÓN DE CORRECCIÓN
        diagnosticarYCorregirActividades: () => diagnosticarYCorregirActividades()
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 100);
    }

})();