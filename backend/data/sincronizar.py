#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🔄 SINCRONIZADOR MAESTRO - SpeakLexi 2.0
Sincroniza lecciones de BD con KB y genera ejercicios automáticamente
"""

import pymysql
import json
from pathlib import Path
from datetime import datetime

# ============================================
# CONFIGURACIÓN
# ============================================
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'loquesea2013',
    'database': 'SpeakLexi2',
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

KB_PATH = Path('D:/PROJECTS/speakLexi-2.0/backend/data/kb')

# ============================================
# FUNCIONES
# ============================================

def conectar_bd():
    try:
        conexion = pymysql.connect(**DB_CONFIG)
        print("✅ Conexión exitosa a la base de datos\n")
        return conexion
    except Exception as e:
        print(f"❌ Error al conectar: {e}")
        exit(1)

def cargar_kb():
    """Cargar todos los archivos KB"""
    kb_data = {}
    
    kb_files = {
        'Inglés': 'kb_ingles.json',
        'Francés': 'kb_frances.json',
        'Alemán': 'kb_aleman.json',
        'Italiano': 'kb_italiano.json'
    }
    
    print("📥 Cargando Knowledge Base...")
    for idioma, filename in kb_files.items():
        filepath = KB_PATH / filename
        if filepath.exists():
            with open(filepath, 'r', encoding='utf-8') as f:
                content = json.load(f)
                kb_data[idioma] = content.get(idioma, {})
                
                # Contar lecciones por nivel
                total = sum(len(temas) for temas in kb_data[idioma].values())
                print(f"  ✅ {idioma}: {total} lecciones en KB")
        else:
            print(f"  ⚠️  {idioma}: Archivo no encontrado")
            kb_data[idioma] = {}
    
    return kb_data

def obtener_creador_id(cursor):
    """Obtener ID de usuario para asignar como creador"""
    cursor.execute("SELECT id FROM usuarios WHERE rol IN ('profesor', 'admin') LIMIT 1")
    resultado = cursor.fetchone()
    return resultado['id'] if resultado else 1

def sincronizar_lecciones(cursor, kb_data, creador_id):
    """
    Sincronizar lecciones de BD con KB
    - Actualiza títulos si hay match parcial
    - Crea lecciones nuevas si no existen
    - Marca lecciones huérfanas
    """
    print("\n🔄 Sincronizando lecciones con KB...")
    print("="*80)
    
    estadisticas = {
        'actualizadas': 0,
        'creadas': 0,
        'huerfanas': 0,
        'correctas': 0
    }
    
    lecciones_kb = {}  # Para trackear qué lecciones deberían existir
    lecciones_bd = {}  # Para trackear qué lecciones existen
    
    # 1. Obtener todas las lecciones de BD
    cursor.execute("SELECT id, titulo, idioma, nivel FROM lecciones")
    for leccion in cursor.fetchall():
        key = f"{leccion['idioma']}-{leccion['nivel']}-{leccion['titulo']}"
        lecciones_bd[key] = leccion['id']
    
    # 2. Recorrer KB y sincronizar
    for idioma, niveles in kb_data.items():
        if not niveles:
            continue
            
        print(f"\n📚 {idioma}:")
        
        for nivel, temas in niveles.items():
            for titulo_kb in temas.keys():
                key_kb = f"{idioma}-{nivel}-{titulo_kb}"
                lecciones_kb[key_kb] = True
                
                # Buscar si existe en BD
                if key_kb in lecciones_bd:
                    # ✅ Existe y coincide exactamente
                    estadisticas['correctas'] += 1
                    print(f"  ✅ {nivel} - {titulo_kb}")
                else:
                    # Buscar match parcial (mismo idioma y nivel, título similar)
                    encontrada = False
                    for key_bd, leccion_id in lecciones_bd.items():
                        partes = key_bd.split('-', 2)
                        if len(partes) >= 3:
                            idioma_bd, nivel_bd, titulo_bd = partes[0], partes[1], partes[2]
                            
                            if idioma_bd == idioma and nivel_bd == nivel:
                                # Verificar si es match parcial
                                if titulo_kb.lower() in titulo_bd.lower() or titulo_bd.lower() in titulo_kb.lower():
                                    # ⚠️ Actualizar título
                                    cursor.execute(
                                        "UPDATE lecciones SET titulo = %s WHERE id = %s",
                                        (titulo_kb, leccion_id)
                                    )
                                    estadisticas['actualizadas'] += 1
                                    print(f"  ⚠️  {nivel} - {titulo_bd} → {titulo_kb}")
                                    encontrada = True
                                    break
                    
                    if not encontrada:
                        # ✨ Crear nueva lección
                        contenido = json.dumps({
                            "descripcion": f"Lección de {titulo_kb}",
                            "temas": list(temas[titulo_kb].get('vocabulario', [])[:5]),
                            "nivel": nivel,
                            "idioma": idioma
                        }, ensure_ascii=False)
                        
                        cursor.execute("""
                            INSERT INTO lecciones (
                                titulo, descripcion, contenido, nivel, idioma,
                                duracion_minutos, orden, estado, creado_por
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """, (
                            titulo_kb,
                            f"Aprende sobre {titulo_kb}",
                            contenido,
                            nivel,
                            idioma,
                            40,  # duración por defecto
                            0,
                            'activa',
                            creador_id
                        ))
                        estadisticas['creadas'] += 1
                        print(f"  ✨ {nivel} - {titulo_kb} (NUEVA)")
    
    # 3. Identificar lecciones huérfanas (en BD pero no en KB)
    print(f"\n🔍 Buscando lecciones huérfanas...")
    for key_bd in lecciones_bd.keys():
        if key_bd not in lecciones_kb:
            estadisticas['huerfanas'] += 1
            partes = key_bd.split('-', 2)
            if len(partes) >= 3:
                print(f"  ⚠️  Huérfana: {partes[0]} - {partes[1]} - {partes[2]}")
    
    return estadisticas

def borrar_huerfanas(cursor, kb_data):
    """Borrar lecciones que no están en el KB"""
    print("\n🗑️  ¿Deseas borrar las lecciones huérfanas? (s/n): ", end='')
    respuesta = input().strip().lower()
    
    if respuesta != 's':
        print("⏭️  Saltando borrado de huérfanas")
        return 0
    
    # Obtener IDs de lecciones huérfanas
    cursor.execute("SELECT id, titulo, idioma, nivel FROM lecciones")
    lecciones_bd = cursor.fetchall()
    
    ids_huerfanas = []
    for leccion in lecciones_bd:
        idioma = leccion['idioma']
        nivel = leccion['nivel']
        titulo = leccion['titulo']
        
        # Verificar si existe en KB
        if idioma in kb_data and nivel in kb_data[idioma]:
            if titulo not in kb_data[idioma][nivel]:
                ids_huerfanas.append(leccion['id'])
    
    if not ids_huerfanas:
        print("✅ No hay lecciones huérfanas")
        return 0
    
    # Borrar ejercicios primero
    placeholders = ','.join(['%s'] * len(ids_huerfanas))
    cursor.execute(f"DELETE FROM ejercicios WHERE leccion_id IN ({placeholders})", ids_huerfanas)
    ejercicios_borrados = cursor.rowcount
    
    # Borrar lecciones
    cursor.execute(f"DELETE FROM lecciones WHERE id IN ({placeholders})", ids_huerfanas)
    lecciones_borradas = cursor.rowcount
    
    print(f"✅ {lecciones_borradas} lecciones huérfanas eliminadas")
    print(f"✅ {ejercicios_borrados} ejercicios asociados eliminados")
    
    return lecciones_borradas

def main():
    print("="*80)
    print("🔄 SINCRONIZADOR MAESTRO - SpeakLexi 2.0")
    print("="*80)
    print()
    print("Este script:")
    print("  1. Lee el Knowledge Base (KB)")
    print("  2. Sincroniza lecciones en BD con el KB")
    print("  3. Actualiza títulos si hay diferencias")
    print("  4. Crea lecciones nuevas si faltan")
    print("  5. Opcionalmente borra lecciones huérfanas")
    print()
    
    # Conectar
    conn = conectar_bd()
    cursor = conn.cursor()
    
    try:
        # Obtener creador
        creador_id = obtener_creador_id(cursor)
        
        # Cargar KB
        kb_data = cargar_kb()
        
        # Sincronizar
        stats = sincronizar_lecciones(cursor, kb_data, creador_id)
        
        # Mostrar resumen
        print("\n" + "="*80)
        print("📊 RESUMEN DE SINCRONIZACIÓN")
        print("="*80)
        print(f"✅ Lecciones correctas (ya existían): {stats['correctas']}")
        print(f"⚠️  Lecciones actualizadas (título corregido): {stats['actualizadas']}")
        print(f"✨ Lecciones creadas (nuevas): {stats['creadas']}")
        print(f"⚠️  Lecciones huérfanas (en BD pero no en KB): {stats['huerfanas']}")
        print("="*80)
        
        # Confirmar cambios
        if stats['actualizadas'] > 0 or stats['creadas'] > 0:
            print("\n¿Confirmar estos cambios? (s/n): ", end='')
            respuesta = input().strip().lower()
            
            if respuesta == 's':
                conn.commit()
                print("✅ Cambios guardados")
                
                # Borrar huérfanas
                if stats['huerfanas'] > 0:
                    borradas = borrar_huerfanas(cursor, kb_data)
                    if borradas > 0:
                        conn.commit()
                        print("✅ Huérfanas eliminadas")
            else:
                conn.rollback()
                print("❌ Cambios descartados")
        
        print("\n🎉 ¡Sincronización completada!")
        print("\n💡 Siguiente paso: Ejecuta generar_ejercicios.py para crear ejercicios")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        conn.rollback()
        import traceback
        traceback.print_exc()
    
    finally:
        cursor.close()
        conn.close()
        print("\n👋 Conexión cerrada")

if __name__ == '__main__':
    main()