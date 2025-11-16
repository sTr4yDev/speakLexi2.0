#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🔍 VALIDADOR DE LECCIONES vs GENERADOR vs KB
Compara lecciones en BD con templates del generador y archivos KB
"""

import pymysql
import json
from pathlib import Path
from collections import defaultdict

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

# Traducciones del generador (simplificadas)
TRADUCCIONES = {
    'Inglés': {
        'Pasado Simple': 'Simple Past',
    },
    'Francés': {
        'Pasado Simple': 'Passé Simple',
    },
    'Alemán': {
        'Pasado Simple': 'Einfache Vergangenheit',
    },
    'Italiano': {
        'Pasado Simple': 'Passato Semplice',
    }
}

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
                print(f"  ✅ {idioma}: {len(kb_data[idioma])} niveles")
        else:
            print(f"  ⚠️  {idioma}: No encontrado")
    
    return kb_data

def obtener_lecciones_bd(cursor):
    """Obtener todas las lecciones de la BD"""
    query = """
        SELECT id, titulo, idioma, nivel
        FROM lecciones
        ORDER BY idioma, nivel, titulo
    """
    cursor.execute(query)
    return cursor.fetchall()

def normalizar_titulo(titulo):
    """Normalizar título para comparación"""
    # Quitar sufijos comunes
    titulo = titulo.strip()
    # Eliminar " - Verbos Regulares", " - Verbos Irregulares", etc.
    if ' - ' in titulo:
        titulo = titulo.split(' - ')[0].strip()
    return titulo

def validar_lecciones(lecciones_bd, kb_data):
    """Validar lecciones contra KB"""
    print("\n" + "="*80)
    print("🔍 VALIDACIÓN DE LECCIONES")
    print("="*80 + "\n")
    
    resultados = {
        'con_kb': [],
        'sin_kb': [],
        'necesitan_renombrar': []
    }
    
    for leccion in lecciones_bd:
        idioma = leccion['idioma']
        nivel = leccion['nivel']
        titulo = leccion['titulo']
        titulo_normalizado = normalizar_titulo(titulo)
        
        # Verificar si el idioma existe en KB
        if idioma not in kb_data:
            resultados['sin_kb'].append({
                **leccion,
                'razon': f'Idioma {idioma} no existe en KB'
            })
            continue
        
        # Verificar si el nivel existe
        if nivel not in kb_data[idioma]:
            resultados['sin_kb'].append({
                **leccion,
                'razon': f'Nivel {nivel} no existe en KB de {idioma}'
            })
            continue
        
        # Buscar en KB
        kb_nivel = kb_data[idioma][nivel]
        
        # Buscar match exacto
        if titulo in kb_nivel:
            resultados['con_kb'].append(leccion)
        elif titulo_normalizado in kb_nivel:
            # El título necesita ser renombrado
            resultados['necesitan_renombrar'].append({
                **leccion,
                'titulo_actual': titulo,
                'titulo_correcto': titulo_normalizado,
                'tiene_ejercicios_en_kb': True
            })
        else:
            # Buscar match parcial (fuzzy)
            match_encontrado = False
            for kb_titulo in kb_nivel.keys():
                if titulo_normalizado.lower() in kb_titulo.lower() or kb_titulo.lower() in titulo_normalizado.lower():
                    resultados['necesitan_renombrar'].append({
                        **leccion,
                        'titulo_actual': titulo,
                        'titulo_correcto': kb_titulo,
                        'tiene_ejercicios_en_kb': True,
                        'match_parcial': True
                    })
                    match_encontrado = True
                    break
            
            if not match_encontrado:
                resultados['sin_kb'].append({
                    **leccion,
                    'razon': f'Título "{titulo}" no existe en KB'
                })
    
    return resultados

def mostrar_reporte(resultados, lecciones_bd):
    """Mostrar reporte detallado"""
    total = len(lecciones_bd)
    con_kb = len(resultados['con_kb'])
    sin_kb = len(resultados['sin_kb'])
    renombrar = len(resultados['necesitan_renombrar'])
    
    print("\n" + "="*80)
    print("📊 RESUMEN GENERAL")
    print("="*80)
    print(f"Total de lecciones: {total}")
    print(f"✅ Con KB (OK): {con_kb} ({con_kb/total*100:.1f}%)")
    print(f"⚠️  Necesitan renombrarse: {renombrar} ({renombrar/total*100:.1f}%)")
    print(f"❌ Sin KB: {sin_kb} ({sin_kb/total*100:.1f}%)")
    print("="*80 + "\n")
    
    # Lecciones que necesitan renombrarse
    if resultados['necesitan_renombrar']:
        print("⚠️  LECCIONES QUE NECESITAN RENOMBRARSE:")
        print("─" * 80)
        for i, leccion in enumerate(resultados['necesitan_renombrar'], 1):
            print(f"\n{i}. ID: {leccion['id']} [{leccion['idioma']} - {leccion['nivel']}]")
            print(f"   ❌ Actual: {leccion['titulo_actual']}")
            print(f"   ✅ Debería ser: {leccion['titulo_correcto']}")
            if leccion.get('match_parcial'):
                print(f"   ℹ️  (Match parcial)")
        print()
    
    # Lecciones sin KB
    if resultados['sin_kb']:
        print("\n❌ LECCIONES SIN DATOS EN KB:")
        print("─" * 80)
        
        # Agrupar por razón
        por_razon = defaultdict(list)
        for leccion in resultados['sin_kb']:
            por_razon[leccion['razon']].append(leccion)
        
        for razon, lecciones in por_razon.items():
            print(f"\n📌 {razon}")
            print(f"   Cantidad: {len(lecciones)}")
            print(f"   IDs: {[l['id'] for l in lecciones[:10]]}" + 
                  (" ..." if len(lecciones) > 10 else ""))
        print()

def generar_script_renombrar(resultados):
    """Generar script SQL para renombrar"""
    if not resultados['necesitan_renombrar']:
        return None
    
    filename = 'renombrar_lecciones.sql'
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write("-- Script de renombramiento de lecciones\n")
        f.write("-- Generado automáticamente\n\n")
        f.write("USE SpeakLexi2;\n\n")
        f.write("START TRANSACTION;\n\n")
        
        for leccion in resultados['necesitan_renombrar']:
            titulo_escapado = leccion['titulo_correcto'].replace("'", "\\'")
            f.write(f"-- ID: {leccion['id']} - {leccion['idioma']} {leccion['nivel']}\n")
            f.write(f"UPDATE lecciones SET titulo = '{titulo_escapado}' WHERE id = {leccion['id']};\n\n")
        
        f.write("COMMIT;\n")
        f.write("\n-- Verificar cambios\n")
        f.write("SELECT id, titulo, idioma, nivel FROM lecciones WHERE id IN (")
        f.write(", ".join(str(l['id']) for l in resultados['necesitan_renombrar']))
        f.write(");\n")
    
    print(f"✅ Script SQL generado: {filename}\n")
    return filename

def contar_ejercicios_sin_kb(cursor, lecciones_sin_kb):
    """Contar ejercicios que pertenecen a lecciones sin KB"""
    if not lecciones_sin_kb:
        return 0
    
    ids = [l['id'] for l in lecciones_sin_kb]
    placeholders = ','.join(['%s'] * len(ids))
    
    query = f"""
        SELECT COUNT(*) as total
        FROM ejercicios
        WHERE leccion_id IN ({placeholders})
    """
    cursor.execute(query, ids)
    resultado = cursor.fetchone()
    return resultado['total']

def main():
    print("="*80)
    print("🔍 VALIDADOR DE LECCIONES - SpeakLexi 2.0")
    print("="*80 + "\n")
    
    # Conectar BD
    conn = conectar_bd()
    cursor = conn.cursor()
    
    try:
        # Cargar KB
        kb_data = cargar_kb()
        
        # Obtener lecciones de BD
        print("\n📥 Obteniendo lecciones de BD...")
        lecciones_bd = obtener_lecciones_bd(cursor)
        print(f"  ✅ {len(lecciones_bd)} lecciones encontradas\n")
        
        # Validar
        resultados = validar_lecciones(lecciones_bd, kb_data)
        
        # Mostrar reporte
        mostrar_reporte(resultados, lecciones_bd)
        
        # Contar ejercicios afectados
        if resultados['sin_kb']:
            ejercicios_afectados = contar_ejercicios_sin_kb(cursor, resultados['sin_kb'])
            print(f"⚠️  EJERCICIOS AFECTADOS: {ejercicios_afectados}")
            print(f"   (Estos ejercicios pertenecen a lecciones sin datos en KB)\n")
        
        # Generar scripts
        if resultados['necesitan_renombrar']:
            script_file = generar_script_renombrar(resultados)
            print("="*80)
            print("🎯 ACCIONES RECOMENDADAS:")
            print("="*80)
            print(f"1. Ejecuta el script SQL: {script_file}")
            print("2. Recarga los ejercicios de las lecciones renombradas")
            print("3. Elimina o actualiza lecciones sin KB\n")
        
        if resultados['sin_kb']:
            print("⚠️  LECCIONES SIN KB:")
            print("   Opción A: Borrar estas lecciones y sus ejercicios")
            print("   Opción B: Crear datos en KB para estas lecciones")
            print("   Opción C: Dejarlas (pero no tendrán ejercicios de calidad)\n")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
    
    finally:
        cursor.close()
        conn.close()
        print("👋 Conexión cerrada")

if __name__ == '__main__':
    main()