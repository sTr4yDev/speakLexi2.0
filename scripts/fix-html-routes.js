#!/usr/bin/env node

/* ============================================
   SPEAKLEXI - FIX HTML ROUTES
   Script para corregir rutas duplicadas en archivos HTML
   
   Problema: /frontend/assets/ → /assets/
   Uso: node fix-html-routes.js
   ============================================ */

const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURACIÓN
// ============================================

const CONFIG = {
    // Directorio raíz del proyecto
    rootDir: path.join(__dirname, '..', 'frontend'),
    
    // Extensiones de archivo a procesar
    extensions: ['.html'],
    
    // Patrones a corregir
    patterns: [
        {
            search: /\/frontend\/assets\//g,
            replace: '/assets/',
            description: 'Rutas de assets duplicadas'
        },
        {
            search: /\/frontend\/config\//g,
            replace: '/config/',
            description: 'Rutas de config duplicadas'
        },
        {
            search: /\/frontend\/pages\//g,
            replace: '/pages/',
            description: 'Rutas de pages duplicadas'
        },
        {
            search: /href="\/frontend\//g,
            replace: 'href="/',
            description: 'Enlaces href con /frontend/'
        },
        {
            search: /src="\/frontend\//g,
            replace: 'src="/',
            description: 'Scripts/imágenes src con /frontend/'
        }
    ],
    
    // Directorios a excluir
    excludeDirs: ['node_modules', '.git', 'dist', 'build'],
    
    // Modo dry-run (solo mostrar cambios sin aplicarlos)
    dryRun: false
};

// ============================================
// COLORES PARA CONSOLA
// ============================================

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

function log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

/**
 * Obtiene todos los archivos HTML recursivamente
 */
function getAllHtmlFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            // Excluir directorios
            if (!CONFIG.excludeDirs.includes(file)) {
                getAllHtmlFiles(filePath, fileList);
            }
        } else {
            // Verificar extensión
            const ext = path.extname(file);
            if (CONFIG.extensions.includes(ext)) {
                fileList.push(filePath);
            }
        }
    });
    
    return fileList;
}

/**
 * Procesa un archivo HTML
 */
function processFile(filePath) {
    const relativePath = path.relative(CONFIG.rootDir, filePath);
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;
    let changes = [];
    
    // Aplicar cada patrón
    CONFIG.patterns.forEach(pattern => {
        const matches = content.match(pattern.search);
        if (matches && matches.length > 0) {
            content = content.replace(pattern.search, pattern.replace);
            modified = true;
            changes.push({
                pattern: pattern.description,
                count: matches.length
            });
        }
    });
    
    return {
        path: relativePath,
        modified,
        changes,
        content
    };
}

/**
 * Genera reporte de cambios
 */
function generateReport(results) {
    const modifiedFiles = results.filter(r => r.modified);
    const unchangedFiles = results.filter(r => !r.modified);
    
    log('\n' + '='.repeat(60), 'cyan');
    log('📊 REPORTE DE CORRECCIÓN DE RUTAS HTML', 'bright');
    log('='.repeat(60), 'cyan');
    
    log(`\n📁 Total de archivos analizados: ${results.length}`, 'white');
    log(`✅ Archivos modificados: ${modifiedFiles.length}`, 'green');
    log(`⚪ Archivos sin cambios: ${unchangedFiles.length}`, 'white');
    
    if (modifiedFiles.length > 0) {
        log('\n' + '-'.repeat(60), 'cyan');
        log('📝 ARCHIVOS MODIFICADOS:', 'yellow');
        log('-'.repeat(60), 'cyan');
        
        modifiedFiles.forEach((result, index) => {
            log(`\n${index + 1}. ${result.path}`, 'bright');
            result.changes.forEach(change => {
                log(`   ✓ ${change.pattern}: ${change.count} reemplazo(s)`, 'green');
            });
        });
    }
    
    if (CONFIG.dryRun) {
        log('\n⚠️  MODO DRY-RUN: No se aplicaron cambios', 'yellow');
        log('   Ejecuta sin --dry-run para aplicar los cambios', 'white');
    }
    
    log('\n' + '='.repeat(60), 'cyan');
}

