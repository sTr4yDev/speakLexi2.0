/* ============================================
   SPEAKLEXI - GESTIÓN DE LECCIONES (ADMIN)
   Archivo: assets/js/pages/admin/gestion-lecciones.js
   ============================================ */
(() => {
    'use strict';

    let leccionesData = [];
    let paginaActual = 1;
    const leccionesPorPagina = 10;

    async function init() {
        await waitForDependencies();
        if (!verificarPermisosAdmin()) return;
        
        setupEventListeners();
        await cargarLecciones();
    }

    function setupEventListeners() {
        // Botones principales
        document.getElementById('btn-crear-leccion').addEventListener('click', mostrarModalCrear);
        document.getElementById('btn-refrescar').addEventListener('click', cargarLecciones);
        
        // Modal crear lección
        document.getElementById('btn-cancelar-crear').addEventListener('click', ocultarModalCrear);
        document.getElementById('btn-guardar-leccion').addEventListener('click', crearLeccion);
        
        // Filtros
        document.getElementById('buscar-leccion').addEventListener('input', filtrarLecciones);
        document.getElementById('filtro-nivel').addEventListener('change', filtrarLecciones);
        
        // Paginación
        document.getElementById('btn-prev').addEventListener('click', () => cambiarPagina(-1));
        document.getElementById('btn-next').addEventListener('click', () => cambiarPagina(1));
        
        // Enter para buscar
        document.getElementById('buscar-leccion').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                filtrarLecciones();
            }
        });
    }

    async function cargarLecciones() {
        try {
            mostrarLoading(true);
            
            // CORRECCIÓN: Ruta API correcta
            const response = await window.apiClient.get('/api/lecciones');
            
            if (response.success) {
                leccionesData = response.data;
                actualizarEstadisticas();
                mostrarLecciones();
            } else {
                throw new Error(response.error || 'Error al cargar lecciones');
            }
        } catch (error) {
            console.error('Error cargando lecciones:', error);
            window.toastManager.error('Error al cargar las lecciones');
            
            // Datos de demostración
            leccionesData = obtenerLeccionesDemo();
            actualizarEstadisticas();
            mostrarLecciones();
        } finally {
            mostrarLoading(false);
        }
    }

    function obtenerLeccionesDemo() {
        return [
            {
                id: 1,
                titulo: "Saludos y Presentaciones Básicas",
                descripcion: "Aprende a saludar y presentarte en situaciones cotidianas",
                nivel: "A1",
                idioma: "Inglés",
                estado: "activa",
                duracion_minutos: 45,
                orden: 1,
                creado_en: new Date().toISOString(),
                creado_por: "María Rodríguez"
            },
            {
                id: 2,
                titulo: "Números y Fechas",
                descripcion: "Domina los números cardinales, ordinales y cómo expresar fechas",
                nivel: "A1",
                idioma: "Inglés", 
                estado: "borrador",
                duracion_minutos: 60,
                orden: 2,
                creado_en: new Date(Date.now() - 86400000).toISOString(),
                creado_por: "María Rodríguez"
            },
            {
                id: 3,
                titulo: "Conversaciones en Restaurante",
                descripcion: "Frases útiles para pedir comida en un restaurante",
                nivel: "A2",
                idioma: "Inglés",
                estado: "inactiva",
                duracion_minutos: 50,
                orden: 3,
                creado_en: new Date(Date.now() - 172800000).toISOString(),
                creado_por: "Carlos Méndez"
            }
        ];
    }

    function actualizarEstadisticas() {
        const total = leccionesData.length;
        const activas = leccionesData.filter(l => l.estado === 'activa').length;
        const borrador = leccionesData.filter(l => l.estado === 'borrador').length;
        const inactivas = leccionesData.filter(l => l.estado === 'inactiva').length;

        document.getElementById('total-lecciones').textContent = total;
        document.getElementById('lecciones-activas').textContent = activas;
        document.getElementById('lecciones-borrador').textContent = borrador;
        document.getElementById('lecciones-inactivas').textContent = inactivas;
    }

    function mostrarLecciones() {
        const tbody = document.getElementById('tabla-lecciones');
        const leccionesFiltradas = filtrarLecciones();
        const inicio = (paginaActual - 1) * leccionesPorPagina;
        const fin = inicio + leccionesPorPagina;
        const leccionesPagina = leccionesFiltradas.slice(inicio, fin);

        if (leccionesPagina.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="py-12 text-center text-gray-500 dark:text-gray-400">
                        <i class="fas fa-search text-3xl mb-3 opacity-50"></i>
                        <p class="text-lg">No se encontraron lecciones</p>
                        <p class="text-sm mt-1">Intenta ajustar los filtros de búsqueda</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = leccionesPagina.map(leccion => `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td class="py-4 px-4">
                    <div>
                        <p class="font-medium text-gray-900 dark:text-white">${escapeHtml(leccion.titulo)}</p>
                        <p class="text-sm text-gray-600 dark:text-gray-400">${escapeHtml(leccion.descripcion) || 'Sin descripción'}</p>
                    </div>
                </td>
                <td class="py-4 px-4">
                    <span class="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                        ${escapeHtml(leccion.nivel)}
                    </span>
                </td>
                <td class="py-4 px-4 text-gray-600 dark:text-gray-400">${escapeHtml(leccion.idioma)}</td>
                <td class="py-4 px-4">
                    <span class="px-2 py-1 text-xs ${
                        leccion.estado === 'activa' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                        leccion.estado === 'borrador' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                        'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    } rounded-full">
                        ${leccion.estado}
                    </span>
                </td>
                <td class="py-4 px-4 text-gray-600 dark:text-gray-400">${leccion.duracion_minutos} min</td>
                <td class="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">${formatearFecha(leccion.creado_en)}</td>
                <td class="py-4 px-4">
                    <div class="flex gap-2">
                        <button onclick="editarLeccion(${leccion.id})" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="verLeccion(${leccion.id})" class="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20" title="Ver">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="gestionarMultimedia(${leccion.id})" class="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 transition-colors p-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20" title="Multimedia">
                            <i class="fas fa-file-upload"></i>
                        </button>
                        <button onclick="eliminarLeccion(${leccion.id})" class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        actualizarPaginacion(leccionesFiltradas.length);
    }

    function filtrarLecciones() {
        const busqueda = document.getElementById('buscar-leccion').value.toLowerCase();
        const nivelFiltro = document.getElementById('filtro-nivel').value;
        
        let filtradas = leccionesData.filter(leccion => {
            const coincideBusqueda = leccion.titulo.toLowerCase().includes(busqueda) || 
                                   (leccion.descripcion && leccion.descripcion.toLowerCase().includes(busqueda));
            const coincideNivel = !nivelFiltro || leccion.nivel === nivelFiltro;
            
            return coincideBusqueda && coincideNivel;
        });

        paginaActual = 1;
        mostrarLecciones();
        return filtradas;
    }

    function actualizarPaginacion(total) {
        const desde = Math.min((paginaActual - 1) * leccionesPorPagina + 1, total);
        const hasta = Math.min(paginaActual * leccionesPorPagina, total);
        
        document.getElementById('mostrando-desde').textContent = desde;
        document.getElementById('mostrando-hasta').textContent = hasta;
        document.getElementById('total-registros').textContent = total;
        
        document.getElementById('btn-prev').disabled = paginaActual === 1;
        document.getElementById('btn-next').disabled = hasta >= total;
    }

    function cambiarPagina(direccion) {
        const totalPaginas = Math.ceil(leccionesData.length / leccionesPorPagina);
        const nuevaPagina = paginaActual + direccion;
        
        if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
            paginaActual = nuevaPagina;
            mostrarLecciones();
        }
    }

    function mostrarModalCrear() {
        document.getElementById('modal-crear-leccion').classList.remove('hidden');
        document.getElementById('modal-crear-leccion').classList.add('flex');
    }

    function ocultarModalCrear() {
        document.getElementById('modal-crear-leccion').classList.add('hidden');
        document.getElementById('modal-crear-leccion').classList.remove('flex');
        document.getElementById('form-crear-leccion').reset();
    }

    async function crearLeccion() {
        const form = document.getElementById('form-crear-leccion');
        const formData = new FormData(form);
        
        // Validar campos requeridos
        const titulo = formData.get('titulo');
        const nivel = formData.get('nivel');
        const idioma = formData.get('idioma');
        
        if (!titulo || !nivel || !idioma) {
            window.toastManager.error('Por favor completa todos los campos requeridos');
            return;
        }
        
        const datosLeccion = {
            titulo: titulo,
            descripcion: formData.get('descripcion'),
            nivel: nivel,
            idioma: idioma,
            duracion_minutos: parseInt(formData.get('duracion_minutos') || 30),
            orden: parseInt(formData.get('orden') || 0),
            contenido: formData.get('contenido'),
            estado: 'borrador'
        };

        try {
            mostrarLoading(true);
            
            // CORRECCIÓN: Ruta API correcta
            const response = await window.apiClient.post('/api/lecciones', datosLeccion);
            
            if (response.success) {
                window.toastManager.success('Lección creada exitosamente');
                ocultarModalCrear();
                await cargarLecciones();
                
                // Redirigir al editor para continuar editando
                setTimeout(() => {
                    if (response.data && response.data.id) {
                        window.location.href = `/pages/admin/editor-leccion.html?id=${response.data.id}`;
                    }
                }, 1000);
                
            } else {
                throw new Error(response.error || 'Error al crear lección');
            }
        } catch (error) {
            console.error('Error creando lección:', error);
            window.toastManager.error('Error al crear la lección: ' + (error.message || 'Error desconocido'));
        } finally {
            mostrarLoading(false);
        }
    }

    // Funciones globales para los botones de acción
    window.editarLeccion = (id) => {
        // CORRECCIÓN: Ruta correcta al editor
        window.location.href = `/pages/admin/editor-leccion.html?id=${id}`;
    };

    window.verLeccion = (id) => {
        window.location.href = `/pages/admin/vista-previa-leccion.html?id=${id}`;
    };

    window.gestionarMultimedia = (id) => {
        window.location.href = `/pages/admin/gestion-multimedia.html?leccion_id=${id}`;
    };

    window.eliminarLeccion = async (id) => {
        if (!confirm('¿Estás seguro de que quieres eliminar esta lección?\nEsta acción no se puede deshacer.')) return;
        
        try {
            mostrarLoading(true);
            
            // CORRECCIÓN: Ruta API correcta
            const response = await window.apiClient.delete(`/api/lecciones/${id}`);
            
            if (response.success) {
                window.toastManager.success('Lección eliminada exitosamente');
                await cargarLecciones();
            } else {
                throw new Error(response.error || 'Error al eliminar lección');
            }
        } catch (error) {
            console.error('Error eliminando lección:', error);
            window.toastManager.error('Error al eliminar la lección');
        } finally {
            mostrarLoading(false);
        }
    };

    function formatearFecha(fechaISO) {
        try {
            const fecha = new Date(fechaISO);
            return fecha.toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return 'Fecha inválida';
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function mostrarLoading(mostrar) {
        const loadingElements = document.querySelectorAll('.loading-indicator');
        const contentElements = document.querySelectorAll('.content-indicator');
        
        if (mostrar) {
            loadingElements.forEach(el => el.classList.remove('hidden'));
            contentElements.forEach(el => el.classList.add('hidden'));
        } else {
            loadingElements.forEach(el => el.classList.add('hidden'));
            contentElements.forEach(el => el.classList.remove('hidden'));
        }
    }

    async function waitForDependencies() {
        const dependencies = ['apiClient', 'toastManager'];
        const maxWaitTime = 5000; // 5 segundos máximo
        
        return new Promise((resolve) => {
            let elapsed = 0;
            const checkDependencies = () => {
                const allLoaded = dependencies.every(dep => window[dep]);
                
                if (allLoaded || elapsed >= maxWaitTime) {
                    console.log('✅ Dependencias cargadas:', dependencies);
                    resolve();
                } else {
                    elapsed += 100;
                    setTimeout(checkDependencies, 100);
                }
            };
            
            checkDependencies();
        });
    }

    function verificarPermisosAdmin() {
        try {
            // En una implementación real, verificar el token JWT o sesión
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const token = localStorage.getItem('token');
            
            if (!token || user.role !== 'admin') {
                window.toastManager.error('No tienes permisos para acceder a esta página');
                setTimeout(() => {
                    window.location.href = '/pages/auth/login.html';
                }, 2000);
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Error verificando permisos:', error);
            return false;
        }
    }

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();