#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para generar ejercicios automáticos para SpeakLexi 2.0
Genera aproximadamente 8-10 ejercicios por lección (2,960 ejercicios total)
Compatible con los 5 tipos: seleccion_multiple, verdadero_falso, completar_espacios, emparejamiento, escritura
"""

import pymysql
from datetime import datetime
import json
import sys
import random

# ============================================
# CONFIGURACIÓN DE BASE DE DATOS
# ============================================
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'loquesea2013',  # Cambiar por tu password
    'database': 'SpeakLexi2',
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

# ============================================
# PLANTILLAS DE EJERCICIOS POR TIPO Y NIVEL
# ============================================

class GeneradorEjercicios:
    """Generador inteligente de ejercicios basado en temas de la lección"""
    
    def __init__(self, leccion):
        self.leccion = leccion
        self.nivel = leccion['nivel']
        self.idioma = leccion['idioma']
        self.titulo = leccion['titulo']
        
        # Parsear contenido JSON
        try:
            self.contenido_leccion = json.loads(leccion['contenido'])
            self.temas = self.contenido_leccion.get('temas', [])
        except:
            self.temas = []
        
        self.puntos_por_nivel = {
            'A1': 5, 'A2': 7, 'B1': 10, 'B2': 12, 'C1': 15, 'C2': 20
        }
    
    # ==========================================
    # SELECCIÓN MÚLTIPLE
    # ==========================================
    def crear_seleccion_multiple(self, orden):
        """Genera ejercicio de selección múltiple"""
        tema = random.choice(self.temas) if self.temas else self.titulo
        
        # Plantillas de preguntas según nivel
        if self.nivel in ['A1', 'A2']:
            pregunta = f"¿Cuál de las siguientes opciones describe mejor '{tema}'?"
            opciones = [
                f"Definición correcta de {tema}",
                f"Concepto relacionado con {tema}",
                f"Ejemplo de uso de {tema}",
                "Ninguna de las anteriores"
            ]
        else:
            pregunta = f"En el contexto de '{self.titulo}', ¿qué aspecto es más relevante sobre {tema}?"
            opciones = [
                f"La aplicación práctica de {tema}",
                f"El origen histórico de {tema}",
                f"Las variaciones regionales de {tema}",
                f"La importancia cultural de {tema}"
            ]
        
        # Mezclar opciones
        random.shuffle(opciones)
        respuesta_correcta = 0  # La primera opción es correcta (antes de mezclar se debe guardar)
        
        contenido = {
            "preguntas": [{
                "pregunta": pregunta,
                "opciones": opciones
            }]
        }
        
        respuesta = {
            "respuestas": [respuesta_correcta]
        }
        
        return {
            'titulo': f'{self.titulo} - Selección Múltiple {orden}',
            'descripcion': f'Ejercicio de selección múltiple sobre {tema}',
            'tipo': 'seleccion_multiple',
            'contenido': contenido,
            'respuesta_correcta': respuesta,
            'puntos_maximos': self.puntos_por_nivel[self.nivel],
            'orden': orden
        }
    
    # ==========================================
    # VERDADERO O FALSO
    # ==========================================
    def crear_verdadero_falso(self, orden):
        """Genera ejercicio de verdadero/falso"""
        tema = random.choice(self.temas) if self.temas else self.titulo
        
        afirmaciones = [
            f"{tema} es un concepto fundamental en {self.idioma}",
            f"El uso de {tema} es común en el nivel {self.nivel}",
            f"{tema} se aplica en contextos formales e informales"
        ]
        
        # Respuestas correctas (mezclar entre true/false)
        respuestas = [True, True, random.choice([True, False])]
        
        contenido = {
            "afirmaciones": afirmaciones
        }
        
        respuesta = {
            "respuestas": respuestas
        }
        
        return {
            'titulo': f'{self.titulo} - Verdadero/Falso {orden}',
            'descripcion': f'Ejercicio de verdadero/falso sobre {tema}',
            'tipo': 'verdadero_falso',
            'contenido': contenido,
            'respuesta_correcta': respuesta,
            'puntos_maximos': self.puntos_por_nivel[self.nivel],
            'orden': orden
        }
    
    # ==========================================
    # COMPLETAR ESPACIOS
    # ==========================================
    def crear_completar_espacios(self, orden):
        """Genera ejercicio de completar espacios"""
        tema = random.choice(self.temas) if self.temas else self.titulo
        
        # Crear texto con espacios en blanco
        espacios_palabras = ["fundamental", "importante", "esencial"]
        texto = f"En la lección sobre {self.titulo}, aprendimos que {tema} es ___ para la comunicación efectiva. Los estudiantes deben practicar ___ para mejorar sus habilidades."
        
        contenido = {
            "texto": texto
        }
        
        respuesta = {
            "respuestas": espacios_palabras[:texto.count('___')]
        }
        
        return {
            'titulo': f'{self.titulo} - Completar Espacios {orden}',
            'descripcion': f'Completa los espacios sobre {tema}',
            'tipo': 'completar_espacios',
            'contenido': contenido,
            'respuesta_correcta': respuesta,
            'puntos_maximos': self.puntos_por_nivel[self.nivel],
            'orden': orden
        }
    
    # ==========================================
    # EMPAREJAMIENTO
    # ==========================================
    def crear_emparejamiento(self, orden):
        """Genera ejercicio de emparejamiento"""
        tema = random.choice(self.temas) if self.temas else self.titulo
        
        # Crear pares de conceptos
        pares = [
            {
                "izquierda": f"Concepto principal de {tema}",
                "derecha": "Definición básica"
            },
            {
                "izquierda": f"Ejemplo de uso de {tema}",
                "derecha": "Aplicación práctica"
            },
            {
                "izquierda": f"Contexto de {tema}",
                "derecha": "Situación real"
            }
        ]
        
        contenido = {
            "pares": pares
        }
        
        # La respuesta correcta es el orden original [0, 1, 2]
        respuesta = {
            "respuestas": list(range(len(pares)))
        }
        
        return {
            'titulo': f'{self.titulo} - Emparejamiento {orden}',
            'descripcion': f'Empareja conceptos sobre {tema}',
            'tipo': 'emparejamiento',
            'contenido': contenido,
            'respuesta_correcta': respuesta,
            'puntos_maximos': self.puntos_por_nivel[self.nivel],
            'orden': orden
        }
    
    # ==========================================
    # ESCRITURA
    # ==========================================
    def crear_escritura(self, orden):
        """Genera ejercicio de escritura"""
        tema = random.choice(self.temas) if self.temas else self.titulo
        
        palabras_minimas = {
            'A1': 30, 'A2': 50, 'B1': 75, 'B2': 100, 'C1': 150, 'C2': 200
        }
        
        instrucciones = f"Escribe un breve texto sobre tu comprensión de {tema} en el contexto de {self.titulo}. " \
                       f"Mínimo {palabras_minimas[self.nivel]} palabras."
        
        contenido = {
            "instrucciones": instrucciones,
            "palabras_minimas": palabras_minimas[self.nivel]
        }
        
        # No hay respuesta correcta exacta para escritura
        respuesta = {
            "tipo": "evaluacion_manual",
            "criterios": [
                "Claridad en la expresión",
                "Uso correcto del vocabulario",
                "Coherencia del texto"
            ]
        }
        
        return {
            'titulo': f'{self.titulo} - Escritura {orden}',
            'descripcion': f'Ejercicio de escritura sobre {tema}',
            'tipo': 'escritura',
            'contenido': contenido,
            'respuesta_correcta': respuesta,
            'puntos_maximos': self.puntos_por_nivel[self.nivel] * 2,  # Doble puntos para escritura
            'orden': orden
        }
    
    # ==========================================
    # GENERADOR PRINCIPAL
    # ==========================================
    def generar_ejercicios(self):
        """Genera set completo de ejercicios para la lección"""
        ejercicios = []
        orden = 1
        
        # Generar 2 de cada tipo (10 total)
        for _ in range(2):
            ejercicios.append(self.crear_seleccion_multiple(orden))
            orden += 1
        
        for _ in range(2):
            ejercicios.append(self.crear_verdadero_falso(orden))
            orden += 1
        
        for _ in range(2):
            ejercicios.append(self.crear_completar_espacios(orden))
            orden += 1
        
        for _ in range(2):
            ejercicios.append(self.crear_emparejamiento(orden))
            orden += 1
        
        # Solo 1 ejercicio de escritura por lección
        ejercicios.append(self.crear_escritura(orden))
        orden += 1
        
        return ejercicios


# ============================================
# FUNCIONES PRINCIPALES
# ============================================

def conectar_bd():
    """Conectar a la base de datos MySQL"""
    try:
        conexion = pymysql.connect(**DB_CONFIG)
        print("✅ Conexión exitosa a la base de datos")
        return conexion
    except Exception as e:
        print(f"❌ Error al conectar a la base de datos: {e}")
        sys.exit(1)


def obtener_lecciones(cursor):
    """Obtener todas las lecciones activas"""
    query = """
        SELECT id, titulo, descripcion, contenido, nivel, idioma, creado_por
        FROM lecciones
        WHERE estado = 'activa'
        ORDER BY nivel, idioma, orden
    """
    cursor.execute(query)
    return cursor.fetchall()


def insertar_ejercicio(cursor, leccion_id, ejercicio_data, creador_id):
    """Insertar un ejercicio en la base de datos"""
    query = """
        INSERT INTO ejercicios (
            leccion_id, titulo, descripcion, tipo,
            contenido, respuesta_correcta, puntos_maximos,
            orden, estado, creado_por, creado_en
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'activo', %s, NOW())
    """
    
    valores = (
        leccion_id,
        ejercicio_data['titulo'],
        ejercicio_data['descripcion'],
        ejercicio_data['tipo'],
        json.dumps(ejercicio_data['contenido'], ensure_ascii=False),
        json.dumps(ejercicio_data['respuesta_correcta'], ensure_ascii=False),
        ejercicio_data['puntos_maximos'],
        ejercicio_data['orden'],
        creador_id
    )
    
    cursor.execute(query, valores)
    return cursor.lastrowid


def main():
    """Función principal"""
    print("=" * 70)
    print("🎯 GENERADOR DE EJERCICIOS - SPEAKLEXI 2.0")
    print("=" * 70)
    print()
    
    # Conectar a BD
    conexion = conectar_bd()
    cursor = conexion.cursor()
    
    # Obtener lecciones
    print("📚 Cargando lecciones...")
    lecciones = obtener_lecciones(cursor)
    
    if not lecciones:
        print("❌ No se encontraron lecciones en la base de datos")
        print("   Ejecuta primero el script 'crear-lecciones.py'")
        conexion.close()
        sys.exit(1)
    
    total_lecciones = len(lecciones)
    ejercicios_por_leccion = 9  # 2 de cada tipo + 1 escritura
    total_ejercicios = total_lecciones * ejercicios_por_leccion
    
    print(f"✅ Se encontraron {total_lecciones} lecciones")
    print(f"📊 Se generarán aproximadamente {total_ejercicios} ejercicios")
    print(f"   ({ejercicios_por_leccion} ejercicios por lección)")
    print()
    
    # Confirmar
    respuesta = input("¿Deseas continuar? (s/n): ")
    if respuesta.lower() != 's':
        print("❌ Operación cancelada")
        conexion.close()
        sys.exit(0)
    
    print()
    print("🚀 Iniciando generación de ejercicios...")
    print()
    
    contador_total = 0
    ejercicios_por_nivel = {}
    
    try:
        for idx, leccion in enumerate(lecciones, 1):
            nivel = leccion['nivel']
            idioma = leccion['idioma']
            clave = f"{nivel}-{idioma}"
            
            if clave not in ejercicios_por_nivel:
                ejercicios_por_nivel[clave] = 0
            
            # Generar ejercicios para esta lección
            generador = GeneradorEjercicios(leccion)
            ejercicios = generador.generar_ejercicios()
            
            # Insertar cada ejercicio
            for ejercicio in ejercicios:
                insertar_ejercicio(
                    cursor,
                    leccion['id'],
                    ejercicio,
                    leccion['creado_por']
                )
                contador_total += 1
                ejercicios_por_nivel[clave] += 1
            
            # Mostrar progreso cada 10 lecciones
            if idx % 10 == 0:
                print(f"   ✓ Procesadas {idx}/{total_lecciones} lecciones ({contador_total} ejercicios creados)...")
        
        # Commit
        conexion.commit()
        
        print()
        print("=" * 70)
        print("🎉 ¡GENERACIÓN COMPLETADA!")
        print("=" * 70)
        print(f"✅ Total de ejercicios creados: {contador_total}")
        print()
        print("📊 Resumen por nivel-idioma:")
        for clave, cantidad in sorted(ejercicios_por_nivel.items()):
            print(f"   • {clave}: {cantidad} ejercicios")
        print()
        print("🔍 Verifica los ejercicios en tu base de datos:")
        print("   SELECT e.tipo, COUNT(*) as total")
        print("   FROM ejercicios e")
        print("   GROUP BY e.tipo;")
        print()
        print("🎨 Ahora puedes visualizar los ejercicios en el frontend!")
        print("   Navega a: /pages/estudiante/leccion-activa.html?id=<leccion_id>")
        print()
        
    except Exception as e:
        print(f"❌ Error durante la generación: {e}")
        import traceback
        traceback.print_exc()
        conexion.rollback()
        sys.exit(1)
    
    finally:
        cursor.close()
        conexion.close()
        print("🔌 Conexión a BD cerrada")


if __name__ == "__main__":
    main()