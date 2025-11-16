#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Diagnóstico KB - Verifica por qué no se usa el knowledge base
"""

import os
import sys
import json
import pymysql
import getpass

# DB Config
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME", "SpeakLexi2")

# KB Paths
try:
    SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
except NameError:
    SCRIPT_DIR = os.getcwd()

KB_DIR = os.path.join(SCRIPT_DIR, 'kb')
KB = {}

def cargar_kb():
    """Carga todos los archivos KB"""
    global KB
    archivos_kb = {
        'Inglés': os.path.join(KB_DIR, 'kb_ingles.json'),
        'Francés': os.path.join(KB_DIR, 'kb_frances.json'),
        'Alemán': os.path.join(KB_DIR, 'kb_aleman.json'),
        'Italiano': os.path.join(KB_DIR, 'kb_italiano.json')
    }
    
    for idioma, path in archivos_kb.items():
        if os.path.exists(path):
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    KB[idioma] = data.get(idioma, data)
                print(f"✅ Cargado: {idioma}")
            except Exception as e:
                print(f"❌ Error en {idioma}: {e}")

def analizar_kb():
    """Analiza estructura del KB"""
    print("\n" + "="*70)
    print("📊 ANÁLISIS DEL KNOWLEDGE BASE")
    print("="*70)
    
    for idioma, niveles in KB.items():
        print(f"\n🌍 {idioma}:")
        if not isinstance(niveles, dict):
            print(f"   ❌ ERROR: No es un diccionario de niveles")
            print(f"   Tipo: {type(niveles)}")
            continue
        
        total_lecciones = 0
        lecciones_con_ejemplos = 0
        
        for nivel, lecciones in niveles.items():
            if not isinstance(lecciones, dict):
                continue
            
            print(f"\n  📚 Nivel {nivel}: {len(lecciones)} lecciones")
            
            for titulo, data in lecciones.items():
                total_lecciones += 1
                tiene_vocab = bool(data.get('vocabulario'))
                tiene_ejemplos = bool(data.get('ejemplos'))
                
                if tiene_ejemplos:
                    lecciones_con_ejemplos += 1
                    ejemplos = data['ejemplos']
                    mc = len(ejemplos.get('seleccion_multiple', []))
                    tf = len(ejemplos.get('verdadero_falso', []))
                    fill = len(ejemplos.get('completar_espacios', []))
                    match = len(ejemplos.get('emparejamiento', []))
                    
                    print(f"     ✅ {titulo[:50]}")
                    print(f"        Vocab: {len(data.get('vocabulario', []))} | Ejemplos: MC={mc}, TF={tf}, Fill={fill}, Match={match}")
                else:
                    print(f"     ⚠️  {titulo[:50]}")
                    print(f"        Vocab: {len(data.get('vocabulario', []))} | SIN EJEMPLOS")
        
        print(f"\n  📈 Resumen {idioma}:")
        print(f"     Total lecciones: {total_lecciones}")
        print(f"     Con ejemplos: {lecciones_con_ejemplos} ({lecciones_con_ejemplos*100//total_lecciones if total_lecciones else 0}%)")
        print(f"     Sin ejemplos: {total_lecciones - lecciones_con_ejemplos}")

def comparar_con_bd():
    """Compara títulos en KB vs BD"""
    print("\n" + "="*70)
    print("🔍 COMPARACIÓN KB vs BASE DE DATOS")
    print("="*70)
    
    try:
        pwd = getpass.getpass("Password BD: ") if not os.getenv("DB_PASS") else os.getenv("DB_PASS")
        conn = pymysql.connect(
            host=DB_HOST, user=DB_USER, password=pwd,
            database=DB_NAME, charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        cursor = conn.cursor()
        
        # Obtener lecciones de BD
        cursor.execute("""
            SELECT id, titulo, nivel, idioma 
            FROM lecciones 
            WHERE estado = 'activa' 
            ORDER BY idioma, nivel, orden
        """)
        lecciones_bd = cursor.fetchall()
        
        print(f"\n📚 Total lecciones en BD: {len(lecciones_bd)}")
        
        # Verificar coincidencias
        matches = 0
        no_matches = []
        
        for leccion in lecciones_bd:
            titulo = leccion['titulo']
            nivel = leccion['nivel']
            idioma = leccion['idioma']
            
            # Buscar en KB
            kb_leccion = KB.get(idioma, {}).get(nivel, {}).get(titulo, {})
            
            if kb_leccion and kb_leccion.get('ejemplos'):
                matches += 1
            else:
                no_matches.append({
                    'id': leccion['id'],
                    'titulo': titulo,
                    'nivel': nivel,
                    'idioma': idioma,
                    'en_kb': bool(kb_leccion),
                    'tiene_ejemplos': bool(kb_leccion.get('ejemplos')) if kb_leccion else False
                })
        
        print(f"\n✅ Lecciones con match en KB: {matches} ({matches*100//len(lecciones_bd)}%)")
        print(f"❌ Lecciones SIN match en KB: {len(no_matches)} ({len(no_matches)*100//len(lecciones_bd)}%)")
        
        if no_matches:
            print(f"\n⚠️  LECCIONES SIN DATOS EN KB (primeras 20):")
            for i, lec in enumerate(no_matches[:20], 1):
                status = "En KB pero SIN ejemplos" if lec['en_kb'] else "NO en KB"
                print(f"   {i}. [{lec['id']}] {lec['nivel']}-{lec['idioma']}: {lec['titulo'][:50]} → {status}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error conectando a BD: {e}")

def main():
    print("\n🔍 DIAGNÓSTICO DE KNOWLEDGE BASE")
    print("="*70)
    
    if not os.path.exists(KB_DIR):
        print(f"❌ No existe carpeta KB: {KB_DIR}")
        return
    
    print(f"📁 Buscando archivos en: {KB_DIR}\n")
    
    # Cargar KB
    cargar_kb()
    
    if not KB:
        print("\n❌ No se cargó ningún KB")
        return
    
    # Analizar estructura
    analizar_kb()
    
    # Comparar con BD
    print("\n" + "="*70)
    respuesta = input("¿Comparar con base de datos? (s/n): ")
    if respuesta.lower() == 's':
        comparar_con_bd()
    
    print("\n" + "="*70)
    print("✅ DIAGNÓSTICO COMPLETADO")
    print("="*70)

if __name__ == "__main__":
    main()