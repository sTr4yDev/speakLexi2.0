#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SpeakLexi Exercise Generator V3 — Final Perfect (Localized Hybrid)
- Localización híbrida: plantillas nativas por idioma
- Tolerancia total a campos faltantes
- Sin mezcla de idiomas
- Flags: --dry-run, --overwrite, --limit, --idioma, --nivel, --verbose
"""

from __future__ import annotations
import os
import sys
import json
import random
import argparse
import getpass
import pymysql
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple

# DB config
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME", "SpeakLexi2")
DB_CHARSET = "utf8mb4"

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
        print("✅ Conexión DB OK")
        return conn
    except Exception as e:
        print(f"❌ Error conectando a DB: {e}")
        sys.exit(1)

# Fallback vocab
VOCAB_FALLBACK = {
    'Inglés': {'A1': ['hello','name','family'], 'A2': ['restaurant','ticket'], 'B1': ['experience','opinion'], 'B2': ['negotiation','policy'], 'C1': ['methodology','critique'], 'C2': ['nuance','paradigm']},
    'Francés': {'A1': ['bonjour','nom','famille']},
    'Alemán': {'A1': ['hallo','name','familie']},
    'Italiano': {'A1': ['ciao','nome','famiglia']}
}

# PLANTILLAS NATIVAS
MC_TEMPLATES = {
    'Inglés': {
        'basic': "Choose the correct answer:",
        'advanced': "Regarding '{word}', which statement is most accurate?"
    },
    'Francés': {
        'basic': "Choisissez la bonne réponse :",
        'advanced': "Concernant « {word} », quelle affirmation est la plus précise ?"
    },
    'Alemán': {
        'basic': "Wählen Sie die richtige Antwort:",
        'advanced': "Bezüglich '{word}', welche Aussage ist am genauesten?"
    },
    'Italiano': {
        'basic': "Scegli la risposta corretta:",
        'advanced': "Riguardo '{word}', quale affermazione è più precisa?"
    }
}

TF_TEMPLATES = {
    'Inglés': {
        'practice': "Practice improves mastery of {topic}.",
        'level': "{topic} is only studied at level {nivel}.",
        'formal': "{topic} is always used in formal contexts."
    },
    'Francés': {
        'practice': "La pratique améliore la maîtrise de {topic}.",
        'level': "{topic} n'est étudié qu'au niveau {nivel}.",
        'formal': "{topic} est toujours utilisé dans des contextes formels."
    },
    'Alemán': {
        'practice': "Übung verbessert die Beherrschung von {topic}.",
        'level': "{topic} wird nur auf Niveau {nivel} gelernt.",
        'formal': "{topic} wird immer in formellen Kontexten verwendet."
    },
    'Italiano': {
        'practice': "La pratica migliora la padronanza di {topic}.",
        'level': "{topic} viene studiato solo al livello {nivel}.",
        'formal': "{topic} è sempre usato in contesti formali."
    }
}

FILL_TEMPLATES = {
    'Inglés': {
        'single': "In this lesson we often use '{word}'. Fill the blank: ___",
        'double': "Complete: {word} is important for ___ and ___."
    },
    'Francés': {
        'single': "Dans cette leçon, nous utilisons souvent '{word}'. Complétez le blanc : ___",
        'double': "Complétez : {word} est important pour ___ et ___."
    },
    'Alemán': {
        'single': "In dieser Lektion verwenden wir oft '{word}'. Vervollständigen Sie die Lücke: ___",
        'double': "Vervollständigen: {word} ist wichtig für ___ und ___."
    },
    'Italiano': {
        'single': "In questa lezione usiamo spesso '{word}'. Completa lo spazio: ___",
        'double': "Completa: {word} è importante per ___ e ___."
    }
}

WRITE_TEMPLATES = {
    'Inglés': {
        'A1': "Introduce yourself. Minimum {wc} words.",
        'A2': "Describe your daily routine. Minimum {wc} words.",
        'B1': "Describe a past experience related to {topic}. Minimum {wc} words.",
        'B2': "Argue for or against a statement related to {topic}. Minimum {wc} words.",
        'C': "Write an analysis about {topic}. Minimum {wc} words."
    },
    'Francés': {
        'A1': "Présentez-vous. Minimum {wc} mots.",
        'A2': "Décrivez votre routine quotidienne. Minimum {wc} mots.",
        'B1': "Décrivez une expérience passée liée à {topic}. Minimum {wc} mots.",
        'B2': "Argumentez pour ou contre une affirmation liée à {topic}. Minimum {wc} mots.",
        'C': "Rédigez une analyse sur {topic}. Minimum {wc} mots."
    },
    'Alemán': {
        'A1': "Stellen Sie sich vor. Mindestens {wc} Wörter.",
        'A2': "Beschreiben Sie Ihre tägliche Routine. Mindestens {wc} Wörter.",
        'B1': "Beschreiben Sie eine vergangene Erfahrung zu {topic}. Mindestens {wc} Wörter.",
        'B2': "Argumentieren Sie für oder gegen eine Aussage zu {topic}. Mindestens {wc} Wörter.",
        'C': "Schreiben Sie eine Analyse über {topic}. Mindestens {wc} Wörter."
    },
    'Italiano': {
        'A1': "Presentati. Minimo {wc} parole.",
        'A2': "Descrivi la tua routine quotidiana. Minimo {wc} parole.",
        'B1': "Descrivi un'esperienza passata relativa a {topic}. Minimo {wc} parole.",
        'B2': "Argomenta a favore o contro un'affermazione relativa a {topic}. Minimo {wc} parole.",
        'C': "Scrivi un'analisi su {topic}. Minimo {wc} parole."
    }
}

MATCH_TEMPLATES = {
    'Inglés': {'pair_label': "definition of {w}"},
    'Francés': {'pair_label': "définition de {w}"},
    'Alemán': {'pair_label': "Definition von {w}"},
    'Italiano': {'pair_label': "definizione di {w}"}
}

# ✅ FIX 3: Criterios localizados
CRITERIOS_MAP = {
    'Inglés': ["Clarity", "Accuracy", "Coherence"],
    'Francés': ["Clarté", "Précision", "Cohérence"],
    'Alemán': ["Klarheit", "Genauigkeit", "Kohärenz"],
    'Italiano': ["Chiarezza", "Precisione", "Coerenza"]
}

PROMPT_PREFIX = {
    'Inglés': {'mc': "Choose the correct option:", 'tf': "True or False:", 'fill': "Fill in the blanks:", 'match': "Match:", 'write': "Writing task:"},
    'Francés': {'mc': "Choisissez l'option correcte :", 'tf': "Vrai ou Faux :", 'fill': "Complétez les blancs :", 'match': "Associez :", 'write': "Tâche d'écriture :"},
    'Alemán': {'mc': "Wählen Sie die richtige Option:", 'tf': "Richtig oder Falsch:", 'fill': "Füllen Sie die Lücken :", 'match': "Ordnen Sie zu:", 'write': "Schreibaufgabe:"},
    'Italiano': {'mc': "Scegli l'opzione corretta:", 'tf': "Vero o Falso:", 'fill': "Completa gli spazi :", 'match': "Abbina :", 'write': "Compito di scrittura:"}
}

def safe_load_json(text: Optional[str]) -> Dict[str, Any]:
    if not text:
        return {}
    try:
        data = json.loads(text)
        return data if isinstance(data, dict) else {"_raw": data}
    except Exception:
        return {}

def choose_vocab_from_leccion(contenido: Dict[str, Any], idioma: str, nivel: str) -> List[str]:
    try:
        teoria = contenido.get('teoria', {}) or {}
        vc = teoria.get('vocabulario_clave') or teoria.get('vocabulario') or []
        if isinstance(vc, str):
            vc = [vc]
        if isinstance(vc, list) and vc:
            return [str(x) for x in vc if isinstance(x, (str, int))]
    except Exception:
        pass
    temas = contenido.get('temas') or []
    if temas:
        tokens = []
        for t in temas:
            if isinstance(t, str):
                parts = [p.strip() for p in t.replace('-', ' ').split() if p.strip()]
                tokens.extend(parts)
        if tokens:
            return list(dict.fromkeys(tokens))
    fb = VOCAB_FALLBACK.get(idioma, {}).get(nivel)
    if fb:
        return fb
    return ["concept", "example", "practice"]

def get_mc_template(idioma: str, advanced: bool=False) -> str:
    idioma = idioma if idioma in MC_TEMPLATES else 'Inglés'
    key = 'advanced' if advanced else 'basic'
    return MC_TEMPLATES[idioma].get(key)

def get_tf_templates(idioma: str) -> Dict[str, str]:
    return TF_TEMPLATES.get(idioma, TF_TEMPLATES['Inglés'])

def get_fill_template(idioma: str, mode: str='single') -> str:
    idioma = idioma if idioma in FILL_TEMPLATES else 'Inglés'
    return FILL_TEMPLATES[idioma].get(mode)

def get_write_template(idioma: str, nivel: str) -> str:
    idioma = idioma if idioma in WRITE_TEMPLATES else 'Inglés'
    if nivel in ['C1','C2']:
        return WRITE_TEMPLATES[idioma].get('C')
    return WRITE_TEMPLATES[idioma].get(nivel, WRITE_TEMPLATES[idioma].get('A1'))

def get_match_label(idioma: str, w: str) -> str:
    idioma = idioma if idioma in MATCH_TEMPLATES else 'Inglés'
    return MATCH_TEMPLATES[idioma]['pair_label'].format(w=w)

def prefix(idioma: str, key: str) -> str:
    return PROMPT_PREFIX.get(idioma, PROMPT_PREFIX['Inglés']).get(key, "")

class SpeakLexiGeneratorLocalized:
    def __init__(self, leccion_row: Dict[str, Any]):
        self.row = leccion_row
        self.id = leccion_row.get('id')
        self.titulo = leccion_row.get('titulo') or 'Untitled'
        self.nivel = (leccion_row.get('nivel') or 'A1').upper()
        self.idioma = leccion_row.get('idioma') or 'Inglés'
        self.contenido = safe_load_json(leccion_row.get('contenido'))
        self.temas = [t for t in (self.contenido.get('temas') or []) if isinstance(t, str)]
        self.objetivos = [o for o in (self.contenido.get('teoria', {}).get('objetivos') or []) if isinstance(o, str)]
        self.vocabulario_clave = [v for v in (self.contenido.get('teoria', {}).get('vocabulario_clave') or []) if isinstance(v, str)]
        self.vocab = choose_vocab_from_leccion(self.contenido, self.idioma, self.nivel)
        self.puntos = {'A1':5,'A2':7,'B1':10,'B2':12,'C1':15,'C2':20}
        if self.nivel not in self.puntos:
            self.nivel = 'A1'

    def _mk_title(self, suffix: str) -> str:
        return f"{self.titulo} — {self.nivel} — {suffix}"

    def _shuffle_options_with_correct_index(self, options: List[str], correct_index: int) -> Tuple[List[str], int]:
        if not (0 <= correct_index < len(options)):
            correct_index = 0
        correct_val = options[correct_index]
        shuffled = options[:]
        random.shuffle(shuffled)
        return shuffled, shuffled.index(correct_val)

    def gen_multiple_choice(self, orden: int) -> Dict[str,Any]:
        seed = (self.vocabulario_clave or self.vocab or self.temas)[:6]
        if seed:
            focal = random.choice(seed)
            advanced = self.nivel not in ['A1','A2']
            mc_template = get_mc_template(self.idioma, advanced=advanced)
            if self.nivel in ['A1','A2']:
                correct = str(focal)
                distractors = [str(x) for x in list(dict.fromkeys(self.vocab + seed + self.temas)) if str(x) != correct]
                random.shuffle(distractors)
                options = [correct] + distractors[:3]
                opts, correct_idx = self._shuffle_options_with_correct_index(options, 0)
                question = mc_template.format(word=focal) if '{word}' in mc_template else f"{prefix(self.idioma,'mc')} {mc_template}"
            else:
                correct = f"Correct usage of '{focal}'"
                options = [correct, f"Incorrect usage of '{focal}'", f"Rare use of '{focal}'", f"Neutral use of '{focal}'"]
                opts, correct_idx = self._shuffle_options_with_correct_index(options, 0)
                question = mc_template.format(word=focal)
        else:
            opts = ["Correct","Incorrect","Rare","None"]
            opts, correct_idx = self._shuffle_options_with_correct_index(opts, 0)
            question = prefix(self.idioma,'mc')

        contenido = {"preguntas":[{"pregunta": question, "opciones": opts}]}
        respuesta = {"respuestas":[correct_idx]}
        return {
            "titulo": self._mk_title(f"MC {orden}"),
            "descripcion": "Multiple choice",
            "tipo":"seleccion_multiple",
            "contenido": contenido,
            "respuesta_correcta": respuesta,
            "puntos_maximos": self.puntos[self.nivel],
            "orden": orden
        }

    def gen_true_false(self, orden: int) -> Dict[str,Any]:
        templates = get_tf_templates(self.idioma)
        seed = (self.temas or self.vocab or ["language"])
        afirmaciones = []
        respuestas = []
        t1 = templates.get('practice').format(topic=random.choice(seed), nivel=self.nivel)
        afirmaciones.append(t1)
        respuestas.append(True)
        t2 = templates.get('level').format(topic=random.choice(seed), nivel=self.nivel)
        afirmaciones.append(t2)
        respuestas.append(False)
        t3 = templates.get('formal').format(topic=random.choice(seed), nivel=self.nivel)
        afirmaciones.append(t3)
        respuestas.append(random.choice([True, False]))
        contenido = {"afirmaciones":afirmaciones}
        respuesta = {"respuestas":respuestas}
        return {
            "titulo": self._mk_title(f"TF {orden}"),
            "descripcion": "True/False",
            "tipo":"verdadero_falso",
            "contenido": contenido,
            "respuesta_correcta": respuesta,
            "puntos_maximos": self.puntos[self.nivel],
            "orden": orden
        }

    def gen_fill_blanks(self, orden: int) -> Dict[str,Any]:
        blanks = []
        texto = ""
        if self.vocabulario_clave:
            words = random.sample(self.vocabulario_clave, min(2,len(self.vocabulario_clave)))
            if len(words) == 1:
                tmpl = get_fill_template(self.idioma,'single')
                # ✅ FIX 1: Manejo de template None
                if not tmpl:
                    tmpl = "Complete: {word} is ___"
                texto = tmpl.format(word=words[0])
                blanks = [words[0]]
            else:
                tmpl = get_fill_template(self.idioma,'double')
                if not tmpl:
                    tmpl = "Complete: {word} ___ and ___"
                texto = tmpl.format(word=words[0])
                blanks = words[:2]
        elif self.temas:
            t = random.choice(self.temas)
            tmpl = get_fill_template(self.idioma,'double')
            if not tmpl:
                tmpl = "Complete: {word} is important for ___ and ___"
            texto = tmpl.format(word=t)
            blanks = [t, "practice"]
        else:
            tmpl = get_fill_template(self.idioma,'single')
            if not tmpl:
                tmpl = "___ is important for learning"
            texto = tmpl.format(word="practice")
            blanks = ["practice"]
        contenido = {"texto":texto}
        respuesta = {"respuestas":blanks}
        return {
            "titulo": self._mk_title(f"Fill {orden}"),
            "descripcion":"Fill in the blanks",
            "tipo":"completar_espacios",
            "contenido":contenido,
            "respuesta_correcta":respuesta,
            "puntos_maximos":self.puntos[self.nivel],
            "orden":orden
        }

    def gen_matching(self, orden:int) -> Dict[str,Any]:
        pairs = []
        # ✅ FIX 2: Usar vocab real siempre
        if self.vocab:
            sample = list(dict.fromkeys(self.vocab))[:3]
            for w in sample:
                label = get_match_label(self.idioma, w)
                pairs.append({"izquierda": w, "derecha": label})
        else:
            # Fallback usando temas si no hay vocab
            fallback_words = self.temas[:3] if self.temas else ["concept", "practice", "example"]
            for w in fallback_words:
                label = get_match_label(self.idioma, w)
                pairs.append({"izquierda": w, "derecha": label})
        
        contenido = {"pares":pairs}
        respuesta = {"respuestas": list(range(len(pairs)))}
        return {
            "titulo": self._mk_title(f"Match {orden}"),
            "descripcion":"Matching",
            "tipo":"emparejamiento",
            "contenido":contenido,
            "respuesta_correcta":respuesta,
            "puntos_maximos":self.puntos[self.nivel],
            "orden":orden
        }

    def gen_writing(self, orden:int) -> Dict[str,Any]:
        wc_map = {'A1':20,'A2':40,'B1':75,'B2':120,'C1':180,'C2':250}
        wc = wc_map.get(self.nivel,50)
        tmpl = get_write_template(self.idioma,self.nivel)
        topic = random.choice(self.temas) if self.temas else (self.vocab[0] if self.vocab else "topic")
        prompt = tmpl.format(wc=wc, topic=topic)
        contenido = {"instrucciones": prompt, "palabras_minimas": wc}
        # ✅ FIX 3: Criterios localizados
        criterios = CRITERIOS_MAP.get(self.idioma, CRITERIOS_MAP['Inglés'])
        respuesta = {"tipo":"evaluacion_manual","criterios":criterios}
        return {
            "titulo": self._mk_title(f"Write {orden}"),
            "descripcion":"Writing task",
            "tipo":"escritura",
            "contenido":contenido,
            "respuesta_correcta":respuesta,
            "puntos_maximos":self.puntos[self.nivel]*2,
            "orden":orden
        }

    def generar_set(self, start_order:int=1) -> List[Dict[str,Any]]:
        ejercicios = []
        o = start_order
        funcs = [self.gen_multiple_choice, self.gen_multiple_choice,
                 self.gen_true_false, self.gen_true_false,
                 self.gen_fill_blanks, self.gen_fill_blanks,
                 self.gen_matching, self.gen_matching,
                 self.gen_writing]
        for fn in funcs:
            try:
                ejercicios.append(fn(o))
            except Exception as e:
                print(f"⚠️ Warning generating exercise for lesson {self.id}: {e}")
            o += 1
        return ejercicios

def count_existing_exercises(cursor, leccion_id:int) -> int:
    cursor.execute("SELECT COUNT(*) AS cnt FROM ejercicios WHERE leccion_id = %s", (leccion_id,))
    r = cursor.fetchone()
    return int(r['cnt']) if r else 0

def delete_existing_exercises(cursor, leccion_id:int) -> None:
    cursor.execute("DELETE FROM ejercicios WHERE leccion_id = %s", (leccion_id,))

def insertar_ejercicio(cursor, leccion_id:int, ejercicio:Dict[str,Any], creador_id:int) -> int:
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
    parser = argparse.ArgumentParser(description="SpeakLexi Generator V3 Final")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--overwrite", action="store_true")
    parser.add_argument("--idioma", type=str)
    parser.add_argument("--nivel", type=str)
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args(argv)

    conn = None
    cursor = None
    try:
        conn = conectar_bd()
        cursor = conn.cursor()

        q = "SELECT id, titulo, descripcion, contenido, nivel, idioma, creado_por FROM lecciones WHERE estado = 'activa'"
        params = []
        if args.idioma:
            q += " AND idioma = %s"; params.append(args.idioma)
        if args.nivel:
            q += " AND nivel = %s"; params.append(args.nivel.upper())
        q += " ORDER BY nivel, idioma, orden"
        if args.limit and args.limit > 0:
            q += " LIMIT %s"; params.append(args.limit)

        cursor.execute(q, tuple(params))
        lessons = cursor.fetchall()
        if not lessons:
            print("⚠️ No lessons found with filters.")
            return

        print(f"📚 {len(lessons)} lessons found. dry-run={args.dry_run}, overwrite={args.overwrite}")
        total_inserted = 0
        summary = {}

        for idx, lesson in enumerate(lessons, start=1):
            gen = SpeakLexiGeneratorLocalized(lesson)
            key = f"{gen.nivel}-{gen.idioma}"
            summary.setdefault(key, 0)

            existing = count_existing_exercises(cursor, lesson.get('id'))
            if existing and not args.overwrite and not args.dry_run:
                if args.verbose:
                    print(f"⏭ Skipping lesson {lesson.get('id')} ({gen.titulo}) — {existing} exercises exist.")
                continue
            if existing and args.overwrite and not args.dry_run:
                if args.verbose:
                    print(f"🧹 Deleting {existing} exercises for lesson {lesson.get('id')}")
                delete_existing_exercises(cursor, lesson.get('id'))

            ejercicios = gen.generar_set(start_order=1)

            if args.dry_run:
                print(f"\n--- Lesson {idx}/{len(lessons)} [{lesson.get('id')}] {gen.titulo} ({gen.nivel}-{gen.idioma}) ---")
                for e in ejercicios[:3]:
                    print(json.dumps({
                        "titulo": e['titulo'],
                        "tipo": e['tipo'],
                        "contenido": e['contenido'],
                        "respuesta_correcta": e['respuesta_correcta'],
                        "puntos": e['puntos_maximos']
                    }, ensure_ascii=False, indent=2))
                print(f"... (would create {len(ejercicios)} exercises)\n")
                total_inserted += len(ejercicios)
                summary[key] += len(ejercicios)
                continue

            creador = lesson.get('creado_por') or 1
            for e in ejercicios:
                insertar_ejercicio(cursor, lesson.get('id'), e, creador)
                total_inserted += 1
                summary[key] += 1

            if idx % 20 == 0:
                conn.commit()
                if args.verbose:
                    print(f"✅ Committed after {idx} lessons.")
            if idx % 10 == 0:
                print(f"   ✓ Processed {idx}/{len(lessons)} lessons ({total_inserted} exercises)")

        if not args.dry_run:
            conn.commit()
            print("\n🎉 Generation committed.")
        else:
            print("\n🔎 Dry-run complete (no DB changes).")

        print(f"Total exercises (this run): {total_inserted}")
        print("Summary by level-language:")
        for k,v in sorted(summary.items()):
            print(f"  • {k}: {v}")

    except Exception as e:
        print(f"❌ Fatal error: {e}")
        if conn:
            try:
                conn.rollback()
                print("🔄 Rolled back DB changes.")
            except Exception:
                pass
        raise
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    main()