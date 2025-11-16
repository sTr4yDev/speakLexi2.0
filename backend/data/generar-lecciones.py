#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SpeakLexi Exercise Generator V5 — SINCRONIZADO CON KB
Genera ejercicios usando knowledge_base.json después de sincronización
"""

from __future__ import annotations
import os
import sys
import json
import random
import argparse
import getpass
import pymysql
from typing import List, Dict, Any, Optional, Tuple

# DB Config
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME", "SpeakLexi2")
DB_CHARSET = "utf8mb4"

# Configuración del KB
try:
    SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
except NameError:
    SCRIPT_DIR = os.getcwd()

KB_DIR = os.path.join(SCRIPT_DIR, 'kb')
KB = {}

def cargar_knowledge_base():
    global KB
    
    print("🔍 Cargando Knowledge Base...")
    
    archivos_kb = {
        'Inglés': os.path.join(KB_DIR, 'kb_ingles.json'),
        'Francés': os.path.join(KB_DIR, 'kb_frances.json'),
        'Alemán': os.path.join(KB_DIR, 'kb_aleman.json'),
        'Italiano': os.path.join(KB_DIR, 'kb_italiano.json')
    }
    
    archivos_cargados = 0
    for idioma, path in archivos_kb.items():
        if os.path.exists(path):
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    KB[idioma] = data.get(idioma, data)
                    
                    # Contar lecciones
                    total_lecciones = sum(len(temas) for temas in KB[idioma].values())
                    print(f"  ✅ {idioma}: {total_lecciones} lecciones")
                    archivos_cargados += 1
            except Exception as e:
                print(f"  ⚠️  Error cargando {idioma}: {e}")
    
    if archivos_cargados == 0:
        print(f"\n❌ ERROR: No se encontraron archivos KB en {KB_DIR}")
        return False
    
    print(f"\n✅ KB cargado: {archivos_cargados} idiomas\n")
    return True

def get_db_password():
    global DB_PASS
    if DB_PASS is None:
        DB_PASS = getpass.getpass("DB password: ")
    return DB_PASS

def conectar_bd():
    try:
        pwd = get_db_password()
        conn = pymysql.connect(
            host=DB_HOST, user=DB_USER, password=pwd,
            database=DB_NAME, charset=DB_CHARSET,
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=False
        )
        print("✅ Conexión DB OK\n")
        return conn
    except Exception as e:
        print(f"❌ Error conectando a DB: {e}")
        sys.exit(1)

class GeneradorConKB:
    def __init__(self, leccion_row: Dict[str, Any], verbose=False):
        self.row = leccion_row
        self.id = leccion_row.get('id')
        self.titulo = leccion_row.get('titulo') or 'Untitled'
        self.nivel = (leccion_row.get('nivel') or 'A1').upper()
        self.idioma = leccion_row.get('idioma') or 'Inglés'
        self.verbose = verbose
        
        # Buscar en KB
        kb_idioma = KB.get(self.idioma, {})
        kb_nivel = kb_idioma.get(self.nivel, {})
        self.kb_leccion = kb_nivel.get(self.titulo, {})
        
        # Debug
        if not self.kb_leccion:
            if verbose:
                titulos_kb = list(kb_nivel.keys())[:3]
                print(f"⚠️  '{self.titulo}' no en KB ({self.idioma}/{self.nivel})")
                if titulos_kb:
                    print(f"   Disponibles: {titulos_kb}...")
        else:
            vocab_count = len(self.kb_leccion.get('vocabulario', []))
            if verbose:
                print(f"✅ KB: '{self.titulo}' ({vocab_count} palabras)")
        
        # Extraer datos del KB
        self.vocabulario = self.kb_leccion.get('vocabulario', [])
        self.verbos = self.kb_leccion.get('verbos', [])
        self.frases_clave = self.kb_leccion.get('frases_clave', [])
        self.ejemplos = self.kb_leccion.get('ejemplos', {})
        
        self.puntos = {'A1':5,'A2':7,'B1':10,'B2':12,'C1':15,'C2':20}
        if self.nivel not in self.puntos:
            self.nivel = 'A1'

    def _mk_title(self, suffix: str) -> str:
        return f"{self.titulo} — {self.nivel} — {suffix}"

    def _shuffle_with_correct(self, options: List[str], correct_idx: int) -> Tuple[List[str], int]:
        if not (0 <= correct_idx < len(options)):
            correct_idx = 0
        correct_val = options[correct_idx]
        shuffled = options[:]
        random.shuffle(shuffled)
        return shuffled, shuffled.index(correct_val)

    def gen_multiple_choice(self, orden: int) -> Dict[str,Any]:
        ejemplos_mc = self.ejemplos.get('seleccion_multiple', [])
        
        if ejemplos_mc and random.random() < 0.7:
            ejemplo = random.choice(ejemplos_mc)
            opciones = ejemplo['opciones']
            correcta = ejemplo['correcta']
            opts_shuffled, new_idx = self._shuffle_with_correct(opciones, correcta)
            
            contenido = {"preguntas": [{"pregunta": ejemplo['pregunta'], "opciones": opts_shuffled}]}
            respuesta = {"respuestas": [new_idx]}
        else:
            if self.vocabulario:
                palabra = random.choice(self.vocabulario)
                pregunta = f"What does '{palabra}' mean?"
                correcta = f"Definition of {palabra}"
                opciones = [correcta, f"Opposite of {palabra}", f"Synonym of {palabra}", "None"]
                opts_shuffled, new_idx = self._shuffle_with_correct(opciones, 0)
            else:
                pregunta = "Choose the correct option:"
                opts_shuffled = ["Option A", "Option B", "Option C", "Option D"]
                new_idx = 0
            
            contenido = {"preguntas": [{"pregunta": pregunta, "opciones": opts_shuffled}]}
            respuesta = {"respuestas": [new_idx]}
        
        return {
            "titulo": self._mk_title(f"MC {orden}"),
            "descripcion": "Multiple choice exercise",
            "tipo": "seleccion_multiple",
            "contenido": contenido,
            "respuesta_correcta": respuesta,
            "puntos_maximos": self.puntos[self.nivel],
            "orden": orden
        }

    def gen_true_false(self, orden: int) -> Dict[str,Any]:
        ejemplos_tf = self.ejemplos.get('verdadero_falso', [])
        
        if ejemplos_tf and len(ejemplos_tf) >= 3:
            sample = random.sample(ejemplos_tf, 3)
            afirmaciones = [e['afirmacion'] for e in sample]
            respuestas = [e['respuesta'] for e in sample]
        else:
            tema = random.choice(self.vocabulario) if self.vocabulario else "this topic"
            afirmaciones = [
                f"Practice improves mastery of {tema}",
                f"{tema} is important in {self.idioma}",
                f"{tema} is only for advanced learners"
            ]
            respuestas = [True, True, False]
        
        contenido = {"afirmaciones": afirmaciones}
        respuesta = {"respuestas": respuestas}
        
        return {
            "titulo": self._mk_title(f"TF {orden}"),
            "descripcion": "True/False exercise",
            "tipo": "verdadero_falso",
            "contenido": contenido,
            "respuesta_correcta": respuesta,
            "puntos_maximos": self.puntos[self.nivel],
            "orden": orden
        }

    def gen_fill_blanks(self, orden: int) -> Dict[str,Any]:
        ejemplos_fill = self.ejemplos.get('completar_espacios', [])
        
        if ejemplos_fill and random.random() < 0.7:
            ejemplo = random.choice(ejemplos_fill)
            texto = ejemplo['texto']
            respuestas = ejemplo['respuestas']
        else:
            if self.frases_clave:
                frase = random.choice(self.frases_clave)
                palabras = frase.split()
                if len(palabras) >= 3:
                    idx1 = random.randint(0, len(palabras)-1)
                    respuesta1 = palabras[idx1]
                    palabras[idx1] = '___'
                    texto = ' '.join(palabras)
                    respuestas = [respuesta1]
                else:
                    texto = f"Complete: {frase} ___"
                    respuestas = ["word"]
            elif self.vocabulario:
                palabra = random.choice(self.vocabulario)
                texto = f"Fill in the blank: In this lesson we study ___"
                respuestas = [palabra]
            else:
                texto = "Complete: ___ is important"
                respuestas = ["Practice"]
        
        contenido = {"texto": texto}
        respuesta = {"respuestas": respuestas}
        
        return {
            "titulo": self._mk_title(f"Fill {orden}"),
            "descripcion": "Fill in the blanks",
            "tipo": "completar_espacios",
            "contenido": contenido,
            "respuesta_correcta": respuesta,
            "puntos_maximos": self.puntos[self.nivel],
            "orden": orden
        }

    def gen_matching(self, orden: int) -> Dict[str,Any]:
        ejemplos_match = self.ejemplos.get('emparejamiento', [])
        
        if ejemplos_match and len(ejemplos_match) >= 3:
            pairs = random.sample(ejemplos_match, min(3, len(ejemplos_match)))
        else:
            if self.vocabulario and len(self.vocabulario) >= 3:
                words = random.sample(self.vocabulario, 3)
                pairs = [{"izquierda": w, "derecha": f"definition of {w}"} for w in words]
            else:
                pairs = [
                    {"izquierda": "Vocabulary", "derecha": "Words"},
                    {"izquierda": "Grammar", "derecha": "Rules"},
                    {"izquierda": "Practice", "derecha": "Exercise"}
                ]
        
        contenido = {"pares": pairs}
        respuesta = {"respuestas": list(range(len(pairs)))}
        
        return {
            "titulo": self._mk_title(f"Match {orden}"),
            "descripcion": "Matching exercise",
            "tipo": "emparejamiento",
            "contenido": contenido,
            "respuesta_correcta": respuesta,
            "puntos_maximos": self.puntos[self.nivel],
            "orden": orden
        }

    def gen_writing(self, orden: int) -> Dict[str,Any]:
        wc_map = {'A1':20,'A2':40,'B1':75,'B2':120,'C1':180,'C2':250}
        wc = wc_map.get(self.nivel, 50)
        
        # Intentar obtener prompt desde KB
        ejemplos_writing = self.ejemplos.get('escritura', [])
        
        if ejemplos_writing and random.random() < 0.7:
            # Usar prompt desde KB
            ejemplo = random.choice(ejemplos_writing)
            prompt = ejemplo.get('instrucciones', '')
            if not prompt:
                prompt = ejemplo.get('prompt', '')
        else:
            # Generar prompt basado en vocabulario del tema
            if self.vocabulario and len(self.vocabulario) > 0:
                tema = random.choice(self.vocabulario[:5])  # Tomar palabra del tema
                
                if self.nivel == 'A1':
                    prompts = [
                        f"Introduce yourself. Talk about your name, age, and where you're from. Minimum {wc} words.",
                        f"Describe your family. How many people are in your family? Minimum {wc} words.",
                        f"Write about your favorite food. Why do you like it? Minimum {wc} words."
                    ]
                elif self.nivel == 'A2':
                    prompts = [
                        f"Describe your daily routine. What do you do in the morning, afternoon, and evening? Minimum {wc} words.",
                        f"Write about your last weekend. What did you do? Minimum {wc} words.",
                        f"Describe your favorite place in your city. Why do you like it? Minimum {wc} words."
                    ]
                elif self.nivel == 'B1':
                    prompts = [
                        f"Write about {tema}. Share your personal experience and opinions. Minimum {wc} words.",
                        f"Describe a memorable trip or experience related to {tema}. Minimum {wc} words.",
                        f"Write about the importance of {tema} in modern life. Minimum {wc} words."
                    ]
                elif self.nivel == 'B2':
                    prompts = [
                        f"Discuss the advantages and disadvantages of {tema}. Minimum {wc} words.",
                        f"Write an opinion essay about {tema}. Include examples to support your view. Minimum {wc} words.",
                        f"Analyze how {tema} has changed in recent years. Minimum {wc} words."
                    ]
                else:  # C1, C2
                    prompts = [
                        f"Write a critical analysis of {tema}, considering multiple perspectives. Minimum {wc} words.",
                        f"Discuss the implications of {tema} on society. Use specific examples. Minimum {wc} words.",
                        f"Evaluate the role of {tema} in contemporary culture. Minimum {wc} words."
                    ]
                
                prompt = random.choice(prompts)
            else:
                # Fallback genérico
                if self.nivel == 'A1':
                    prompt = f"Introduce yourself. Minimum {wc} words."
                elif self.nivel == 'A2':
                    prompt = f"Describe your daily routine. Minimum {wc} words."
                elif self.nivel == 'B1':
                    prompt = f"Write about your hobbies and interests. Minimum {wc} words."
                elif self.nivel == 'B2':
                    prompt = f"Discuss a topic you're passionate about. Minimum {wc} words."
                else:
                    prompt = f"Write a critical essay on a topic of your choice. Minimum {wc} words."
        
        contenido = {"instrucciones": prompt, "palabras_minimas": wc}
        respuesta = {"palabras_minimas": wc}
        
        return {
            "titulo": self._mk_title(f"Write {orden}"),
            "descripcion": "Writing task",
            "tipo": "escritura",
            "contenido": contenido,
            "respuesta_correcta": respuesta,
            "puntos_maximos": self.puntos[self.nivel] * 2,
            "orden": orden
        }

    def generar_set(self, start_order: int = 1) -> List[Dict[str,Any]]:
        ejercicios = []
        o = start_order
        
        generadores = [
            (self.gen_multiple_choice, 2),
            (self.gen_true_false, 2),
            (self.gen_fill_blanks, 2),
            (self.gen_matching, 2),
            (self.gen_writing, 1)
        ]
        
        for gen_fn, count in generadores:
            for _ in range(count):
                try:
                    ejercicios.append(gen_fn(o))
                    o += 1
                except Exception as e:
                    print(f"⚠️ Error generando para lección {self.id}: {e}")
        
        return ejercicios

def count_existing_exercises(cursor, leccion_id: int) -> int:
    cursor.execute("SELECT COUNT(*) AS cnt FROM ejercicios WHERE leccion_id = %s", (leccion_id,))
    r = cursor.fetchone()
    return int(r['cnt']) if r else 0

def delete_existing_exercises(cursor, leccion_id: int) -> None:
    cursor.execute("DELETE FROM ejercicios WHERE leccion_id = %s", (leccion_id,))

def insertar_ejercicio(cursor, leccion_id: int, ejercicio: Dict[str,Any], creador_id: int) -> int:
    q = """
    INSERT INTO ejercicios (
      leccion_id, titulo, descripcion, tipo,
      contenido, respuesta_correcta, puntos_maximos,
      orden, estado, creado_por, creado_en
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'activo', %s, NOW())
    """
    vals = (
        leccion_id,
        ejercicio.get('titulo'),
        ejercicio.get('descripcion'),
        ejercicio.get('tipo'),
        json.dumps(ejercicio.get('contenido', {}), ensure_ascii=False),
        json.dumps(ejercicio.get('respuesta_correcta', {}), ensure_ascii=False),
        ejercicio.get('puntos_maximos', 0),
        ejercicio.get('orden', 0),
        creador_id
    )
    cursor.execute(q, vals)
    return cursor.lastrowid

def main(argv=None):
    parser = argparse.ArgumentParser(description="SpeakLexi Generator V5")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--overwrite", action="store_true")
    parser.add_argument("--idioma", type=str)
    parser.add_argument("--nivel", type=str)
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args(argv)

    if not cargar_knowledge_base():
        sys.exit(1)

    conn = None
    cursor = None
    try:
        conn = conectar_bd()
        cursor = conn.cursor()

        q = "SELECT id, titulo, descripcion, contenido, nivel, idioma, creado_por FROM lecciones WHERE estado = 'activa'"
        params = []
        if args.idioma:
            q += " AND idioma = %s"
            params.append(args.idioma)
        if args.nivel:
            q += " AND nivel = %s"
            params.append(args.nivel.upper())
        q += " ORDER BY nivel, idioma, orden"
        if args.limit and args.limit > 0:
            q += " LIMIT %s"
            params.append(args.limit)

        cursor.execute(q, tuple(params))
        lessons = cursor.fetchall()
        
        if not lessons:
            print("⚠️ No se encontraron lecciones")
            return

        print(f"📚 {len(lessons)} lecciones encontradas")
        print(f"⚙️ Modo: {'DRY-RUN' if args.dry_run else 'PRODUCCIÓN'}")
        print(f"🔄 Sobrescribir: {'SÍ' if args.overwrite else 'NO'}")
        print()

        total_ejercicios = 0
        con_kb = 0
        sin_kb = 0

        for idx, lesson in enumerate(lessons, start=1):
            gen = GeneradorConKB(lesson, verbose=args.verbose)

            existing = count_existing_exercises(cursor, lesson.get('id'))
            if existing and not args.overwrite and not args.dry_run:
                continue

            if existing and args.overwrite and not args.dry_run:
                delete_existing_exercises(cursor, lesson.get('id'))

            ejercicios = gen.generar_set(start_order=1)
            
            if gen.kb_leccion:
                con_kb += len(ejercicios)
            else:
                sin_kb += len(ejercicios)

            if args.dry_run:
                print(f"📖 [{idx}/{len(lessons)}] {gen.titulo} → {len(ejercicios)} ejercicios")
                continue

            creador = lesson.get('creado_por') or 1
            for e in ejercicios:
                insertar_ejercicio(cursor, lesson.get('id'), e, creador)
                total_ejercicios += 1

            if idx % 20 == 0:
                conn.commit()

            if idx % 10 == 0:
                print(f"   ✓ {idx}/{len(lessons)} lecciones ({total_ejercicios} ejercicios)")

        if not args.dry_run:
            conn.commit()
            print("\n🎉 Generación completada")

        print(f"\n{'='*70}")
        print(f"📊 RESUMEN")
        print(f"{'='*70}")
        print(f"Total ejercicios: {con_kb + sin_kb}")
        print(f"✅ Con KB: {con_kb} ({con_kb*100//(con_kb+sin_kb) if con_kb+sin_kb else 0}%)")
        print(f"🔄 Sin KB: {sin_kb} ({sin_kb*100//(con_kb+sin_kb) if con_kb+sin_kb else 0}%)")
        print(f"{'='*70}\n")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        if conn:
            conn.rollback()
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    main()