/* ============================================
   SPEAKLEXI - EDITOR LECCIÓN - SISTEMA GUARDADO CORREGIDO
   Archivo: assets/js/pages/admin/editor-leccion/componentes/guardado.js
   ============================================ */

window.GuardadoManager = {
    autoSaveInterval: null,
    ultimoGuardado: null,

    init() {
        this.iniciarAutoSave();
        this.setupEventListeners();
    },

    setupEventListeners() {
        // Los event listeners principales están en el archivo principal
    },

    // Iniciar auto-guardado
    iniciarAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            if (this.debeGuardar()) {
                this.guardarBorrador();
            }
        }, 30000); // 30 segundos
    },

    // Verificar si debe guardar
    debeGuardar() {
        const actividades = window.leccionEditor.getActividades();
        const archivos = window.leccionEditor.getArchivosMultimedia();
        const leccionId = window.leccionEditor.getLeccionId();
        
        return leccionId || actividades.length > 0 || archivos.length > 0;
    },

    // Guardar como borrador
    async guardarBorrador() {
        try {
            this.mostrarEstado('guardando');
            
            const leccionData = this.recopilarDatosLeccion();
            leccionData.estado = 'borrador';
            
            const leccionId = window.leccionEditor.getLeccionId();
            let response;
            
            if (leccionId) {
                response = await window.apiClient.put(`/lecciones/${leccionId}`, leccionData);
            } else {
                response = await window.apiClient.post('/lecciones/crear', leccionData);
                if (response.success && response.data.id) {
                    // Actualizar el ID de la lección
                    window.history.replaceState({}, '', `?id=${response.data.id}`);
                }
            }
            
            if (response.success) {
                this.mostrarEstado('guardado');
                this.ultimoGuardado = new Date();
                window.leccionEditor.mostrarToast('✅ Borrador guardado', 'success');
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.error('Error guardando borrador:', error);
            this.mostrarEstado('error');
            window.leccionEditor.mostrarToast('❌ Error guardando borrador', 'error');
        }
    },

    // Publicar lección
    async publicar() {
        const errores = this.validarLeccionCompleta();
        if (errores.length > 0) {
            const mensajeErrores = errores.map((error, index) => `${index + 1}. ${error}`).join('\n');
            window.leccionEditor.mostrarToast(`❌ Errores encontrados:\n${mensajeErrores}`, 'error');
            return false;
        }
        
        try {
            this.mostrarEstado('publicando');
            
            const leccionData = this.recopilarDatosLeccion();
            leccionData.estado = 'activa';
            
            const leccionId = window.leccionEditor.getLeccionId();
            let response;
            
            if (leccionId) {
                response = await window.apiClient.put(`/lecciones/${leccionId}`, leccionData);
            } else {
                response = await window.apiClient.post('/lecciones/crear', leccionData);
            }
            
            if (response.success) {
                this.mostrarCelebracion();
                return true;
            } else {
                throw new Error(response.error || 'Error desconocido al publicar');
            }
        } catch (error) {
            console.error('Error publicando lección:', error);
            this.mostrarEstado('error');
            window.leccionEditor.mostrarToast(`❌ Error publicando lección: ${error.message}`, 'error');
            return false;
        }
    },

    // 🎯 CORREGIDO: Recopilar datos de la lección con actividades formateadas
    recopilarDatosLeccion() {
        const datosBasicos = {
            titulo: document.querySelector('input[name="titulo"]')?.value || '',
            descripcion: document.querySelector('textarea[name="descripcion"]')?.value || '',
            contenido: window.editorQuill ? window.editorQuill.root.innerHTML : '',
            nivel: document.querySelector('select[name="nivel"]')?.value || '',
            idioma: document.querySelector('select[name="idioma"]')?.value || '',
            duracion_minutos: parseInt(document.querySelector('input[name="duracion_minutos"]')?.value) || 30,
            orden: parseInt(document.querySelector('input[name="orden"]')?.value) || 0
        };

        // 🎯 CORREGIDO: Procesar actividades con formato backend
        const actividades = window.leccionEditor.getActividades();
        const actividadesProcesadas = this.formatearActividadesParaBackend(actividades);

        // Procesar archivos multimedia
        const archivos = window.leccionEditor.getArchivosMultimedia();
        const archivosProcesados = archivos.map(archivo => ({
            id: archivo.id,
            nombre: archivo.nombre,
            tipo: archivo.tipo,
            url: archivo.url,
            tamaño: archivo.tamaño
        }));

        console.log('💾 Datos listos para guardar:', {
            ...datosBasicos,
            actividades_count: actividadesProcesadas.length,
            archivos_count: archivosProcesados.length
        });

        return {
            ...datosBasicos,
            actividades: actividadesProcesadas,
            archivos_multimedia: archivosProcesados
        };
    },

    // 🎯 NUEVO MÉTODO: Formatear actividades para backend
    formatearActividadesParaBackend(actividadesEditor) {
        console.log('🔄 Formateando actividades para backend:', actividadesEditor);
        
        if (!actividadesEditor || !Array.isArray(actividadesEditor)) {
            return [];
        }

        return actividadesEditor.map((actividad, index) => {
            const tipoBackend = this.obtenerTipoBackend(actividad.tipo);
            
            // 🎯 Estructura base para backend
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

            // 🎯 CORREGIDO: Formatear contenido según el tipo
            switch(actividad.tipo) {
                case 'seleccion_multiple':
                    actividadBackend.contenido = this.formatearContenidoSeleccionMultiple(actividad);
                    actividadBackend.respuesta_correcta = this.formatearRespuestaSeleccionMultiple(actividad);
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
    },

    // 🎯 NUEVO MÉTODO: Formatear contenido de selección múltiple
    formatearContenidoSeleccionMultiple(actividad) {
        console.log('🔄 Formateando contenido selección múltiple:', actividad.contenido);
        
        // 🎯 CORREGIDO: Manejar diferentes estructuras de contenido
        let pregunta = "";
        let opciones = [];
        
        if (actividad.contenido?.preguntas && Array.isArray(actividad.contenido.preguntas)) {
            // Estructura con array de preguntas
            pregunta = actividad.contenido.preguntas[0]?.pregunta || actividad.titulo;
            opciones = actividad.contenido.preguntas[0]?.opciones || [];
        } else if (actividad.contenido?.pregunta) {
            // Estructura con pregunta única
            pregunta = actividad.contenido.pregunta;
            opciones = actividad.contenido.opciones || [];
        } else {
            // Fallback
            pregunta = actividad.titulo;
            opciones = actividad.contenido?.opciones || [];
        }
        
        // 🎯 CORREGIDO: Normalizar opciones
        const opcionesNormalizadas = this.normalizarOpciones(opciones);
        
        console.log('✅ Contenido MC normalizado:', {
            pregunta,
            opciones: opcionesNormalizadas
        });
        
        return {
            pregunta: pregunta,
            opciones: opcionesNormalizadas,
            explicacion: actividad.contenido?.explicacion || ""
        };
    },

    // 🎯 NUEVO MÉTODO: Normalizar opciones
    normalizarOpciones(opciones) {
        console.log('🔄 Normalizando opciones:', opciones);
        
        if (!opciones || !Array.isArray(opciones)) {
            console.warn('⚠️ Opciones no válidas, creando opciones por defecto');
            return this.crearOpcionesPorDefecto();
        }
        
        // Filtrar opciones vacías y normalizar
        const opcionesFiltradas = opciones.filter(opcion => {
            if (typeof opcion === 'string') {
                return opcion.trim() !== '';
            } else if (opcion && typeof opcion === 'object') {
                return (opcion.texto || opcion.opcion || '').trim() !== '';
            }
            return false;
        });
        
        // 🎯 CORREGIDO: Si no hay opciones válidas, crear opciones por defecto
        if (opcionesFiltradas.length === 0) {
            console.warn('⚠️ No hay opciones válidas, creando opciones por defecto');
            return this.crearOpcionesPorDefecto();
        }
        
        // Convertir a formato string simple
        const opcionesNormalizadas = opcionesFiltradas.map((opcion, index) => {
            if (typeof opcion === 'string') {
                return opcion.trim() || `Opción ${index + 1}`;
            } else if (opcion && typeof opcion === 'object') {
                return (opcion.texto || opcion.opcion || `Opción ${index + 1}`).trim();
            }
            return `Opción ${index + 1}`;
        });
        
        console.log('✅ Opciones normalizadas:', opcionesNormalizadas);
        return opcionesNormalizadas;
    },

    // 🎯 NUEVO MÉTODO: Crear opciones por defecto
    crearOpcionesPorDefecto() {
        return [
            "Opción correcta (edita esta opción)",
            "Opción incorrecta 1",
            "Opción incorrecta 2", 
            "Opción incorrecta 3"
        ];
    },

    // 🎯 NUEVO MÉTODO: Formatear respuesta de selección múltiple
    formatearRespuestaSeleccionMultiple(actividad) {
        console.log('🔄 Formateando respuesta selección múltiple:', actividad.respuesta_correcta);
        
        // 🎯 CORREGIDO: Asegurar que haya respuesta correcta
        let respuestas = actividad.respuesta_correcta?.respuestas || [0];
        
        // Si la respuesta está fuera de rango, usar la primera opción
        if (respuestas.length === 0) {
            respuestas = [0];
            console.warn('⚠️ Sin respuesta definida, usando primera opción');
        }
        
        return {
            respuestas: respuestas,
            tipo: "indices"
        };
    },

    // 🎯 NUEVO MÉTODO: Obtener tipo backend
    obtenerTipoBackend(tipoFrontend) {
        const mapeo = {
            'seleccion_multiple': 'multiple_choice',
            'verdadero_falso': 'true_false',
            'completar_espacios': 'fill_blank',
            'emparejamiento': 'matching',
            'escritura': 'writing'
        };
        
        return mapeo[tipoFrontend] || tipoFrontend;
    },

    // Validar lección completa
    validarLeccionCompleta() {
        const errores = [];

        // Validar información básica
        if (!document.querySelector('input[name="titulo"]')?.value.trim()) {
            errores.push('El título de la lección es requerido');
        }

        if (!document.querySelector('textarea[name="descripcion"]')?.value.trim()) {
            errores.push('La descripción de la lección es requerida');
        }

        if (!document.querySelector('select[name="nivel"]')?.value) {
            errores.push('El nivel CEFR es requerido');
        }

        if (!document.querySelector('select[name="idioma"]')?.value) {
            errores.push('El idioma de enseñanza es requerido');
        }

        // Validar contenido
        const contenidoTexto = window.editorQuill ? window.editorQuill.getText().trim() : '';
        if (contenidoTexto.length < 50) {
            errores.push('El contenido de la lección debe tener al menos 50 caracteres');
        }

        // Validar actividades
        const actividades = window.leccionEditor.getActividades();
        if (actividades.length === 0) {
            errores.push('Debes agregar al menos una actividad');
        } else {
            actividades.forEach((actividad, index) => {
                const erroresActividad = this.validarActividad(actividad);
                if (erroresActividad.length > 0) {
                    errores.push(`Actividad "${actividad.titulo || `#${index + 1}`}": ${erroresActividad.join(', ')}`);
                }
            });
        }

        // Validar multimedia
        const archivos = window.leccionEditor.getArchivosMultimedia();
        if (archivos.length === 0) {
            errores.push('Debes agregar al menos un archivo multimedia');
        }

        return errores;
    },

    // 🎯 CORREGIDO: Validar actividad individual
    validarActividad(actividad) {
        const errores = [];

        if (!actividad.titulo || !actividad.titulo.trim()) {
            errores.push('sin título');
        }

        if (actividad.puntos < 1 || actividad.puntos > 100) {
            errores.push('puntos inválidos');
        }

        // 🎯 CORREGIDO: Validaciones específicas por tipo
        switch(actividad.tipo) {
            case 'seleccion_multiple':
                // Validar pregunta
                const tienePregunta = actividad.contenido?.pregunta || 
                                    actividad.contenido?.preguntas?.[0]?.pregunta;
                if (!tienePregunta) {
                    errores.push('sin pregunta');
                }
                
                // 🎯 CORREGIDO: Validar opciones correctamente
                let opciones = [];
                if (actividad.contenido?.preguntas && Array.isArray(actividad.contenido.preguntas)) {
                    opciones = actividad.contenido.preguntas[0]?.opciones || [];
                } else {
                    opciones = actividad.contenido?.opciones || [];
                }
                
                const opcionesValidas = opciones.filter(opcion => {
                    if (typeof opcion === 'string') return opcion.trim() !== '';
                    if (opcion && typeof opcion === 'object') return (opcion.texto || opcion.opcion || '').trim() !== '';
                    return false;
                });
                
                if (opcionesValidas.length < 2) {
                    errores.push('necesita al menos 2 opciones válidas');
                }
                
                // Validar respuesta correcta
                if (!actividad.respuesta_correcta?.respuestas || 
                    !Array.isArray(actividad.respuesta_correcta.respuestas) ||
                    actividad.respuesta_correcta.respuestas.length === 0) {
                    errores.push('sin respuesta correcta definida');
                }
                break;

            case 'verdadero_falso':
                if (!actividad.contenido?.afirmaciones || actividad.contenido.afirmaciones.length === 0) {
                    errores.push('sin afirmaciones');
                }
                break;

            case 'completar_espacios':
                if (!actividad.contenido?.texto || !actividad.contenido.texto.trim()) {
                    errores.push('sin texto');
                }
                if (!actividad.contenido?.palabras_faltantes || actividad.contenido.palabras_faltantes.length === 0) {
                    errores.push('sin palabras faltantes');
                }
                break;

            case 'emparejamiento':
                if (!actividad.contenido?.pares || actividad.contenido.pares.length < 2) {
                    errores.push('necesita al menos 2 pares');
                }
                break;

            case 'escritura':
                if (!actividad.contenido?.consigna || !actividad.contenido.consigna.trim()) {
                    errores.push('sin consigna');
                }
                break;
        }

        return errores;
    },

    // Mostrar estado de guardado
    mostrarEstado(estado) {
        const elemento = document.getElementById('estado-guardado');
        if (!elemento) return;

        const estados = {
            guardando: { icon: 'fa-sync-alt fa-spin', text: 'Guardando...', color: 'text-yellow-500' },
            guardado: { icon: 'fa-check', text: 'Guardado', color: 'text-green-500' },
            publicando: { icon: 'fa-rocket', text: 'Publicando...', color: 'text-purple-500' },
            error: { icon: 'fa-exclamation-triangle', text: 'Error', color: 'text-red-500' }
        };
        
        const info = estados[estado];
        elemento.innerHTML = `<i class="fas ${info.icon} ${info.color}"></i><span>${info.text}</span>`;
    },

    // Mostrar celebración al publicar
    mostrarCelebracion() {
        window.leccionEditor.mostrarToast('🎉 ¡Lección publicada exitosamente!', 'success');
        
        // Redirigir después de un breve delay
        setTimeout(() => {
            window.location.href = 'gestion-lecciones.html';
        }, 2000);
    },

    // Detener auto-guardado
    detener() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
    }
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.GuardadoManager.init();
    });
} else {
    window.GuardadoManager.init();
}