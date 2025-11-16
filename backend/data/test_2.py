#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🔄 SINCRONIZADOR DE TÍTULOS BD ↔ KB v2.0
Compara los títulos de lecciones en la BD con el Knowledge Base
y genera los UPDATEs SQL necesarios para sincronizarlos.
"""

import pymysql
import json
import os
from pathlib import Path
from typing import Dict, List, Tuple
from difflib import SequenceMatcher
from dotenv import load_dotenv
import getpass

# Cargar variables de entorno
load_dotenv()

# ===== CONFIGURACIÓN =====
KB_PATH = Path('D:/PROJECTS/speakLexi-2.0/backend/data/kb')

# ===== FUNCIONES =====

def get_db_connection():
    """Obtiene conexión a la BD con credenciales del usuario"""
    print("\n🔐 Configuración de Base de Datos")
    print("="*50)
    
    host = input("Host (default: localhost): ").strip() or "localhost"
    user = input("Usuario (default: root): ").strip() or "root"
    password = getpass.getpass("Password (Enter si no tiene): ").strip() or ""
    database = input("Base de datos (default: speaklexi): ").strip() or "speaklexi"
    
    try:
        conn = pymysql.connect(
            host=host,
            user=user,
            password=password,
            database=database,
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        print("✅ Conexión exitosa\n")
        return conn
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return None

def similarity(a: str, b: str) -> float:
    """Calcula similitud entre dos strings (0-1)"""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def load_kb() -> Dict:
    """Carga todos los archivos KB"""
    kb_data = {}
    
    kb_files = {
        'Inglés': 'kb_ingles.json',
        'Francés': 'kb_frances.json',
        'Alemán': 'kb_aleman.json',
        'Italiano': 'kb_italiano.json'
    }
    
    for idioma, filename in kb_files.items():
        filepath = KB_PATH / filename
        if filepath.exists():
            with open(filepath, 'r', encoding='utf-8') as f:
                content = json.load(f)
                # El KB tiene estructura: {idioma: {niveles}}
                kb_data[idioma] = content.get(idioma, {})
                print(f"✅ Cargado KB: {idioma}")
        else:
            print(f"⚠️  No encontrado: {filepath}")
    
    return kb_data

def get_lecciones_bd(conn) -> List[Dict]:
    """Obtiene todas las lecciones de la BD"""
    with conn.cursor() as cursor:
        # Query simple - usa campos de texto directamente
        query = """
            SELECT id, titulo, idioma, nivel
            FROM lecciones
            ORDER BY idioma, nivel, titulo
        """
        
        cursor.execute(query)
        lecciones = cursor.fetchall()
        
        print(f"\n📊 Lecciones encontradas en BD: {len(lecciones)}")
        
    return lecciones

def find_best_match(titulo_bd: str, kb_lecciones: List[str]) -> Tuple[str, float]:
    """Encuentra la mejor coincidencia en el KB para un título de BD"""
    best_match = None
    best_score = 0
    
    for kb_titulo in kb_lecciones:
        score = similarity(titulo_bd, kb_titulo)
        if score > best_score:
            best_score = score
            best_match = kb_titulo
    
    return best_match, best_score

def generar_updates(conn) -> List[Dict]:
    """Genera lista de UPDATEs necesarios"""
    print("\n🔍 Analizando diferencias...\n")
    
    kb_data = load_kb()
    lecciones_bd = get_lecciones_bd(conn)
    
    if not lecciones_bd:
        return []
    
    updates = []
    matches_exactos = 0
    matches_parciales = 0
    sin_match = 0
    
    for leccion in lecciones_bd:
        leccion_id = leccion['id']
        titulo_bd = leccion['titulo']
        idioma = leccion['idioma']
        nivel = leccion['nivel']
        
        # Verificar si el idioma existe en KB
        if idioma not in kb_data:
            sin_match += 1
            continue
        
        kb_idioma = kb_data[idioma]
        
        if nivel not in kb_idioma:
            sin_match += 1
            continue
        
        kb_nivel = kb_idioma[nivel]
        kb_titulos = list(kb_nivel.keys())
        
        # Buscar match exacto
        if titulo_bd in kb_titulos:
            matches_exactos += 1
            continue
        
        # Buscar mejor match por similitud
        best_match, score = find_best_match(titulo_bd, kb_titulos)
        
        if score > 0.6:  # Umbral de similitud
            if score < 1.0:  # No es exacto
                matches_parciales += 1
                updates.append({
                    'id': leccion_id,
                    'titulo_actual': titulo_bd,
                    'titulo_nuevo': best_match,
                    'idioma': idioma,
                    'nivel': nivel,
                    'similitud': score
                })
        else:
            sin_match += 1
    
    print(f"\n📊 RESULTADOS:")
    print(f"  ✅ Matches exactos: {matches_exactos}")
    print(f"  ⚠️  Matches parciales (requieren update): {matches_parciales}")
    print(f"  ❌ Sin match: {sin_match}")
    
    return updates

def mostrar_preview(updates: List[Dict]):
    """Muestra preview de los cambios"""
    print("\n" + "="*80)
    print("📋 PREVIEW DE CAMBIOS")
    print("="*80 + "\n")
    
    for i, update in enumerate(updates, 1):
        print(f"{i}. [{update['idioma']}-{update['nivel']}] ID: {update['id']}")
        print(f"   ❌ Actual: {update['titulo_actual']}")
        print(f"   ✅ Nuevo:  {update['titulo_nuevo']}")
        print(f"   📊 Similitud: {update['similitud']:.1%}\n")
        
        if i >= 20 and len(updates) > 20:
            print(f"   ... y {len(updates) - 20} cambios más\n")
            break

def generar_sql(updates: List[Dict], filename: str = 'sync_titulos.sql'):
    """Genera archivo SQL con los UPDATEs"""
    sql_lines = [
        "-- ============================================",
        "-- SINCRONIZACIÓN DE TÍTULOS BD ↔ KB",
        f"-- Total de updates: {len(updates)}",
        "-- ============================================",
        "",
        "USE speaklexi;",
        "",
        "-- Iniciar transacción",
        "START TRANSACTION;",
        ""
    ]
    
    for update in updates:
        titulo_escapado = update['titulo_nuevo'].replace("'", "\\'")
        sql_lines.append(f"-- [{update['idioma']}-{update['nivel']}] {update['titulo_actual']} → {update['titulo_nuevo']}")
        sql_lines.append(
            f"UPDATE lecciones SET titulo = '{titulo_escapado}' WHERE id = {update['id']};"
        )
        sql_lines.append("")
    
    sql_lines.extend([
        "-- Confirmar cambios",
        "COMMIT;",
        "",
        "-- Verificar cambios",
        "SELECT COUNT(*) as total_actualizadas FROM lecciones;",
        ""
    ])
    
    # Guardar archivo
    output_path = Path(__file__).parent / filename
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))
    
    print(f"\n✅ Archivo SQL generado: {output_path}")
    return output_path

def ejecutar_updates(conn, updates: List[Dict]):
    """Ejecuta los UPDATEs en la BD"""
    print("\n🚀 Ejecutando UPDATEs...\n")
    
    try:
        with conn.cursor() as cursor:
            for update in updates:
                query = "UPDATE lecciones SET titulo = %s WHERE id = %s"
                cursor.execute(query, (update['titulo_nuevo'], update['id']))
        
        conn.commit()
        print(f"✅ {len(updates)} lecciones actualizadas correctamente")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {e}")

def main():
    print("="*80)
    print("🔄 SINCRONIZADOR DE TÍTULOS BD ↔ KB v2.0")
    print("="*80)
    
    # Conectar a BD
    conn = get_db_connection()
    if not conn:
        return
    
    try:
        # Generar lista de updates
        updates = generar_updates(conn)
        
        if not updates:
            print("\n✅ ¡Todo está sincronizado! No hay cambios necesarios.")
            return
        
        # Mostrar preview
        mostrar_preview(updates)
        
        # Generar SQL
        sql_file = generar_sql(updates)
        
        print("\n" + "="*80)
        print("🎯 OPCIONES:")
        print("="*80)
        print("1. Ejecutar UPDATEs ahora (directo a BD)")
        print("2. Solo guardar SQL (ejecutar manualmente después)")
        print("3. Cancelar")
        
        opcion = input("\nElige opción (1/2/3): ").strip()
        
        if opcion == '1':
            confirmar = input(f"\n⚠️  Esto actualizará {len(updates)} lecciones. ¿Continuar? (s/n): ").strip().lower()
            if confirmar == 's':
                ejecutar_updates(conn, updates)
                print("\n✅ ¡Sincronización completada!")
            else:
                print("\n❌ Cancelado")
        elif opcion == '2':
            print(f"\n✅ SQL guardado en: {sql_file}")
            print("   Puedes ejecutarlo manualmente con phpMyAdmin o MySQL Workbench")
        else:
            print("\n❌ Cancelado")
    
    finally:
        conn.close()
        print("\n👋 Conexión cerrada")

if __name__ == '__main__':
    main()