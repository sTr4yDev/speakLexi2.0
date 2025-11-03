# 🚀 Guía Completa de Desarrollo - SpeakLexi 2.0

## 📋 Resumen de Errores y Soluciones - Flujo de Onboarding

## 🔴 Errores Críticos Resueltos

### **Error #1: Inconsistencia en Esquema de Base de Datos**

**Problema:**
```javascript
// ❌ authController.js - Columnas incorrectas
await connection.query(
    `INSERT INTO perfil_usuarios (usuario_id, nombre_completo, fecha_creacion) 
     VALUES (?, ?, NOW())`,
    [usuario_id, nombre_completo]
);
```

**Impacto:**
- Error 500 en registro: `Unknown column 'fecha_creacion' in 'field list'`
- Inconsistencias en múltiples archivos: `email_verificado` vs `correo_verificado`

**Solución:**
```javascript
// ✅ Usar nombres correctos del esquema
await connection.query(
    `INSERT INTO perfil_usuarios (usuario_id, nombre_completo) 
     VALUES (?, ?)`,
    [usuario_id, nombre_completo]
);
```

---

### **Error #2: Funciones de Controlador No Exportadas**

**Problema:**
```javascript
// ❌ auth-routes.js - Funciones no existentes
router.get('/perfil', authMiddleware.verificarToken, authController.obtenerPerfil);
router.post('/logout', authMiddleware.verificarToken, authController.cerrarSesion);
```

**Impacto:**
- Servidor no inicia: `Route.get() requires a callback function but got [object Undefined]`

**Solución:**
```javascript
// ✅ Exportar funciones en authController.js
exports.obtenerPerfil = async (req, res) => { /* ... */ };
exports.cerrarSesion = async (req, res) => { /* ... */ };
```

---

### **Error #3: Autenticación Prematura en Onboarding**

**Problema:**
```javascript
// ❌ Endpoint protegido durante onboarding
router.patch(
  '/actualizar-nivel', 
  authMiddleware.verificarToken,  // ← Usuario no tiene token aún
  authController.actualizarNivel
);
```

**Impacto:**
- Error 401 en asignación de nivel: `Acceso no autorizado, Token requerido`
- Flujo de onboarding interrumpido

**Solución:**
```javascript
// ✅ Endpoint público para onboarding
router.patch('/actualizar-nivel', validacionesActualizarNivel, authController.actualizarNivel);
```

---

### **Error #4: Pérdida de Datos en localStorage**

**Problema:**
```javascript
// ❌ verificar-email.js - Limpieza prematura
async function manejarVerificacionExitosa(data) {
    localStorage.removeItem('correo');
    localStorage.removeItem('idioma'); // ← Se necesitan después!
    window.location.href = '/asignar-nivel.html';
}
```

**Impacto:**
- `asignar-nivel.html` no encuentra datos: `No se encontró el correo del usuario`
- Flujo de onboarding incompleto

**Solución:**
```javascript
// ✅ Limpiar solo al final del flujo (en asignar-nivel.js)
async function actualizarNivel(nivel) {
    const response = await window.apiClient.patch(endpoint, datos);
    
    if (response.success) {
        // ✅ Limpiar DESPUÉS del éxito
        localStorage.removeItem('correo');
        localStorage.removeItem('idioma');
        window.location.href = '/login.html';
    }
}
```

---

### **Error #5: Inconsistencia en Propiedades de Respuesta**

**Problema:**
```javascript
// ❌ Backend vs Frontend - Nombres diferentes
// Backend responde:
res.json({ token: 'abc123', usuario: { ... } });

// Frontend espera:
const access_token = data.access_token; // ← undefined
```

**Impacto:**
- Login falla: `Respuesta inválida del servidor`
- Usuario no puede acceder al sistema

**Solución:**
```javascript
// ✅ Mantener consistencia
// Backend:
res.json({ token: 'abc123', usuario: { ... } });

// Frontend:
const token = data.token; // ← Nombre correcto
localStorage.setItem('token', token);
```

