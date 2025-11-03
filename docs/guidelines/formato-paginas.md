# 📘 GUÍA ACTUALIZADA - SpeakLexi 2.0 (CON MODULE LOADER)

## 🏗️ ARQUITECTURA ACTUALIZADA CON MODULE LOADER

### 📂 ESTRUCTURA DE ARCHIVOS (Definitiva)
```
frontend/
├── config/
│   └── app-config.js           ← ⭐ CORAZÓN DEL SISTEMA
├── assets/
│   ├── css/
│   │   ├── custom-styles.css
│   │   └── animations.css
│   └── js/
│       ├── core/               ← ✅ SCRIPTS CENTRALIZADOS
│       │   ├── api-client.js      (usa APP_CONFIG)
│       │   ├── form-validator.js  (usa APP_CONFIG)
│       │   ├── theme-manager.js   (usa APP_CONFIG)
│       │   ├── toast-manager.js   (usa APP_CONFIG)
│       │   ├── navbar-loader.js   (usa APP_CONFIG)
│       │   ├── utils.js           (usa APP_CONFIG)
│       │   └── module-loader.js   ← ⭐ NUEVO: GESTOR DE DEPENDENCIAS
│       └── pages/              ← ✅ LÓGICA ESPECÍFICA
│           ├── auth/
│           │   ├── registro.js     (✅ ACTUALIZADO)
│           │   ├── login.js
│           │   ├── verificar-email.js
│           │   └── recuperar-contrasena.js
│           ├── estudiante/
│           ├── profesor/
│           ├── admin/
│           └── mantenimiento/
└── pages/
    ├── auth/                   ← ✅ PÁGINAS OPTIMIZADAS
    ├── estudiante/
    ├── profesor/
    ├── admin/
    └── mantenimiento/
```

---

## 🚀 PLANTILLA HTML ACTUALIZADA (CON MODULE LOADER)

### ✅ `template-pagina-module-loader.html`
```html
<!DOCTYPE html>
<html lang="es" class="h-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SpeakLexi - [Nombre Página]</title>
    
    <!-- ✅ PRELOAD CRÍTICO -->
    <link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" as="style">
    <link rel="preload" href="/assets/css/custom-styles.css" as="style">
    
    <!-- ✅ CSS EXTERNO -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- ✅ TAILWIND + CONFIG -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="/assets/js/core/tailwind-config.js"></script>
    
    <!-- ✅ CSS INTERNO (crítico) -->
    <link rel="stylesheet" href="/assets/css/custom-styles.css">
    <link rel="stylesheet" href="/assets/css/animations.css">
    
    <!-- ✅ META OPTIMIZACIÓN -->
    <meta name="description" content="SpeakLexi - Plataforma de aprendizaje de idiomas">
    <meta name="theme-color" content="#4F46E5">
</head>
<body class="h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
    <!-- ✅ NAVBAR DINÁMICO -->
    <div id="navbar-container"></div>
    
    <!-- ✅ CONTENIDO PRINCIPAL -->
    <main class="min-h-screen">
        <!-- Tu contenido específico aquí -->
    </main>

    <!-- ============================================
         ORDEN DE CARGA ACTUALIZADO CON MODULE LOADER
    ============================================ -->
    
    <!-- 1️⃣ CONFIGURACIÓN GLOBAL (SIEMPRE PRIMERO) -->
    <script src="/config/app-config.js"></script>
    
    <!-- 2️⃣ CORE MODULES (con module loader) -->
    <script src="/assets/js/core/module-loader.js"></script>
    <script src="/assets/js/core/api-client.js"></script>
    <script src="/assets/js/core/form-validator.js"></script>
    <script src="/assets/js/core/theme-manager.js"></script>
    <script src="/assets/js/core/toast-manager.js"></script>
    <script src="/assets/js/core/navbar-loader.js"></script>
    <script src="/assets/js/core/utils.js"></script>
    
    <!-- 3️⃣ LÓGICA DE PÁGINA (usa module loader) -->
    <script src="/assets/js/pages/[ruta]/[nombre-pagina].js"></script>
</body>
</html>
```

---

