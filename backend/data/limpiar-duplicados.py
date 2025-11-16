#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🧹 LIMPIADOR DE EJERCICIOS DUPLICADOS
Detecta y elimina ejercicios duplicados en SpeakLexi 2.0
"""

import pymysql
from collections import defaultdict
import json
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

def conectar_bd():
    """Conectar a la base de datos"""
    try:
        conexion = pymysql.connect(**DB_CONFIG)
        print("✅ Conexión exitosa a la base de datos")
        return conexion
    except Exception as e:
        print(f"❌ Error al conectar: {e}")
        exit(1)

def obtener_ejercicios(cursor):
    """Obtener todos los ejercicios"""
    query = """
        SELECT 
            e.id,
            e.leccion_id,
            e.titulo,
            e.tipo,
            e.contenido,
            e.respuesta_correcta,
            e.orden,
            l.titulo as leccion_titulo
        FROM ejercicios e
        JOIN lecciones l ON e.leccion_id = l.id
        ORDER BY e.leccion_id, e.orden
    """
    cursor.execute(query)
    ejercicios = cursor.fetchall()
    
    # Parsear JSON
    for ej in ejercicios:
        ej['contenido'] = json.loads(ej['contenido'])
        ej['respuesta_correcta'] = json.loads(ej['respuesta_correcta'])
    
    return ejercicios

def generar_firma_ejercicio(ejercicio):
    """Generar firma única para detectar duplicados"""
    tipo = ejercicio['tipo']
    contenido = ejercicio['contenido']
    
    if tipo == 'seleccion_multiple':
        # Firma basada en la pregunta
        if 'preguntas' in contenido and len(contenido['preguntas']) > 0:
            pregunta = contenido['preguntas'][0]['pregunta']
            return f"{tipo}:{pregunta}"
    
    elif tipo == 'verdadero_falso':
        # Firma basada en las afirmaciones
        if 'afirmaciones' in contenido:
            afirmaciones = '|'.join(sorted(contenido['afirmaciones']))
            return f"{tipo}:{afirmaciones}"
    
    elif tipo == 'completar_espacios':
        # Firma basada en el texto
        if 'texto' in contenido:
            texto = contenido['texto']
            return f"{tipo}:{texto}"
    
    elif tipo == 'emparejamiento':
        # Firma basada en los pares
        if 'pares' in contenido:
            pares = '|'.join(sorted([f"{p['izquierda']}-{p['derecha']}" for p in contenido['pares']]))
            return f"{tipo}:{pares}"
    
    elif tipo == 'escritura':
        # Firma basada en las instrucciones
        if 'instrucciones' in contenido:
            instrucciones = contenido['instrucciones']
            return f"{tipo}:{instrucciones}"
    
    return f"{tipo}:unknown"

def detectar_duplicados(ejercicios):
    """Detectar ejercicios duplicados por lección"""
    duplicados_por_leccion = defaultdict(lambda: defaultdict(list))
    
    for ej in ejercicios:
        leccion_id = ej['leccion_id']
        firma = generar_firma_ejercicio(ej)
        duplicados_por_leccion[leccion_id][firma].append(ej)
    
    return duplicados_por_leccion

def mostrar_reporte(duplicados_por_leccion):
    """Mostrar reporte de duplicados"""
    total_duplicados = 0
    lecciones_afectadas = 0
    
    print("\n" + "="*80)
    print("📊 REPORTE DE EJERCICIOS DUPLICADOS")
    print("="*80 + "\n")
    
    for leccion_id, firmas in duplicados_por_leccion.items():
        tiene_duplicados = False
        duplicados_leccion = []
        
        for firma, ejercicios in firmas.items():
            if len(ejercicios) > 1:
                tiene_duplicados = True
                duplicados_leccion.append({
                    'firma': firma,
                    'cantidad': len(ejercicios),
                    'ids': [e['id'] for e in ejercicios],
                    'tipo': ejercicios[0]['tipo']
                })
                total_duplicados += len(ejercicios) - 1  # -1 porque uno se queda
        
        if tiene_duplicados:
            lecciones_afectadas += 1
            leccion_titulo = ejercicios[0]['leccion_titulo']
            
            print(f"📚 Lección {leccion_id}: {leccion_titulo}")
            print(f"   {'─' * 70}")
            
            for dup in duplicados_leccion:
                print(f"   🔄 Tipo: {dup['tipo']}")
                print(f"      Repetido {dup['cantidad']} veces")
                print(f"      IDs: {dup['ids']}")
                print(f"      Firma: {dup['firma'][:60]}...")
                print()
    
    print("="*80)
    print(f"📊 RESUMEN:")
    print(f"   • Lecciones afectadas: {lecciones_afectadas}")
    print(f"   • Ejercicios duplicados a eliminar: {total_duplicados}")
    print("="*80 + "\n")
    
    return total_duplicados

def eliminar_duplicados(cursor, duplicados_por_leccion):
    """Eliminar ejercicios duplicados, manteniendo el primero"""
    ids_a_eliminar = []
    
    for leccion_id, firmas in duplicados_por_leccion.items():
        for firma, ejercicios in firmas.items():
            if len(ejercicios) > 1:
                # Ordenar por ID y mantener el primero
                ejercicios_ordenados = sorted(ejercicios, key=lambda x: x['id'])
                # Eliminar todos menos el primero
                for ej in ejercicios_ordenados[1:]:
                    ids_a_eliminar.append(ej['id'])
    
    if ids_a_eliminar:
        print(f"\n🗑️  Eliminando {len(ids_a_eliminar)} ejercicios duplicados...")
        
        # Eliminar en lotes
        placeholders = ','.join(['%s'] * len(ids_a_eliminar))
        query = f"DELETE FROM ejercicios WHERE id IN ({placeholders})"
        cursor.execute(query, ids_a_eliminar)
        
        print(f"✅ {len(ids_a_eliminar)} ejercicios eliminados correctamente")
        return len(ids_a_eliminar)
    
    return 0

def reordenar_ejercicios(cursor):
    """Reordenar ejercicios después de eliminar duplicados"""
    print("\n🔄 Reordenando ejercicios...")
    
    # Obtener todas las lecciones
    cursor.execute("SELECT DISTINCT leccion_id FROM ejercicios ORDER BY leccion_id")
    lecciones = cursor.fetchall()
    
    for leccion in lecciones:
        leccion_id = leccion['leccion_id']
        
        # Obtener ejercicios de esta lección ordenados
        cursor.execute("""
            SELECT id FROM ejercicios 
            WHERE leccion_id = %s 
            ORDER BY orden, id
        """, (leccion_id,))
        
        ejercicios = cursor.fetchall()
        
        # Actualizar orden
        for nuevo_orden, ej in enumerate(ejercicios, start=1):
            cursor.execute("""
                UPDATE ejercicios 
                SET orden = %s 
                WHERE id = %s
            """, (nuevo_orden, ej['id']))
    
    print("✅ Ejercicios reordenados correctamente")

def generar_backup(cursor):
    """Generar backup de ejercicios antes de eliminar"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'backup_ejercicios_{timestamp}.sql'
    
    print(f"\n💾 Generando backup en {filename}...")
    
    cursor.execute("SELECT * FROM ejercicios")
    ejercicios = cursor.fetchall()
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write("-- Backup de ejercicios\n")
        f.write(f"-- Fecha: {datetime.now()}\n")
        f.write(f"-- Total ejercicios: {len(ejercicios)}\n\n")
        
        for ej in ejercicios:
            # Escapar comillas
            titulo = ej['titulo'].replace("'", "\\'")
            descripcion = (ej['descripcion'] or '').replace("'", "\\'")
            contenido = ej['contenido'].replace("'", "\\'")
            respuesta = ej['respuesta_correcta'].replace("'", "\\'")
            
            sql = f"""INSERT INTO ejercicios (id, leccion_id, titulo, descripcion, tipo, contenido, respuesta_correcta, puntos_maximos, orden, estado, creado_por, creado_en) 
VALUES ({ej['id']}, {ej['leccion_id']}, '{titulo}', '{descripcion}', '{ej['tipo']}', '{contenido}', '{respuesta}', {ej['puntos_maximos']}, {ej['orden']}, '{ej['estado']}', {ej['creado_por']}, '{ej['creado_en']}');\n"""
            f.write(sql)
    
    print(f"✅ Backup guardado: {filename}")
    return filename

