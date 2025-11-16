#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🔢 REORDENADOR DE LECCIONES
Asigna orden correcto a todas las lecciones
"""

import pymysql

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'loquesea2013',
    'database': 'SpeakLexi2',
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

def conectar_bd():
    try:
        conexion = pymysql.connect(**DB_CONFIG)
        print("✅ Conexión exitosa\n")
        return conexion
    except Exception as e:
        print(f"❌ Error: {e}")
        exit(1)

def reordenar_lecciones(cursor):
    """Reordenar lecciones por idioma y nivel"""
    
    print("🔄 Reordenando lecciones...\n")
    
    # Obtener combinaciones únicas de idioma-nivel
    cursor.execute("""
        SELECT DISTINCT idioma, nivel 
        FROM lecciones 
        WHERE estado = 'activa'
        ORDER BY idioma, nivel
    """)
    
    combinaciones = cursor.fetchall()
    total_actualizadas = 0
    
    for combo in combinaciones:
        idioma = combo['idioma']
        nivel = combo['nivel']
        
        # Obtener lecciones de esta combinación ordenadas por título
        cursor.execute("""
            SELECT id, titulo
            FROM lecciones
            WHERE idioma = %s AND nivel = %s AND estado = 'activa'
            ORDER BY titulo
        """, (idioma, nivel))
        
        lecciones = cursor.fetchall()
        
        # Asignar orden secuencial
        for orden, leccion in enumerate(lecciones, start=1):
            cursor.execute("""
                UPDATE lecciones 
                SET orden = %s
                WHERE id = %s
            """, (orden, leccion['id']))
            total_actualizadas += 1
        
        print(f"✅ {idioma} {nivel}: {len(lecciones)} lecciones reordenadas")
    
    return total_actualizadas

def main():
    print("="*70)
    print("🔢 REORDENADOR DE LECCIONES - SpeakLexi 2.0")
    print("="*70)
    print()
    
    conn = conectar_bd()
    cursor = conn.cursor()
    
    try:
        total = reordenar_lecciones(cursor)
        
        print(f"\n{'='*70}")
        print(f"✅ {total} lecciones reordenadas correctamente")
        print(f"{'='*70}\n")
        
        # Confirmar
        respuesta = input("¿Guardar cambios? (s/n): ").strip().lower()
        
        if respuesta == 's':
            conn.commit()
            print("✅ Cambios guardados")
        else:
            conn.rollback()
            print("❌ Cambios descartados")
    
    except Exception as e:
        print(f"\n❌ Error: {e}")
        conn.rollback()
    
    finally:
        cursor.close()
        conn.close()
        print("\n👋 Conexión cerrada")

if __name__ == '__main__':
    main()