## 📝 PLANTILLA JS ACTUALIZADA CON MODULE LOADER

### ✅ `template-module-loader.js`
```javascript
/* ============================================
   SPEAKLEXI - [NOMBRE DEL MÓDULO/PÁGINA]
   Archivo: assets/js/pages/[ruta]/[nombre-pagina].js
   Usa: ModuleLoader, APP_CONFIG, apiClient, formValidator, toastManager
   ============================================ */

(async () => {
    'use strict';

    // ============================================
    // 1. ESPERAR DEPENDENCIAS CON MODULE LOADER (NUEVO)
    // ============================================
    const dependencias = [
        'APP_CONFIG',
        'apiClient', 
        'formValidator',
        'toastManager',
        'ModuleLoader'
        // Agregar otras dependencias según necesidad:
        // 'Utils', 'themeManager', 'navbarLoader'
    ];

    const inicializado = await window.ModuleLoader.initModule({
        moduleName: '[NOMBRE_MÓDULO]', // ej: 'Dashboard Estudiante'
        dependencies: dependencias,
        onReady: inicializarModulo,
        onError: (error) => {
            console.error('💥 Error al cargar módulo:', error);
            window.ModuleLoader.showModuleError(
                'Error al cargar el módulo. Por favor recarga la página.'
            );
        }
    });

    if (!inicializado) return;

    // ============================================
    // 2. FUNCIÓN PRINCIPAL DE INICIALIZACIÓN
    // ============================================
    async function inicializarModulo() {
        console.log('✅ Módulo [NOMBRE] inicializado');

        // ============================================
        // 3. CONFIGURACIÓN DESDE APP_CONFIG
        // ============================================
        const config = {
            API: window.APP_CONFIG.API,
            ENDPOINTS: window.APP_CONFIG.API.ENDPOINTS,
            STORAGE: window.APP_CONFIG.STORAGE.KEYS,
            VALIDATION: window.APP_CONFIG.VALIDATION,
            UI: window.APP_CONFIG.UI,
            ROLES: window.APP_CONFIG.ROLES
        };

        // ============================================
        // 4. ELEMENTOS DEL DOM
        // ============================================
        const elementos = {
            form: document.getElementById('form-id'),
            submitBtn: document.getElementById('submit-btn'),
            errorAlert: document.getElementById('error-alert'),
            errorMessage: document.getElementById('error-message'),
            loadingIndicator: document.getElementById('loading-indicator')
            // Agregar más elementos según necesidad
        };

        // ============================================
        // 5. ESTADO DE LA APLICACIÓN
        // ============================================
        const estado = {
            isLoading: false,
            datosFormulario: {},
            errores: {}
        };

        // ============================================
        // 6. FUNCIONES DE UI/UX
        // ============================================

        function mostrarError(mensaje) {
            if (elementos.errorAlert && elementos.errorMessage) {
                elementos.errorMessage.textContent = mensaje;
                elementos.errorAlert.classList.remove('hidden');
                elementos.errorAlert.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            } else {
                // Fallback a toastManager
                window.toastManager.error(mensaje);
            }
        }

        function ocultarError() {
            elementos.errorAlert?.classList.add('hidden');
        }

        function mostrarLoading(mostrar) {
            estado.isLoading = mostrar;
            
            elementos.loadingIndicator?.classList.toggle('hidden', !mostrar);
            elementos.submitBtn?.disabled = mostrar;
            
            if (elementos.submitBtn) {
                const span = elementos.submitBtn.querySelector('span');
                if (span) {
                    span.textContent = mostrar ? 'Procesando...' : 'Enviar';
                }
                
                if (mostrar) {
                    elementos.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Procesando...';
                } else {
                    elementos.submitBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Enviar';
                }
            }
        }

        function limpiarErrores() {
            // Limpiar errores de form-validator
            if (elementos.form) {
                window.formValidator.clearAllErrors(elementos.form.id);
            }
            ocultarError();
        }

        // ============================================
        // 7. FUNCIONES PRINCIPALES
        // ============================================

        /**
         * Configura todos los event listeners
         */
        function configurarEventListeners() {
            // Formulario principal
            elementos.form?.addEventListener('submit', manejarEnvioFormulario);
            
            // Validación en tiempo real
            elementos.form?.addEventListener('input', manejarValidacionTiempoReal);
            
            // Eventos específicos del módulo
            configurarEventosEspecificos();
        }

        /**
         * Maneja el envío del formulario
         */
        async function manejarEnvioFormulario(e) {
            e.preventDefault();
            
            if (estado.isLoading) return;
            
            const datos = obtenerDatosFormulario();
            const validacion = validarFormulario(datos);
            
            if (!validacion.esValido) {
                mostrarErrores(validacion.errores);
                return;
            }

            await enviarDatos(datos);
        }

        /**
         * Obtiene datos del formulario
         */
        function obtenerDatosFormulario() {
            const formData = new FormData(elementos.form);
            const datos = {};
            
            for (const [key, value] of formData.entries()) {
                datos[key] = value.trim();
            }
            
            return datos;
        }

        /**
         * Valida el formulario completo
         */
        function validarFormulario(datos) {
            const errores = {};
            
            // Ejemplo de validación específica
            if (!datos.campoRequerido) {
                errores.campoRequerido = 'Este campo es requerido';
            }
            
            // Usar formValidator para validaciones complejas
            if (datos.email) {
                const emailValido = window.formValidator.validateEmail(datos.email);
                if (!emailValido.valid) {
                    errores.email = emailValido.error;
                }
            }
            
            return {
                esValido: Object.keys(errores).length === 0,
                errores: errores
            };
        }

        /**
         * Muestra errores en el formulario
         */
        function mostrarErrores(errores) {
            limpiarErrores();
            
            Object.entries(errores).forEach(([campo, mensaje]) => {
                window.formValidator.showFieldError(campo, mensaje);
            });
            
            // Scroll al primer error
            const primerError = document.querySelector('.border-red-500');
            primerError?.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            mostrarError('Por favor corrige los errores en el formulario');
        }

        /**
         * Envía datos al servidor
         */
        async function enviarDatos(datos) {
            try {
                mostrarLoading(true);
                limpiarErrores();

                // ✅ USAR apiClient CON ENDPOINTS DE APP_CONFIG
                const endpoint = config.ENDPOINTS.MODULO.ACCION;
                const response = await window.apiClient.post(endpoint, datos);

                if (response.success) {
                    await manejarExito(response.data);
                } else {
                    manejarErrorServidor(response);
                }

            } catch (error) {
                manejarError('Error de conexión', error);
            } finally {
                mostrarLoading(false);
            }
        }

        /**
         * Maneja respuesta exitosa del servidor
         */
        async function manejarExito(datos) {
            // ✅ USAR toastManager PARA NOTIFICACIONES
            window.toastManager.success('Operación completada exitosamente');
            
            // Redirigir o actualizar UI según necesidad
            setTimeout(() => {
                window.location.href = config.UI.RUTAS.DASHBOARD;
            }, 1500);
        }

        /**
         * Maneja errores del servidor
         */
        function manejarErrorServidor(response) {
            if (response.errores && response.errores.length > 0) {
                // Errores de validación del servidor
                const errores = {};
                response.errores.forEach(error => {
                    errores[error.campo] = error.mensaje;
                });
                mostrarErrores(errores);
            } else {
                // Error general
                mostrarError(response.error || 'Error en el servidor');
            }
        }

        /**
         * Maneja errores inesperados
         */
        function manejarError(mensaje, error) {
            console.error('💥 Error:', error);
            
            if (window.APP_CONFIG.ENV.DEBUG) {
                console.trace();
            }
            
            mostrarError(mensaje);
        }

        /**
         * Maneja validación en tiempo real
         */
        function manejarValidacionTiempoReal(e) {
            const campo = e.target.name;
            if (campo) {
                window.formValidator.clearFieldError(campo);
                ocultarError();
            }
        }

        // ============================================
        // 8. FUNCIONES ESPECÍFICAS DEL MÓDULO
        // ============================================
        
        function configurarEventosEspecificos() {
            // Implementar eventos específicos del módulo
        }

        function cargarDatosIniciales() {
            // Cargar datos necesarios para el módulo
        }

        // ============================================
        // 9. INICIALIZACIÓN COMPLETA
        // ============================================
        
        function inicializar() {
            configurarEventListeners();
            cargarDatosIniciales();
            
            if (window.APP_CONFIG.ENV.DEBUG) {
                console.log('🔧 Módulo listo:', { config, elementos, estado });
            }
        }

        // Ejecutar inicialización
        inicializar();
    }

})();
```