---

### **Error #6: Rutas de Archivo Incorrectas**

**Problema:**
```javascript
// ❌ Ruta no coincide con estructura real
let redirectPath = '/estudiante/estudiante-dashboard.html';
// Estructura real: /pages/estudiante/dashboard-estudiante.html
```

**Impacto:**
- Error 404 después de login: `Cannot GET /estudiante/estudiante-dashboard.html`
- Usuario no puede acceder al dashboard

**Solución:**
```javascript
// ✅ Usar rutas correctas
let redirectPath = '/pages/estudiante/dashboard-estudiante.html';
```

---

## ✅ Flujo Correcto Implementado

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE ONBOARDING COMPLETO                │
└─────────────────────────────────────────────────────────────────┘

1️⃣ REGISTRO (registro.html)
   ├─ Usuario llena: {correo, nombre, password, idioma_aprendizaje}
   ├─ Backend: INSERT en usuarios + perfil_usuarios
   ├─ ✅ Guardar en localStorage: correo, idioma
   └─ Redirigir a: verificar-email.html
        ↓

2️⃣ VERIFICAR EMAIL (verificar-email.html)
   ├─ Leer correo desde localStorage
   ├─ Usuario ingresa código de 6 dígitos
   ├─ Backend: Actualizar correo_verificado = 1
   ├─ ✅ NO LIMPIAR localStorage (se necesita después)
   └─ Redirigir a: asignar-nivel.html
        ↓

3️⃣ ASIGNAR NIVEL (asignar-nivel.html)
   ├─ ✅ Leer datos: localStorage.getItem('correo', 'idioma')
   ├─ Usuario elige: Evaluación o Selección Manual
   ├─ Backend: PATCH /actualizar-nivel (ENDPOINT PÚBLICO)
   ├─ ✅ DESPUÉS de éxito: limpiar localStorage
   └─ Redirigir a: login.html
        ↓

4️⃣ LOGIN (login.html)
   ├─ Usuario ingresa: correo + password
   ├─ Backend: Validar credenciales → generar JWT
   ├─ Frontend: localStorage.setItem('token', data.token)
   ├─ Determinar rol y redirigir
   └─ Dashboard correspondiente
```

---

## 🛠️ Guidelines para Desarrollo con IA

### **A. VERIFICACIÓN DE ESQUEMA DE BASE DE DATOS**

#### ✅ DO's:
```javascript
// 1. SIEMPRE pedir el esquema antes de escribir queries
const ESQUEMA = {
    usuarios: {
        usuario_id: 'INT PRIMARY KEY AUTO_INCREMENT',
        correo: 'VARCHAR(255) UNIQUE NOT NULL',
        contrasena_hash: 'VARCHAR(255) NOT NULL',
        rol: "ENUM('estudiante','profesor','admin')",
        correo_verificado: 'TINYINT DEFAULT 0',
        activo: 'TINYINT DEFAULT 1',
        creado_en: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    },
    perfil_usuarios: {
        perfil_id: 'INT PRIMARY KEY AUTO_INCREMENT',
        usuario_id: 'INT FOREIGN KEY',
        nombre_completo: 'VARCHAR(255)',
        creado_en: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    }
};

// 2. Verificar nombres exactos de columnas
function validarEsquema(query, tablaEsperada) {
    const columnasRequeridas = ESQUEMA[tablaEsperada];
    Object.keys(columnasRequeridas).forEach(columna => {
        if (!query.includes(columna)) {
            console.warn(`⚠️ Columna faltante en query: ${columna}`);
        }
    });
}

// 3. Usar consultas parametrizadas
async function querySegura(connection, sql, parametros) {
    return await connection.query(sql, parametros);
}
```

#### ❌ DON'Ts:
```javascript
// ❌ NO asumir nombres de columnas
`INSERT INTO tabla (fecha_creacion, email_verificado)` // Pueden no existir

