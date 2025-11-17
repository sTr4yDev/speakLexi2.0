#!/usr/bin/env python3
"""
SCRIPT: Integrador Automático de Navbar y Notificaciones
VERSIÓN: 2.0
AUTOR: SpeakLexi Team
DESCRIPCIÓN: Agrega automáticamente navbar-loader.js y notificaciones-manager.js
             a todos los archivos HTML del proyecto (excepto páginas de auth)

USO:
    python integrar-navbar.py                    # Modo completo
    python integrar-navbar.py completo           # Modo completo (explícito)
    python integrar-navbar.py solo-notificaciones # Solo notificaciones
    python integrar-navbar.py verificar          # Solo verificar (no modifica)
"""

import os
import re
from pathlib import Path
import sys
from datetime import datetime

# ==================== CONFIGURACIÓN ====================

# Rutas
FRONTEND_DIR = Path(__file__).parent.parent
PAGES_DIR = FRONTEND_DIR / "pages"

# Template del navbar container (si no existe)
NAVBAR_CONTAINER = """    <!-- Navbar -->
    <div id="navbar-container"></div>
"""

# Scripts del navbar (si no existen)
NAVBAR_SCRIPTS = """    <!-- Navbar y componentes -->
    <script src="/frontend/assets/js/core/navbar-loader.js"></script>
"""

# Scripts de notificaciones
NOTIFICACIONES_SCRIPTS = """    <!-- Sistema de notificaciones y mensajes -->
    <script src="/frontend/assets/js/core/notificaciones-manager.js"></script>
"""

# Páginas que NO necesitan navbar (auth y landing)
PAGINAS_SIN_NAVBAR = [
    'login.html', 
    'registro.html', 
    'recuperar-contrasena.html', 
    'restablecer-contrasena.html', 
    'verificar-email.html',
    'index.html'  # Landing page tiene su propio navbar
]

# ==================== FUNCIONES DE VERIFICACIÓN ====================

def tiene_navbar_container(contenido):
    """Verifica si el HTML ya tiene el contenedor del navbar"""
    return 'id="navbar-container"' in contenido or 'data-navbar' in contenido

def tiene_navbar_loader(contenido):
    """Verifica si el HTML ya tiene navbar-loader.js"""
    return 'navbar-loader.js' in contenido

def tiene_notificaciones(contenido):
    """Verifica si el HTML ya tiene notificaciones-manager.js"""
    return 'notificaciones-manager.js' in contenido

# ==================== FUNCIONES DE MODIFICACIÓN ====================

def agregar_navbar_container(contenido):
    """
    Agrega el div del navbar después del <body>
    Retorna: (contenido_modificado, cambio_realizado)
    """
    if tiene_navbar_container(contenido):
        return contenido, False
    
    # Buscar etiqueta <body> (con o sin atributos)
    patron = r'(<body[^>]*>)'
    match = re.search(patron, contenido, re.IGNORECASE)
    
    if match:
        body_tag = match.group(1)
        contenido = contenido.replace(body_tag, f"{body_tag}\n{NAVBAR_CONTAINER}", 1)
        return contenido, True
    
    return contenido, False

def agregar_navbar_scripts(contenido):
    """
    Agrega navbar-loader.js antes del </head>
    Retorna: (contenido_modificado, cambio_realizado)
    """
    if tiene_navbar_loader(contenido):
        return contenido, False
    
    # Buscar </head>
    if "</head>" in contenido:
        contenido = contenido.replace("</head>", f"{NAVBAR_SCRIPTS}\n</head>", 1)
        return contenido, True
    
    return contenido, False

def agregar_notificaciones_scripts(contenido):
    """
    Agrega notificaciones-manager.js antes del </body>
    Retorna: (contenido_modificado, cambio_realizado)
    """
    if tiene_notificaciones(contenido):
        return contenido, False
    
    # Buscar </body>
    if "</body>" in contenido:
        contenido = contenido.replace("</body>", f"{NOTIFICACIONES_SCRIPTS}\n</body>", 1)
        return contenido, True
    
    return contenido, False

# ==================== PROCESAMIENTO DE ARCHIVOS ====================

def es_pagina_sin_navbar(archivo):
    """Verifica si la página NO debe tener navbar"""
    return any(pagina in archivo.name for pagina in PAGINAS_SIN_NAVBAR)

def procesar_html(archivo, modo='completo', estadisticas=None):
    """
    Procesa un archivo HTML según el modo especificado
    
    Modos:
    - completo: Agrega navbar container + scripts + notificaciones
    - solo-notificaciones: Solo agrega notificaciones-manager.js
    - verificar: Solo verifica sin modificar
    """
    
    ruta_relativa = archivo.relative_to(FRONTEND_DIR)
    print(f"\n📄 {ruta_relativa}")
    
    # Verificar si es una página sin navbar
    if es_pagina_sin_navbar(archivo):
        print("    ⏭️  Página sin navbar (auth/landing)")
        if estadisticas:
            estadisticas['saltados'] += 1
        return
    
    try:
        # Leer archivo
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido_original = f.read()
        
        contenido = contenido_original
        cambios = []
        
        # MODO VERIFICAR - Solo mostrar estado
        if modo == 'verificar':
            faltan = []
            if not tiene_navbar_container(contenido):
                faltan.append("navbar container")
            if not tiene_navbar_loader(contenido):
                faltan.append("navbar-loader.js")
            if not tiene_notificaciones(contenido):
                faltan.append("notificaciones-manager.js")
            
            if faltan:
                print(f"    ⚠️  Faltan: {', '.join(faltan)}")
                if estadisticas:
                    estadisticas['con_faltantes'] += 1
            else:
                print("    ✅ Completo")
                if estadisticas:
                    estadisticas['completos'] += 1
            return
        
        # MODO COMPLETO - Agregar todo
        if modo == 'completo':
            # 1. Navbar container
            contenido, cambiado = agregar_navbar_container(contenido)
            if cambiado:
                cambios.append("navbar container")
            
            # 2. Navbar scripts
            contenido, cambiado = agregar_navbar_scripts(contenido)
            if cambiado:
                cambios.append("navbar-loader.js")
        
        # AMBOS MODOS - Agregar notificaciones
        contenido, cambiado = agregar_notificaciones_scripts(contenido)
        if cambiado:
            cambios.append("notificaciones-manager.js")
        
        # Guardar si hubo cambios
        if cambios:
            with open(archivo, 'w', encoding='utf-8') as f:
                f.write(contenido)
            print(f"    ✅ Agregado: {', '.join(cambios)}")
            if estadisticas:
                estadisticas['modificados'] += 1
        else:
            print("    ⏭️  Ya tiene todo")
            if estadisticas:
                estadisticas['sin_cambios'] += 1
            
    except Exception as e:
        print(f"    ❌ Error: {e}")
        if estadisticas:
            estadisticas['errores'] += 1