---

## 🔄 FLUJO DEL MODULE LOADER (NUEVO)

### ✅ Cómo funciona ahora:
```javascript
// 1. El ModuleLoader espera a que todas las dependencias estén disponibles
const inicializado = await window.ModuleLoader.initModule({
    moduleName: 'Mi Módulo',
    dependencies: ['APP_CONFIG', 'apiClient', 'formValidator'],
    onReady: inicializarModulo,
    onError: manejarError
});

// 2. Solo se ejecuta si todas las dependencias están cargadas
if (!inicializado) return;

// 3. Tu lógica principal va aquí
function inicializarModulo() {
    // ✅ Todas las dependencias están disponibles
    console.log(window.APP_CONFIG.API.API_URL);
    console.log(window.apiClient);
    // ... tu código
}
```

---

## 🎯 CHECKLIST ACTUALIZADO PARA NUEVOS MÓDULOS

### 🔹 FASE 1: PLANIFICACIÓN
- [ ] **Definir endpoints** en `app-config.js`
- [ ] **Definir dependencias** necesarias para el módulo
- [ ] **Planificar estructura de datos**
- [ ] **Diseñar interfaz de usuario**

### 🔹 FASE 2: IMPLEMENTACIÓN FRONTEND
- [ ] **Crear página HTML** usando plantilla con module loader
- [ ] **Crear archivo JS** usando plantilla con module loader
- [ ] **Listar dependencias** en el array de dependencies
- [ ] **Implementar lógica específica** del módulo