// ❌ NO usar concatenación de strings
`SELECT * FROM usuarios WHERE correo = '${email}'`     // SQL Injection

// ❌ NO olvidar transacciones en operaciones múltiples
await query1();
await query2(); // Si query2 falla, query1 queda aplicada
```

---

### **B. SINCRONIZACIÓN FRONTEND-BACKEND**

#### ✅ DO's:
```javascript
// 1. Documentar estructura de respuestas API
/**
 * @typedef {Object} LoginResponse
 * @property {string} token - JWT token de autenticación
 * @property {Object} usuario - Datos del usuario
 * @property {string} redirectUrl - URL para redirección
 * @property {string} mensaje - Mensaje descriptivo
 */

// 2. Mantener consistencia en nombres
const API_RESPONSE_FORMATS = {
    AUTH: {
        LOGIN: { token: '', usuario: {}, redirectUrl: '' },
        REGISTER: { mensaje: '', usuario_id: '' },
        VERIFY_EMAIL: { mensaje: '', verificado: true }
    }
};

// 3. Validar respuestas en frontend
function validarRespuestaAPI(data, esquemaEsperado) {
    const propiedadesRequeridas = Object.keys(esquemaEsperado);
    const faltantes = propiedadesRequeridas.filter(prop => !data[prop]);
    
    if (faltantes.length > 0) {
        throw new Error(`Propiedades faltantes: ${faltantes.join(', ')}`);
    }
    
    return true;
}

// 4. Usar cliente API consistente
class ApiClient {
    async post(endpoint, data) {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        // Validar estructura
        validarRespuestaAPI(result, API_RESPONSE_FORMATS[endpoint]);
        
        return result;
    }
}
```

#### ❌ DON'Ts:
```javascript
// ❌ NO mezclar convenciones de nombres
// Backend: { token, usuario }
// Frontend: data.access_token // ← Inconsistente

// ❌ NO asumir que la respuesta siempre tiene la misma estructura
const token = data.token; // ❌ Puede ser undefined

// ❌ NO olvidar manejar errores de red
fetch('/api/login').then(data => data.json()) // ❌ Sin catch
```

---

### **C. GESTIÓN DE ESTADO Y FLUJO DE DATOS**

#### ✅ DO's:
```javascript
// 1. Mapear flujo completo ANTES de implementar
const FLUJO_ONBOARDING = {
    PASO_1: {
        nombre: 'Registro',
        datosRecibidos: [],
        datosGuardados: ['correo', 'idioma_aprendizaje'],
        siguientePaso: 'verificar-email.html',
        limpiarDatos: false
    },
    PASO_2: {
        nombre: 'Verificar Email', 
        datosRecibidos: ['correo'],
        datosGuardados: [],
        siguientePaso: 'asignar-nivel.html',
        limpiarDatos: false // ← IMPORTANTE: No limpiar aquí
    },
    PASO_3: {
        nombre: 'Asignar Nivel',
        datosRecibidos: ['correo', 'idioma'],
        datosGuardados: [],
        siguientePaso: 'login.html',
        limpiarDatos: true // ← Limpiar solo al final
    }
};

// 2. Gestión robusta de localStorage
class FlowStateManager {
    static guardarDatosOnboarding(datos) {
        const KEYS = window.APP_CONFIG.STORAGE.KEYS;
        
        Object.entries(datos).forEach(([key, value]) => {
            if (value) {
                localStorage.setItem(KEYS[key.toUpperCase()], value);
            }
        });
        
        // Debug en desarrollo
        if (window.APP_CONFIG.ENV.DEBUG) {
            console.log('💾 Datos guardados para flujo:', datos);
        }
    }
    
    static recuperarDatosOnboarding() {
        const KEYS = window.APP_CONFIG.STORAGE.KEYS;
        
        const datos = {
            correo: localStorage.getItem(KEYS.CORREO),
            idioma: localStorage.getItem(KEYS.IDIOMA)
        };
        
        // Validar datos críticos
        if (!datos.correo) {
            throw new Error('Datos de flujo incompletos. Redirigiendo a registro.');
        }
        
        return datos;
    }
    