# ==================== UTILIDADES ====================

def buscar_html_files(directorio):
    """Busca recursivamente todos los archivos .html"""
    archivos = []
    for root, dirs, files in os.walk(directorio):
        # Ignorar carpetas específicas
        if 'node_modules' in root or '.git' in root or '__pycache__' in root:
            continue
        
        for file in files:
            if file.endswith('.html'):
                archivos.append(Path(root) / file)
    
    return sorted(archivos)

def mostrar_ayuda():
    """Muestra la ayuda del script"""
    print(__doc__)
    sys.exit(0)

# ==================== FUNCIÓN PRINCIPAL ====================

def main():
    """Función principal del script"""
    
    # Mostrar ayuda si se solicita
    if len(sys.argv) > 1 and sys.argv[1] in ['-h', '--help', 'help']:
        mostrar_ayuda()
    
    # Banner
    print("=" * 70)
    print("🚀 INTEGRADOR AUTOMÁTICO DE NAVBAR Y NOTIFICACIONES")
    print("   SpeakLexi 2.0 - Automatización de Frontend")
    print("=" * 70)
    
    # Determinar modo
    modo = 'completo'
    if len(sys.argv) > 1:
        modo_arg = sys.argv[1].lower()
        if modo_arg in ['completo', 'solo-notificaciones', 'verificar']:
            modo = modo_arg
        else:
            print(f"\n❌ Modo inválido: {sys.argv[1]}")
            print("   Modos válidos: completo, solo-notificaciones, verificar")
            sys.exit(1)
    
    # Información del modo
    descripciones_modo = {
        'completo': 'Agregar navbar completo + notificaciones',
        'solo-notificaciones': 'Solo agregar notificaciones-manager.js',
        'verificar': 'Verificar estado sin modificar archivos'
    }
    
    print(f"\n📋 Modo: {modo}")
    print(f"   {descripciones_modo[modo]}")
    print(f"\n📂 Directorio base: {FRONTEND_DIR}")
    print(f"📂 Directorio páginas: {PAGES_DIR}")
    
    # Verificar que exista el directorio
    if not PAGES_DIR.exists():
        print(f"\n❌ Error: No se encontró el directorio {PAGES_DIR}")
        sys.exit(1)
    
    # Buscar archivos
    print(f"\n🔍 Buscando archivos HTML...")
    archivos_html = buscar_html_files(PAGES_DIR)
    
    if not archivos_html:
        print("❌ No se encontraron archivos HTML")
        sys.exit(1)
    
    print(f"📊 {len(archivos_html)} archivos HTML encontrados")
    
    # Estadísticas
    estadisticas = {
        'modificados': 0,
        'sin_cambios': 0,
        'saltados': 0,
        'errores': 0,
        'completos': 0,
        'con_faltantes': 0
    }
    
    # Procesar cada archivo
    print("\n" + "-" * 70)
    for archivo in archivos_html:
        procesar_html(archivo, modo, estadisticas)
    
    # Resumen final
    print("\n" + "=" * 70)
    print("📊 RESUMEN DEL PROCESO")
    print("=" * 70)
    
    if modo == 'verificar':
        print(f"✅ Archivos completos:     {estadisticas['completos']}")
        print(f"⚠️  Archivos con faltantes: {estadisticas['con_faltantes']}")
    else:
        print(f"✅ Archivos modificados:   {estadisticas['modificados']}")
        print(f"⏭️  Sin cambios:            {estadisticas['sin_cambios']}")
    
    print(f"⏭️  Archivos saltados:     {estadisticas['saltados']}")
    
    if estadisticas['errores'] > 0:
        print(f"❌ Errores:                {estadisticas['errores']}")
    
    print("\n" + "=" * 70)
    
    # Mensaje final según el modo
    if modo != 'verificar':
        print("✅ Proceso completado exitosamente")
        print("\n⚠️  PASOS SIGUIENTES:")
        print("   1. Verifica que las páginas se vean correctamente")
        print("   2. Prueba las notificaciones en diferentes roles")
        print("   3. Revisa la consola del navegador por errores")
        print("   4. Ejecuta 'python integrar-navbar.py verificar' para confirmar")
    else:
        print("✅ Verificación completada")
        if estadisticas['con_faltantes'] > 0:
            print(f"\n⚠️  {estadisticas['con_faltantes']} archivos necesitan actualizarse")
            print("   Ejecuta: python integrar-navbar.py completo")
    
    print("\n📅 Fecha de ejecución:", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print("=" * 70)

# ==================== PUNTO DE ENTRADA ====================

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Proceso interrumpido por el usuario")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error crítico: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)