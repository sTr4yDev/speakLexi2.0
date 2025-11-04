/* ============================================
   SPEAKLEXI - EDITOR LECCIÓN - SISTEMA GUARDADO
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

    // Recopilar datos de la lección
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

        // Procesar actividades
        const actividades = window.leccionEditor.getActividades();
        const actividadesProcesadas = actividades.map(actividad => {
            // Validar actividad antes de procesar
            this.validarActividad(actividad);
            
            return {
                tipo: actividad.tipo,
                titulo: actividad.titulo,
                puntos: actividad.puntos,
                orden: actividad.orden,
                contenido: JSON.stringify(actividad.contenido),
                config: JSON.stringify(actividad.config)
            };
        });

        // Procesar archivos multimedia
        const archivos = window.leccionEditor.getArchivosMultimedia();
        const archivosProcesados = archivos.map(archivo => ({
            id: archivo.id,
            nombre: archivo.nombre,
            tipo: archivo.tipo,
            url: archivo.url,
            tamaño: archivo.tamaño
        }));

        return {
            ...datosBasicos,
            actividades: actividadesProcesadas,
            archivos_multimedia: archivosProcesados
        };
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

    // Validar actividad individual
    validarActividad(actividad) {
        const errores = [];

        if (!actividad.titulo || !actividad.titulo.trim()) {
            errores.push('sin título');
        }

        if (actividad.puntos < 1 || actividad.puntos > 100) {
            errores.push('puntos inválidos');
        }

        // Validaciones específicas por tipo
        switch(actividad.tipo) {
            case 'seleccion_multiple':
                if (!actividad.contenido.pregunta || !actividad.contenido.pregunta.trim()) {
                    errores.push('sin pregunta');
                }
                if (!actividad.contenido.opciones || actividad.contenido.opciones.length < 2) {
                    errores.push('necesita al menos 2 opciones');
                }
                if (actividad.contenido.opciones) {
                    const opcionesValidas = actividad.contenido.opciones.filter(opcion => 
                        opcion.texto && opcion.texto.trim()
                    );
                    if (opcionesValidas.length < 2) {
                        errores.push('opciones vacías');
                    }
                    const tieneCorrecta = actividad.contenido.opciones.some(opcion => opcion.correcta);
                    if (!tieneCorrecta) {
                        errores.push('sin opción correcta');
                    }
                }
                break;

            case 'verdadero_falso':
                if (!actividad.contenido.afirmacion || !actividad.contenido.afirmacion.trim()) {
                    errores.push('sin afirmación');
                }
                break;

            case 'completar_espacios':
                if (!actividad.contenido.texto || !actividad.contenido.texto.trim()) {
                    errores.push('sin texto');
                }
                if (!actividad.contenido.palabras_faltantes || actividad.contenido.palabras_faltantes.length === 0) {
                    errores.push('sin palabras faltantes');
                }
                break;

            case 'emparejamiento':
                if (!actividad.contenido.pares || actividad.contenido.pares.length < 2) {
                    errores.push('necesita al menos 2 pares');
                }
                if (actividad.contenido.pares) {
                    const paresValidos = actividad.contenido.pares.filter(par => 
                        par.izquierda && par.izquierda.trim() && par.derecha && par.derecha.trim()
                    );
                    if (paresValidos.length < 2) {
                        errores.push('pares incompletos');
                    }
                }
                break;

            case 'escritura':
                if (!actividad.contenido.consigna || !actividad.contenido.consigna.trim()) {
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
        
        // Efecto visual
        document.body.classList.add('celebrating');
        setTimeout(() => {
            document.body.classList.remove('celebrating');
        }, 3000);
        
        // Redirigir después de un breve delay
        setTimeout(() => {
            window.location.href = 'gestion-lecciones.html';
        }, 3000);
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