/**
 * Crea backup de archivos
 */
function createBackup(filePath) {
    const backupPath = filePath + '.backup';
    fs.copyFileSync(filePath, backupPath);
    return backupPath;
}

/**
 * Función principal
 */
function main() {
    log('\n🚀 Iniciando corrección de rutas HTML...', 'cyan');
    log(`📂 Directorio: ${CONFIG.rootDir}\n`, 'white');
    
    // Verificar que existe el directorio
    if (!fs.existsSync(CONFIG.rootDir)) {
        log(`❌ Error: No se encontró el directorio ${CONFIG.rootDir}`, 'red');
        process.exit(1);
    }
    
    // Obtener todos los archivos HTML
    log('🔍 Buscando archivos HTML...', 'yellow');
    const htmlFiles = getAllHtmlFiles(CONFIG.rootDir);
    log(`✓ ${htmlFiles.length} archivo(s) encontrado(s)\n`, 'green');
    
    if (htmlFiles.length === 0) {
        log('⚠️  No se encontraron archivos HTML para procesar', 'yellow');
        return;
    }
    
    // Procesar archivos
    log('⚙️  Procesando archivos...', 'yellow');
    const results = [];
    let totalChanges = 0;
    
    htmlFiles.forEach((filePath, index) => {
        const result = processFile(filePath);
        results.push(result);
        
        if (result.modified) {
            totalChanges++;
            
            if (!CONFIG.dryRun) {
                // Crear backup
                const backupPath = createBackup(filePath);
                log(`   📋 Backup creado: ${path.basename(backupPath)}`, 'cyan');
                
                // Escribir archivo modificado
                fs.writeFileSync(filePath, result.content, 'utf-8');
                log(`   ✓ ${result.path}`, 'green');
            } else {
                log(`   🔍 ${result.path} (${result.changes.length} cambio(s))`, 'yellow');
            }
        }
        
        // Mostrar progreso
        const progress = Math.round(((index + 1) / htmlFiles.length) * 100);
        process.stdout.write(`\r   Progreso: ${progress}%`);
    });
    
    console.log('\n');
    
    // Generar reporte
    generateReport(results);
    
    if (totalChanges > 0 && !CONFIG.dryRun) {
        log('\n✅ Corrección completada exitosamente', 'green');
        log('💡 Se crearon archivos .backup de todos los archivos modificados', 'cyan');
    } else if (totalChanges === 0) {
        log('\n✅ No se encontraron rutas que corregir', 'green');
    }
}

// ============================================
// MANEJO DE ARGUMENTOS
// ============================================

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║          SPEAKLEXI - FIX HTML ROUTES                       ║
║          Corrector automático de rutas HTML                ║
╚════════════════════════════════════════════════════════════╝

USO:
  node fix-html-routes.js [opciones]

OPCIONES:
  --dry-run         Simular cambios sin aplicarlos
  --root <path>     Especificar directorio raíz (default: ../frontend)
  --help, -h        Mostrar esta ayuda

EJEMPLOS:
  node fix-html-routes.js
  node fix-html-routes.js --dry-run
  node fix-html-routes.js --root ./mi-proyecto

PATRONES QUE CORRIGE:
  ✓ /frontend/assets/ → /assets/
  ✓ /frontend/config/ → /config/
  ✓ /frontend/pages/ → /pages/
  ✓ href="/frontend/" → href="/"
  ✓ src="/frontend/" → src="/"

SEGURIDAD:
  - Crea archivos .backup antes de modificar
  - Usa --dry-run para previsualizar cambios
  - Excluye automáticamente node_modules, .git, dist, build
    `);
    process.exit(0);
}

if (args.includes('--dry-run')) {
    CONFIG.dryRun = true;
    log('⚠️  Modo DRY-RUN activado\n', 'yellow');
}

const rootIndex = args.indexOf('--root');
if (rootIndex !== -1 && args[rootIndex + 1]) {
    CONFIG.rootDir = path.resolve(args[rootIndex + 1]);
}

// ============================================
// EJECUTAR
// ============================================

try {
    main();
} catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
}