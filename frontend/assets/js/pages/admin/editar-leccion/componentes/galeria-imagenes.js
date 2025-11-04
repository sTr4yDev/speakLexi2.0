/* ============================================
   SPEAKLEXI - EDITOR LECCIÓN - GALERÍA IMÁGENES
   Archivo: assets/js/pages/admin/editor-leccion/componentes/galeria-imagenes.js
   ============================================ */

window.GaleriaManager = {
    imagenSeleccionada: null,
    contextoActual: null,

    init() {
        this.setupEventListeners();
    },

    setupEventListeners() {
        // Los event listeners se configurarán cuando se abra la galería
    },

    // Abrir galería de imágenes
    abrir(contexto) {
        this.contextoActual = contexto;
        this.imagenSeleccionada = null;
        
        const modal = document.getElementById('modal-galeria-imagenes');
        if (modal) {
            modal.classList.remove('hidden');
            this.actualizarBotonSeleccion();
            this.cargarImagenes();
        }
    },

    // Cerrar galería
    cerrar() {
        const modal = document.getElementById('modal-galeria-imagenes');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.imagenSeleccionada = null;
        this.contextoActual = null;
    },

    // Cargar imágenes de la galería
    cargarImagenes() {
        const galeria = document.getElementById('galeria-imagenes-contenido');
        const contador = document.getElementById('contador-galeria');
        
        if (!galeria) return;

        galeria.innerHTML = `
            <div class="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                <p>Cargando galería...</p>
            </div>
        `;

        try {
            const archivos = window.leccionEditor.getArchivosMultimedia();
            const imagenes = archivos.filter(archivo => 
                archivo.tipo && archivo.tipo.startsWith('image/')
            );

            if (contador) {
                contador.textContent = imagenes.length;
            }

            if (imagenes.length === 0) {
                galeria.innerHTML = this.generarHTMLGaleriaVacia();
                return;
            }

            galeria.innerHTML = imagenes.map(imagen => 
                this.generarHTMLItemGaleria(imagen)
            ).join('');

            this.configurarFiltros();

        } catch (error) {
            console.error('Error cargando galería:', error);
            galeria.innerHTML = this.generarHTMLError(error);
        }
    },

    generarHTMLItemGaleria(imagen) {
        return `
            <div class="galeria-item cursor-pointer border-2 border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden hover:border-purple-500 dark:hover:border-purple-400 transition-all bg-white dark:bg-gray-700"
                 onclick="GaleriaManager.seleccionarImagen('${imagen.id}')"
                 data-imagen-id="${imagen.id}">
                <div class="aspect-w-1 aspect-h-1 bg-gray-100 dark:bg-gray-600">
                    <img src="${imagen.url}" alt="${imagen.nombre}" 
                         class="w-full h-32 object-cover hover:scale-105 transition-transform duration-200">
                </div>
                <div class="p-2">
                    <p class="text-xs text-gray-600 dark:text-gray-400 truncate mb-1">${imagen.nombre}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-500">${this.formatearTamaño(imagen.tamaño)}</p>
                </div>
            </div>
        `;
    },

    generarHTMLGaleriaVacia() {
        return `
            <div class="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                <i class="fas fa-image text-4xl mb-4 opacity-50"></i>
                <p class="text-lg">No hay imágenes en la galería</p>
                <p class="text-sm mb-4">Sube algunas imágenes para verlas aquí</p>
                <button type="button" onclick="GaleriaManager.subirNuevaImagen()"
                        class="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors">
                    <i class="fas fa-upload mr-2"></i>Subir Primera Imagen
                </button>
            </div>
        `;
    },

    generarHTMLError(error) {
        return `
            <div class="col-span-full text-center py-12 text-red-500 dark:text-red-400">
                <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                <p>Error cargando la galería</p>
                <p class="text-sm">${error.message}</p>
            </div>
        `;
    },

    // Seleccionar imagen en la galería
    seleccionarImagen(imagenId) {
        // Remover selección anterior
        document.querySelectorAll('.galeria-item').forEach(item => {
            item.classList.remove('border-purple-500', 'dark:border-purple-400', 'ring-2', 'ring-purple-500');
        });
        
        // Marcar como seleccionada
        const item = document.querySelector(`[data-imagen-id="${imagenId}"]`);
        if (item) {
            item.classList.add('border-purple-500', 'dark:border-purple-400', 'ring-2', 'ring-purple-500');
        }
        
        const archivos = window.leccionEditor.getArchivosMultimedia();
        this.imagenSeleccionada = archivos.find(archivo => archivo.id === imagenId);
        
        this.actualizarInfoSeleccion();
        this.actualizarBotonSeleccion();
    },

    actualizarInfoSeleccion() {
        const info = document.getElementById('info-seleccion-galeria');
        if (!info || !this.imagenSeleccionada) return;

        info.innerHTML = `
            <div class="flex items-center gap-3">
                <img src="${this.imagenSeleccionada.url}" alt="${this.imagenSeleccionada.nombre}" 
                     class="w-12 h-12 object-cover rounded border">
                <div>
                    <p class="font-medium text-gray-900 dark:text-white">${this.imagenSeleccionada.nombre}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">${this.formatearTamaño(this.imagenSeleccionada.tamaño)}</p>
                </div>
            </div>
        `;
    },

    actualizarBotonSeleccion() {
        const boton = document.getElementById('btn-seleccionar-galeria');
        if (boton) {
            boton.disabled = !this.imagenSeleccionada;
        }
    },

    // Confirmar selección de imagen
    seleccionar() {
        if (!this.imagenSeleccionada || !this.contextoActual) {
            window.leccionEditor.mostrarToast('❌ No hay imagen seleccionada', 'error');
            return;
        }

        const { actividadId, tipoCampo } = this.contextoActual;

        // Delegar al manager de actividades correspondiente
        if (tipoCampo === 'pregunta') {
            if (window.ActividadManager) {
                const actividad = window.leccionEditor.getActividades().find(a => a.id === actividadId);
                if (actividad) {
                    actividad.contenido.imagen = this.imagenSeleccionada;
                    window.leccionEditor.recargarActividad(actividadId);
                }
            }
        }

        this.cerrar();
        window.leccionEditor.mostrarToast('✅ Imagen seleccionada de la galería');
    },

    // Subir nueva imagen desde la galería
    subirNuevaImagen() {
        this.cerrar();
        
        if (this.contextoActual) {
            const { actividadId, tipoCampo } = this.contextoActual;
            
            // Reabrir el selector de archivos
            window.currentImageContext = { actividadId, tipoCampo };
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.click();
        }
    },

    // Configurar filtros de galería
    configurarFiltros() {
        const buscarInput = document.getElementById('buscar-galeria');
        const filtroSelect = document.getElementById('filtro-tipo-galeria');
        
        if (buscarInput) {
            buscarInput.addEventListener('input', () => this.filtrarGaleria());
        }
        
        if (filtroSelect) {
            filtroSelect.addEventListener('change', () => this.filtrarGaleria());
        }
    },

    filtrarGaleria() {
        const busqueda = document.getElementById('buscar-galeria')?.value.toLowerCase() || '';
        
        document.querySelectorAll('.galeria-item').forEach(item => {
            const nombre = item.querySelector('p').textContent.toLowerCase();
            const mostrar = nombre.includes(busqueda);
            item.style.display = mostrar ? 'block' : 'none';
        });
    },

    formatearTamaño(bytes) {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.GaleriaManager.init();
    });
} else {
    window.GaleriaManager.init();
}