### 🔹 FASE 3: OPTIMIZACIÓN
- [ ] **Verificar orden de carga** (module-loader.js después de app-config)
- [ ] **Implementar loading states**
- [ ] **Agregar manejo de errores con ModuleLoader**
- [ ] **Optimizar para móviles**

---

## 📊 EJEMPLOS POR TIPO DE MÓDULO (ACTUALIZADOS)

### 🎓 MÓDULO ESTUDIANTE CON MODULE LOADER
```javascript
(async () => {
    'use strict';

    const dependencias = [
        'APP_CONFIG',
        'apiClient',
        'toastManager',
        'ModuleLoader',
        'Utils' // si necesitas utilidades
    ];

    const inicializado = await window.ModuleLoader.initModule({
        moduleName: 'Dashboard Estudiante',
        dependencies: dependencias,
        onReady: async function() {
            console.log('✅ Dashboard estudiante listo');
            
            // Tu lógica aquí
            const lecciones = await window.apiClient.get(
                window.APP_CONFIG.API.ENDPOINTS.LECCIONES.ESTUDIANTE
            );
            
            if (lecciones.success) {
                mostrarLecciones(lecciones.data);
            }
        },
        onError: (error) => {
            console.error('Error cargando dashboard:', error);
            window.ModuleLoader.showModuleError(
                'No se pudo cargar el dashboard. Recarga la página.'
            );
        }
    });

    if (!inicializado) return;
})();
```

### 👨‍🏫 MÓDULO PROFESOR CON MODULE LOADER
```javascript
(async () => {
    'use strict';

    const dependencias = [
        'APP_CONFIG',
        'apiClient',
        'formValidator',
        'toastManager',
        'ModuleLoader'
    ];

    const inicializado = await window.ModuleLoader.initModule({
        moduleName: 'Gestión de Clases',
        dependencies: dependencias,
        onReady: inicializarModuloClases,
        onError: (error) => {
            window.ModuleLoader.showModuleError(
                'Error al cargar el módulo de clases.'
            );
        }
    });

    if (!inicializado) return;

    async function inicializarModuloClases() {
        // Configuración desde APP_CONFIG
        const endpoints = window.APP_CONFIG.API.ENDPOINTS.PROFESOR;
        
        // Cargar datos iniciales
        const [clases, estudiantes] = await Promise.all([
            window.apiClient.get(endpoints.CLASES),
            window.apiClient.get(endpoints.ESTUDIANTES)
        ]);

        if (clases.success && estudiantes.success) {
            inicializarInterfaz(clases.data, estudiantes.data);
        }
    }
})();
```