def main():
    print("="*80)
    print("🧹 LIMPIADOR DE EJERCICIOS DUPLICADOS - SpeakLexi 2.0")
    print("="*80)
    print()
    
    # Conectar
    conn = conectar_bd()
    cursor = conn.cursor()
    
    try:
        # Obtener ejercicios
        print("📥 Cargando ejercicios...")
        ejercicios = obtener_ejercicios(cursor)
        print(f"✅ {len(ejercicios)} ejercicios cargados\n")
        
        # Detectar duplicados
        print("🔍 Detectando duplicados...")
        duplicados_por_leccion = detectar_duplicados(ejercicios)
        
        # Mostrar reporte
        total_duplicados = mostrar_reporte(duplicados_por_leccion)
        
        if total_duplicados == 0:
            print("🎉 ¡No se encontraron duplicados!")
            return
        
        # Confirmar acción
        print("⚠️  ADVERTENCIA: Esta acción eliminará ejercicios de la base de datos.")
        respuesta = input("\n¿Deseas continuar? (s/n): ").strip().lower()
        
        if respuesta != 's':
            print("❌ Operación cancelada")
            return
        
        # Generar backup
        backup_file = generar_backup(cursor)
        
        # Eliminar duplicados
        eliminados = eliminar_duplicados(cursor, duplicados_por_leccion)
        
        # Reordenar
        reordenar_ejercicios(cursor)
        
        # Commit
        conn.commit()
        
        print("\n" + "="*80)
        print("🎉 ¡LIMPIEZA COMPLETADA!")
        print("="*80)
        print(f"✅ Ejercicios eliminados: {eliminados}")
        print(f"💾 Backup guardado en: {backup_file}")
        print(f"📊 Ejercicios restantes: {len(ejercicios) - eliminados}")
        print()
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        conn.rollback()
    
    finally:
        cursor.close()
        conn.close()
        print("👋 Conexión cerrada")

if __name__ == '__main__':
    main()