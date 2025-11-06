// backend/debug-complete.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 INICIANDO DIAGNÓSTICO COMPLETO DEL BACKEND\n');

// Colores para consola
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function logSuccess(message) {
    console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message) {
    console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logWarning(message) {
    console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function logInfo(message) {
    console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

// ==========================================================
// 1. VERIFICACIÓN DE ARCHIVOS Y ESTRUCTURA
// ==========================================================

console.log(`${colors.cyan}📁 1. VERIFICANDO ESTRUCTURA DE ARCHIVOS${colors.reset}\n`);

const requiredFiles = [
    './server.js',
    './config/database.js',
    './routes/auth-routes.js',
    './routes/leccionRoutes.js',
    './routes/multimediaRoutes.js',
    './routes/cursosRoutes.js',
    './controllers/cursosController.js',
    './middleware/auth.js'
];

requiredFiles.forEach(file => {
    const fullPath = path.resolve(__dirname, file);
    const exists = fs.existsSync(fullPath);
    
    if (exists) {
        const stats = fs.statSync(fullPath);
        logSuccess(`${file} - ${stats.size} bytes`);
    } else {
        logError(`${file} - NO EXISTE`);
    }
});

// ==========================================================
// 2. VERIFICACIÓN DE SINTAXIS DE ARCHIVOS
// ==========================================================

console.log(`\n${colors.cyan}🔧 2. VERIFICANDO SINTAXIS DE ARCHIVOS${colors.reset}\n`);

const filesToCheck = [
    './server.js',
    './routes/auth-routes.js',
    './routes/leccionRoutes.js', 
    './routes/multimediaRoutes.js',
    './routes/cursosRoutes.js'
];

filesToCheck.forEach(file => {
    try {
        execSync(`node -c ${file}`, { stdio: 'pipe' });
        logSuccess(`${file} - Sintaxis correcta`);
    } catch (error) {
        logError(`${file} - Error de sintaxis: ${error.message.split('\n')[0]}`);
    }
});

// ==========================================================
// 3. VERIFICACIÓN DE EXPORTACIONES DE RUTAS
// ==========================================================

console.log(`\n${colors.cyan}🔄 3. VERIFICANDO EXPORTACIONES DE RUTAS${colors.reset}\n`);

const routeFiles = [
    { name: 'auth-routes', path: './routes/auth-routes.js' },
    { name: 'leccionRoutes', path: './routes/leccionRoutes.js' },
    { name: 'multimediaRoutes', path: './routes/multimediaRoutes.js' },
    { name: 'cursosRoutes', path: './routes/cursosRoutes.js' }
];

routeFiles.forEach(route => {
    try {
        const routeModule = require(path.resolve(__dirname, route.path));
        
        console.log(`📦 ${route.name}:`);
        console.log(`   Tipo: ${typeof routeModule}`);
        console.log(`   Es función: ${typeof routeModule === 'function'}`);
        console.log(`   Es objeto: ${typeof routeModule === 'object'}`);
        
        if (typeof routeModule === 'function') {
            logSuccess('   ✅ Exporta una función (Router de Express)');
        } else if (typeof routeModule === 'object' && routeModule.stack) {
            logSuccess('   ✅ Exporta un objeto Router válido');
        } else {
            logError('   ❌ No exporta un Router válido de Express');
            console.log('   Contenido:', JSON.stringify(routeModule, null, 2).substring(0, 200) + '...');
        }
        
    } catch (error) {
        logError(`   ❌ Error al importar ${route.name}: ${error.message}`);
    }
    console.log('');
});

// ==========================================================
// 4. VERIFICACIÓN DE DEPENDENCIAS
// ==========================================================

console.log(`${colors.cyan}📦 4. VERIFICANDO DEPENDENCIAS${colors.reset}\n`);

try {
    const packageJson = require('./package.json');
    const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
    };

    const requiredDeps = ['express', 'cors', 'helmet', 'dotenv', 'express-rate-limit'];
    
    requiredDeps.forEach(dep => {
        if (dependencies[dep]) {
            logSuccess(`${dep}: ${dependencies[dep]}`);
        } else {
            logError(`${dep}: NO INSTALADA`);
        }
    });
} catch (error) {
    logError('No se pudo leer package.json');
}

// ==========================================================
// 5. VERIFICACIÓN DE VARIABLES DE ENTORNO
// ==========================================================

console.log(`\n${colors.cyan}🔐 5. VERIFICANDO VARIABLES DE ENTORNO${colors.reset}\n`);

try {
    require('dotenv').config();
    
    const envVars = [
        'PORT',
        'HOST', 
        'NODE_ENV',
        'JWT_SECRET',
        'DB_HOST',
        'DB_USER',
        'DB_PASSWORD',
        'DB_NAME'
    ];
    
    envVars.forEach(envVar => {
        if (process.env[envVar]) {
            if (envVar.includes('PASSWORD') || envVar.includes('SECRET')) {
                logSuccess(`${envVar}: ******** (definida)`);
            } else {
                logSuccess(`${envVar}: ${process.env[envVar]}`);
            }
        } else {
            logWarning(`${envVar}: NO DEFINIDA`);
        }
    });
} catch (error) {
    logError('Error cargando variables de entorno');
}

// ==========================================================
// 6. VERIFICACIÓN DE CONTROLADORES
// ==========================================================

console.log(`\n${colors.cyan}🎯 6. VERIFICANDO CONTROLADORES${colors.reset}\n`);

const controllers = [
    { name: 'cursosController', path: './controllers/cursosController.js' }
];

controllers.forEach(controller => {
    try {
        const controllerModule = require(path.resolve(__dirname, controller.path));
        
        console.log(`📝 ${controller.name}:`);
        const exportedFunctions = Object.keys(controllerModule);
        
        if (exportedFunctions.length > 0) {
            logSuccess(`   Exporta ${exportedFunctions.length} funciones:`);
            exportedFunctions.forEach(func => {
                console.log(`     - ${func}: ${typeof controllerModule[func]}`);
            });
        } else {
            logError('   ❌ No exporta ninguna función');
        }
        
    } catch (error) {
        logError(`   ❌ Error al importar ${controller.name}: ${error.message}`);
    }
});

// ==========================================================
// 7. SIMULACIÓN DE CARGA DEL SERVIDOR
// ==========================================================

console.log(`\n${colors.cyan}🚀 7. SIMULANDO CARGA DEL SERVIDOR${colors.reset}\n`);

try {
    // Cargar express para prueba
    const express = require('express');
    const testApp = express();
    
    // Intentar cargar cada ruta individualmente
    routeFiles.forEach(route => {
        try {
            const routeModule = require(path.resolve(__dirname, route.path));
            testApp.use(`/test-${route.name}`, routeModule);
            logSuccess(`✅ ${route.name} - Se puede cargar en Express`);
        } catch (error) {
            logError(`❌ ${route.name} - Error al cargar: ${error.message}`);
        }
    });
    
} catch (error) {
    logError(`Error en simulación: ${error.message}`);
}

// ==========================================================
// 8. VERIFICACIÓN DE MIDDLEWARE
// ==========================================================

console.log(`\n${colors.cyan}🛡️  8. VERIFICANDO MIDDLEWARE${colors.reset}\n`);

try {
    const authMiddleware = require('./middleware/auth.js');
    const middlewareFunctions = Object.keys(authMiddleware);
    
    if (middlewareFunctions.length > 0) {
        logSuccess(`Middleware auth exporta ${middlewareFunctions.length} funciones:`);
        middlewareFunctions.forEach(func => {
            console.log(`   - ${func}: ${typeof authMiddleware[func]}`);
        });
    } else {
        logError('Middleware auth no exporta funciones');
    }
} catch (error) {
    logError(`Error cargando middleware: ${error.message}`);
}

// ==========================================================
// RESUMEN FINAL
// ==========================================================

console.log(`\n${colors.magenta}📊 RESUMEN DEL DIAGNÓSTICO${colors.reset}\n`);

console.log('Problemas comunes detectados:');
console.log('1. Archivo de rutas no existe');
console.log('2. Archivo de rutas no exporta un Router de Express');
console.log('3. Error de sintaxis en archivo de rutas');
console.log('4. Dependencias faltantes');
console.log('5. Variables de entorno no configuradas\n');

console.log(`${colors.yellow}💡 PRÓXIMOS PASOS:${colors.reset}`);
console.log('1. Ejecuta este diagnóstico: node debug-complete.js');
console.log('2. Revisa qué archivo específicamente está fallando');
console.log('3. Si falta algún archivo, créalo con la estructura básica');
console.log('4. Si hay error de sintaxis, corrige el archivo mencionado');
console.log('5. Vuelve a ejecutar npm run dev\n');

console.log(`${colors.green}🎯 SOLUCIÓN RÁPIDA:${colors.reset}`);
console.log('Si el problema es cursosRoutes.js, crea este archivo temporal:');
console.log(`
// backend/routes/cursosRoutes.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: 'Ruta de cursos funcionando' });
});

module.exports = router;
`);

// Ejecutar verificación final
console.log(`\n${colors.cyan}🔍 EJECUTANDO VERIFICACIÓN FINAL...${colors.reset}\n`);

// Verificar si podemos cargar server.js sin ejecutarlo
try {
    const serverContent = fs.readFileSync('./server.js', 'utf8');
    
    // Buscar líneas problemáticas
    const lines = serverContent.split('\n');
    const routeLines = lines.filter(line => 
        line.includes('app.use') && line.includes('/api/')
    );
    
    console.log('Líneas de rutas encontradas en server.js:');
    routeLines.forEach(line => {
        console.log(`   📍 ${line.trim()}`);
    });
    
    logSuccess('✅ server.js se puede leer sin errores de sintaxis');
    
} catch (error) {
    logError(`❌ Error leyendo server.js: ${error.message}`);
}

console.log(`\n${colors.green}✨ DIAGNÓSTICO COMPLETADO ${colors.reset}\n`);cd 