---

## 🔧 CONFIGURACIÓN EN APP_CONFIG.JS (MANTIENE IGUAL)

### ✅ Agregar nuevos endpoints (igual que antes):
```javascript
// En app-config.js > API.ENDPOINTS
NUEVO_MODULO: {
    LISTAR: '/nuevo-modulo',
    CREAR: '/nuevo-modulo/crear',
    DETALLE: '/nuevo-modulo/:id',
    ACTUALIZAR: '/nuevo-modulo/:id',
    ELIMINAR: '/nuevo-modulo/:id'
}
```

---

## 🚀 VENTAJAS DEL NUEVO SISTEMA CON MODULE LOADER

### ✅ **MEJORAS IMPLEMENTADAS:**
- **🔄 Carga Asíncrona** - Las dependencias se cargan en orden correcto
- **🚨 Manejo de Errores** - Mejor feedback si falla la carga
- **⚡ Performance** - No se bloquea la ejecución
- **🔧 Debugging** - Más fácil identificar problemas de carga
- **🎯 Confiabilidad** - El código solo ejecuta cuando todo está listo

### ✅ **PATRÓN A SEGUIR SIEMPRE:**
```javascript
// 1. Listar dependencias
const dependencias = ['APP_CONFIG', 'apiClient', 'toastManager', 'ModuleLoader'];

// 2. Usar ModuleLoader.initModule()
const inicializado = await window.ModuleLoader.initModule({
    moduleName: 'Nombre Módulo',
    dependencies: dependencias,
    onReady: tuFuncionPrincipal,
    onError: tuManejadorErrores
});

// 3. Verificar inicialización
if (!inicializado) return;

// 4. Implementar lógica en tuFuncionPrincipal
function tuFuncionPrincipal() {
    // ✅ Todo está cargado y listo
}
```

---

## 📋 CHECKLIST DE ENTREGA ACTUALIZADO

### ✅ ANTES DE MARCAR COMO COMPLETADO:
- [ ] **HTML** usa plantilla con module loader
- [ ] **JS** usa plantilla con module loader
- [ ] **Dependencias** listadas correctamente
- [ ] **ModuleLoader.initModule()** implementado
- [ ] **Manejo de errores** con ModuleLoader
- [ ] **APP_CONFIG** tiene endpoints necesarios
- [ ] **apiClient** usado para peticiones
- [ ] **Loading states** implementados
- [ ] **Responsive** probado en móviles
- [ ] **Sin errores** en consola

---

## 🎯 RESUMEN EJECUTIVO ACTUALIZADO

### ✅ **PARA NUEVOS MÓDULOS, SIEMPRE:**

1. **COPIAR PLANTILLAS ACTUALIZADAS** - Con module loader
2. **LISTAR DEPENDENCIAS** - En el array de dependencies
3. **USAR ModuleLoader.initModule()** - Para inicialización segura
4. **IMPLEMENTAR onReady y onError** - Para manejo robusto
5. **VERIFICAR INICIALIZACIÓN** - Antes de ejecutar código

### ✅ **BENEFICIOS DEL NUEVO SISTEMA:**
- **🚀 Más confiable** - Código ejecuta solo cuando todo está listo
- **🐛 Menos errores** - Dependencias cargadas en orden correcto
- **🔧 Mejor mantenibilidad** - Inicialización estandarizada
- **🎯 Mejor UX** - Manejo de errores más informativo

---

> **💡 RECUERDA**: El ModuleLoader es ahora el punto de entrada para todos los módulos. Siempre úsalo para garantizar que tus dependencias estén disponibles antes de ejecutar cualquier lógica.

**¡LISTO!** Con esta guía actualizada, tus nuevos módulos serán más robustos y confiables. 🎉