    static limpiarDatosOnboarding() {
        const KEYS = window.APP_CONFIG.STORAGE.KEYS;
        
        Object.values(KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        
        console.log('🧹 Datos de onboarding limpiados');
    }
}

// 3. Navegación con validación de estado
function navegarASiguientePaso(pasoDestino) {
    try {
        const datosActuales = FlowStateManager.recuperarDatosOnboarding();
        
        // Validar que tenemos los datos necesarios para el siguiente paso
        const paso = FLUJO_ONBOARDING[pasoDestino];
        const datosRequeridos = paso.datosRecibidos || [];
        
        const datosFaltantes = datosRequeridos.filter(key => !datosActuales[key]);
        
        if (datosFaltantes.length > 0) {
            throw new Error(`Datos faltantes para ${paso.nombre}: ${datosFaltantes.join(', ')}`);
        }
        
        // Navegar
        window.location.href = paso.siguientePaso;
        
    } catch (error) {
        console.error('❌ Error en navegación:', error);
        window.location.href = '/registro.html'; // Volver al inicio
    }
}
```

#### ❌ DON'Ts:
```javascript
// ❌ NO limpiar localStorage en pasos intermedios
function verificarEmailExitoso() {
    localStorage.clear(); // ❌ Rompe el flujo
    window.location.href = '/asignar-nivel.html';
}

// ❌ NO asumir que los datos siempre existen
const correo = localStorage.getItem('correo');
enviarAlBackend(correo); // ❌ Puede enviar null

// ❌ NO mezclar lógica de diferentes flujos
localStorage.setItem('token', data.token); // Auth
localStorage.setItem('correo', data.correo); // Onboarding ← Mezclado
```

---

### **D. MIDDLEWARES DE AUTENTICACIÓN**

#### ✅ DO's:
```javascript
// 1. Clasificar endpoints por tipo de autenticación
const ENDPOINT_CATEGORIES = {
    PUBLICOS: [
        '/api/auth/registro',
        '/api/auth/verificar-email',
        '/api/auth/login',
        '/api/auth/actualizar-nivel' // ← Onboarding sin token
    ],
    ONBOARDING: [
        '/api/auth/actualizar-nivel' // Validación por email, no token
    ],
    PROTEGIDOS: [
        '/api/auth/perfil',
        '/api/auth/logout',
        '/api/estudiante/*',
        '/api/profesor/*'
    ]
};

// 2. Middleware para endpoints de onboarding
const validarOnboarding = (req, res, next) => {
    // Para onboarding, validar por email en body en lugar de token
    const { correo } = req.body;
    
    if (!correo) {
        return res.status(400).json({
            success: false,
            mensaje: 'Correo requerido para operación de onboarding'
        });
    }
    
    // Verificar que el email existe y está verificado
    // ... lógica de validación
    
    req.usuarioOnboarding = { correo };
    next();
};

// 3. Aplicar middlewares según categoría
app.patch('/api/auth/actualizar-nivel', 
    validarOnboarding,        // ← Sin token
    validacionesActualizarNivel, 
    authController.actualizarNivel
);

app.get('/api/auth/perfil',
    authMiddleware.verificarToken,  // ← Requiere token
    authController.obtenerPerfil
);
```

#### ❌ DON'Ts:
```javascript
// ❌ NO proteger endpoints de onboarding con token
router.patch('/actualizar-nivel',
    authMiddleware.verificarToken, // ❌ Usuario no tiene token aún
    authController.actualizarNivel
);

// ❌ NO mezclar lógica de autenticación
function middlewareMixto(req, res, next) {
    if (req.path === '/actualizar-nivel') {
        // Lógica onboarding
    } else {
        // Lógica con token
    } // ❌ Difícil de mantener
}
```

---

### **E. MANEJO DE ERRORES Y TRANSACCIONES**

#### ✅ DO's:
```javascript
// 1. Transacciones robustas para operaciones múltiples
async function operacionConTransaccion(operaciones) {
    let connection;
    
    try {
        connection = await database.getConnection();
        await connection.beginTransaction();
        
        console.log('🔄 Iniciando transacción...');
        
        // Ejecutar todas las operaciones
        for (const operacion of operaciones) {
            const { sql, parametros } = operacion;
            await connection.query(sql, parametros);
        }
        
        // Si todo sale bien, commit
        await connection.commit();
        console.log('✅ Transacción completada');
        
        return { success: true };
        
    } catch (error) {
        // Si algo falla, rollback
        if (connection) {
            await connection.rollback();
            console.log('🔙 Rollback ejecutado');
        }
        
        console.error('💥 Error en transacción:', error);
        
        return { 
            success: false, 
            error: error.message,
            codigo: error.code
        };
        
    } finally {
        // Siempre liberar conexión
        if (connection) {
            connection.release();
        }
    }
}

// 2. Ejemplo de uso en registro
async function registrarUsuario(datosUsuario) {
    const operaciones = [
        {
            sql: `INSERT INTO usuarios (correo, contrasena_hash, rol) VALUES (?, ?, ?)`,
            parametros: [datosUsuario.correo, datosUsuario.contrasenaHash, 'estudiante']
        },
        {
            sql: `INSERT INTO perfil_usuarios (usuario_id, nombre_completo) VALUES (?, ?)`,
            parametros: [/* obtener ID del primer INSERT */, datosUsuario.nombre]
        }
    ];
    
    return await operacionConTransaccion(operaciones);
}

// 3. Manejo de erroes en frontend
class ErrorHandler {
    static manejarErrorAPI(error, contexto) {
        console.error(`💥 Error en ${contexto}:`, error);
        
        // Mostrar error al usuario
        if (error.message.includes('NetworkError')) {
            window.toastManager.error('Error de conexión. Verifica tu internet.');
        } else if (error.message.includes('401')) {
            window.toastManager.error('Sesión expirada. Por favor inicia sesión again.');
            setTimeout(() => window.location.href = '/login.html', 2000);
        } else {
            window.toastManager.error(error.message || 'Error inesperado');
        }
        
        // Log para desarrollo
        if (window.APP_CONFIG.ENV.DEBUG) {
            console.error('📋 Detalles del error:', {
                contexto,
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
        }
    }
}
```

---

### **F. ESTRUCTURA DE MÓDULOS FRONTEND**

#### ✅ DO's:
```javascript
// 1. Plantilla para módulos multi-página
class OnboardingModule {
    constructor() {
        this.config = window.APP_CONFIG;
        this.estado = {
            pasoActual: this.obtenerPasoActual(),
            datos: this.cargarDatosTemporales()
        };
    }
    
    async inicializar() {
        try {
            await this.validarDependencias();
            await this.cargarDatos();
            this.inicializarEventos();
            this.mostrarInterfaz();
            
            console.log(`✅ Módulo ${this.estado.pasoActual} listo`);
            
        } catch (error) {
            this.manejarErrorInicializacion(error);
        }
    }
    
    async validarDependencias() {
        const dependenciasRequeridas = [
            'APP_CONFIG', 'apiClient', 'Utils', 'toastManager'
        ];
        
        const faltantes = dependenciasRequeridas.filter(dep => !window[dep]);
        
        if (faltantes.length > 0) {
            throw new Error(`Dependencias faltantes: ${faltantes.join(', ')}`);
        }
    }
    
    cargarDatosTemporales() {
        const datos = {
            correo: window.Utils.getFromStorage(this.config.STORAGE.CORREO),
            idioma: window.Utils.getFromStorage(this.config.STORAGE.IDIOMA)
        };
        
        // Validar datos críticos para este paso
        if (this.requiereCorreo() && !datos.correo) {
            throw new Error('Datos de flujo incompletos. Redirigiendo al registro.');
        }
        
        return datos;
    }
    
    async procesarPaso(datosPaso) {
        try {
            // Validar datos antes de enviar
            this.validarDatosPaso(datosPaso);
            
            // Enviar al backend
            const respuesta = await window.apiClient.post(
                this.obtenerEndpoint(), 
                datosPaso
            );
            
            // Manejar respuesta exitosa
            await this.manejarExito(respuesta);
            
        } catch (error) {
            ErrorHandler.manejarErrorAPI(error, this.estado.pasoActual);
        }
    }
    
    async manejarExito(respuesta) {
        // Mostrar feedback al usuario
        window.toastManager.success(respuesta.mensaje || 'Operación exitosa');
        
        // Guardar datos temporalmente si es necesario
        if (respuesta.datosTemporales) {
            this.guardarDatosTemporales(respuesta.datosTemporales);
        }
        
        // Navegar al siguiente paso
        setTimeout(() => {
            window.location.href = this.obtenerSiguientePaso();
        }, 1500);
    }
    
    // Métodos abstractos para implementar en cada página
    requiereCorreo() { return true; }
    obtenerEndpoint() { throw new Error('Método abstracto'); }
    obtenerSiguientePaso() { throw new Error('Método abstracto'); }
}

// 2. Implementación específica por página
class VerificarEmailModule extends OnboardingModule {
    obtenerEndpoint() { return '/api/auth/verificar-email'; }
    obtenerSiguientePaso() { return '/asignar-nivel.html'; }
    
    inicializarEventos() {
        document.getElementById('form-verificacion')
            .addEventListener('submit', (e) => this.manejarVerificacion(e));
    }
    
    async manejarVerificacion(event) {
        event.preventDefault();
        
        const codigo = document.getElementById('codigo-verificacion').value;
        
        await this.procesarPaso({
            correo: this.estado.datos.correo,
            codigo_verificacion: codigo
        });
    }
    
    // NO limpiar localStorage aquí - se hace en el último paso
}
```

---

## 🎯 CHECKLIST PRE-IMPLEMENTACIÓN

### **ANTES de escribir código:**

#### ✅ Base de Datos
- [ ] **Tengo el esquema actualizado** de todas las tablas involucradas
- [ ] **Verifico nombres exactos** de tablas y columnas
- [ **Confirmo tipos de datos** y valores por defecto
- [ ] **Reviso constraints** (UNIQUE, FOREIGN KEY, etc.)

#### ✅ Backend
- [ ] **Documento estructura de request/response** para cada endpoint
- [ ] **Defino nivel de autenticación** (público, onboarding, protegido)
- [ ] **Planifico transacciones** para operaciones múltiples
- [ ] **Preparo manejo de erroes** específicos por endpoint

#### ✅ Frontend
- [ ] **Mapeo el flujo completo** de datos entre páginas
- [ ] **Defino ciclo de vida** de localStorage/sessionStorage
- [ ] **Documento dependencias** entre módulos
- [ ] **Planifico manejo de erroes** y estados de carga

#### ✅ Integración
- [ ] **Verifico consistencia** de nombres entre frontend/backend
- [ ] **Confirmo rutas de archivos** contra estructura real
- [ ] **Documento flujo de autenticación** (cuándo se obtiene token)
- [ ] **Preparo casos de error** (red, datos faltantes, timeouts)

### **DURANTE desarrollo:**

#### ✅ Por cada endpoint:
- [ ] **Validación de datos** de entrada
- [ ] **Manejo de erroes** con try-catch
- [ ] **Transacciones** para operaciones múltiples
- [ ] **Respuestas consistentes** en formato
- [ ] **Logs descriptivos** para debugging

#### ✅ Por cada página frontend:
- [ ] **Validación de datos** antes de enviar
- [ ] **Manejo de estados** de carga/error/éxito
- [ ] **Recuperación graceful** de datos faltantes
- [ ] **Feedback al usuario** apropiado
- [ ] **Limpieza adecuada** de recursos

### **DESPUÉS de desarrollar:**

#### ✅ Pruebas de flujo completo:
- [ ] **Registro → Verificación → Asignación Nivel → Login → Dashboard**
- [ ] **Recarga de página** en cada paso (debe recuperar estado)
- [ ] **Navegación hacia atrás** (no debe romper flujo)
- [ ] **Datos corruptos/missing** en localStorage (debe recuperarse)
- [ ] **Errores de red** en cada operación (debe manejarse gracefully)

#### ✅ Verificaciones finales:
- [ ] **Servidor inicia** sin errores
- [ ] **Todas las rutas** responden correctamente
- [ ] **Console limpia** de errores no manejados
- [ ] **Responsive** y accesibilidad básica
- [ ] **Performance** aceptable

---

## 🔧 HERRAMIENTAS DE DEBUG Y MONITOREO

```javascript
// Agregar a utils.js o módulo separado
class DevelopmentTools {
    static enableDebugMode() {
        if (!window.APP_CONFIG.ENV.DEBUG) return;
        
        // Monitor de localStorage
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = function(key, value) {
            console.log(`💾 localStorage SET: ${key} =`, value);
            originalSetItem.call(this, key, value);
        };
        
        const originalRemoveItem = localStorage.removeItem;
        localStorage.removeItem = function(key) {
            console.log(`🗑️ localStorage REMOVE: ${key}`);
            originalRemoveItem.call(this, key);
        };
        
        // Monitor de API calls
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            console.log('🌐 API Call:', args[0], args[1]);
            return originalFetch.apply(this, args).then(response => {
                console.log('📥 API Response:', response.url, response.status);
                return response;
            });
        };
        
        console.log('🔧 Debug mode enabled');
    }
    
    static showAppState() {
        console.log('📊 Estado de la aplicación:', {
            localStorage: { ...localStorage },
            currentPage: window.location.pathname,
            config: window.APP_CONFIG,
            screen: { width: window.innerWidth, height: window.innerHeight }
        });
    }
    
    static validateDataFlow(requiredData) {
        const missing = requiredData.filter(key => !localStorage.getItem(key));
        
        if (missing.length > 0) {
            console.error('❌ Datos faltantes en flujo:', missing);
            return false;
        }
        
        console.log('✅ Flujo de datos válido');
        return true;
    }
}

// Inicializar en desarrollo
if (window.APP_CONFIG?.ENV?.DEBUG) {
    DevelopmentTools.enableDebugMode();
}
```

---

## 📝 RESUMEN EJECUTIVO

### **Lecciones Clave Aprendidas:**

1. **📋 Esquema Primero**: Nunca asumir estructura de BD - siempre verificar
2. **🔄 Sincronización**: Mantener consistencia absoluta entre frontend/backend
3. **🗂️ Flujo de Datos**: Mapear completamente el ciclo de vida de los datos
4. **🔐 Autenticación Gradual**: Diferenciar entre endpoints públicos, onboarding y protegidos
5. **🐛 Debugging Proactivo**: Logs detallados y herramientas de monitoreo
6. **🛡️ Manejo de Erroes**: Recuperación graceful en cada capa

### **Patrones Establecidos:**

- **Onboarding**: localStorage persiste hasta final del flujo
- **Autenticación**: Token JWT solo después de login exitoso
- **API**: Estructuras de respuesta consistentes y validadas
- **Desarrollo**: Checklists pre, durante y post implementación

### **Resultado:**
✅ **Flujo de onboarding completamente funcional**
✅ **Arquitectura escalable y mantenible**
✅ **Base sólida para features futuros**

---

*Esta guía debe ser consultada antes de implementar cualquier nuevo feature o modificar el flujo existente.*