-- Script de renombramiento de lecciones
-- Generado automáticamente

USE SpeakLexi2;

START TRANSACTION;

-- ID: 173 - Alemán A1
UPDATE lecciones SET titulo = 'Begrüßungen' WHERE id = 173;

-- ID: 181 - Alemán A1
UPDATE lecciones SET titulo = 'Das Haus' WHERE id = 181;

-- ID: 188 - Alemán A2
UPDATE lecciones SET titulo = 'Hobbys' WHERE id = 188;

-- ID: 187 - Alemán A2
UPDATE lecciones SET titulo = 'Wetter' WHERE id = 187;

-- ID: 204 - Alemán B1
UPDATE lecciones SET titulo = 'Bildung' WHERE id = 204;

-- ID: 202 - Alemán B1
UPDATE lecciones SET titulo = 'Kultur' WHERE id = 202;

-- ID: 201 - Alemán B1
UPDATE lecciones SET titulo = 'Reisen' WHERE id = 201;

-- ID: 205 - Alemán B1
UPDATE lecciones SET titulo = 'Sport' WHERE id = 205;

-- ID: 220 - Alemán B2
UPDATE lecciones SET titulo = 'Gesundheit' WHERE id = 220;

-- ID: 219 - Alemán B2
UPDATE lecciones SET titulo = 'Politik' WHERE id = 219;

-- ID: 217 - Alemán B2
UPDATE lecciones SET titulo = 'Wissenschaft' WHERE id = 217;

-- ID: 231 - Alemán C1
UPDATE lecciones SET titulo = 'Forschung' WHERE id = 231;

-- ID: 235 - Alemán C1
UPDATE lecciones SET titulo = 'Rhetorik' WHERE id = 235;

-- ID: 242 - Alemán C2
UPDATE lecciones SET titulo = 'Humor' WHERE id = 242;

-- ID: 240 - Alemán C2
UPDATE lecciones SET titulo = 'Übersetzung' WHERE id = 240;

-- ID: 107 - Francés A1
UPDATE lecciones SET titulo = 'La Maison' WHERE id = 107;

-- ID: 116 - Francés A2
UPDATE lecciones SET titulo = 'Directions' WHERE id = 116;

-- ID: 114 - Francés A2
UPDATE lecciones SET titulo = 'Loisirs' WHERE id = 114;

-- ID: 128 - Francés B1
UPDATE lecciones SET titulo = 'Culture' WHERE id = 128;

-- ID: 130 - Francés B1
UPDATE lecciones SET titulo = 'Éducation' WHERE id = 130;

-- ID: 131 - Francés B1
UPDATE lecciones SET titulo = 'Sports' WHERE id = 131;

-- ID: 127 - Francés B1
UPDATE lecciones SET titulo = 'Voyages' WHERE id = 127;

-- ID: 142 - Francés B2
UPDATE lecciones SET titulo = 'Économie' WHERE id = 142;

-- ID: 136 - Francés B2
UPDATE lecciones SET titulo = 'Réunions' WHERE id = 136;

-- ID: 146 - Francés B2
UPDATE lecciones SET titulo = 'Santé' WHERE id = 146;

-- ID: 143 - Francés B2
UPDATE lecciones SET titulo = 'Science' WHERE id = 143;

-- ID: 157 - Francés C1
UPDATE lecciones SET titulo = 'Recherche' WHERE id = 157;

-- ID: 161 - Francés C1
UPDATE lecciones SET titulo = 'Rhétorique' WHERE id = 161;

-- ID: 168 - Francés C2
UPDATE lecciones SET titulo = 'Humour' WHERE id = 168;

-- ID: 166 - Francés C2
UPDATE lecciones SET titulo = 'Traduction' WHERE id = 166;

-- ID: 15 - Inglés A2
UPDATE lecciones SET titulo = 'Pasado Simple' WHERE id = 15;

-- ID: 14 - Inglés A2
UPDATE lecciones SET titulo = 'Pasado Simple' WHERE id = 14;

-- ID: 255 - Italiano A1
UPDATE lecciones SET titulo = 'La Casa' WHERE id = 255;

-- ID: 247 - Italiano A1
UPDATE lecciones SET titulo = 'Saluti' WHERE id = 247;

-- ID: 262 - Italiano A2
UPDATE lecciones SET titulo = 'Hobby' WHERE id = 262;

-- ID: 276 - Italiano B1
UPDATE lecciones SET titulo = 'Cultura' WHERE id = 276;

-- ID: 278 - Italiano B1
UPDATE lecciones SET titulo = 'Educazione' WHERE id = 278;

-- ID: 281 - Italiano B1
UPDATE lecciones SET titulo = 'Reclami' WHERE id = 281;

-- ID: 279 - Italiano B1
UPDATE lecciones SET titulo = 'Sport' WHERE id = 279;

-- ID: 275 - Italiano B1
UPDATE lecciones SET titulo = 'Viaggi' WHERE id = 275;

-- ID: 294 - Italiano B2
UPDATE lecciones SET titulo = 'Salute' WHERE id = 294;

-- ID: 291 - Italiano B2
UPDATE lecciones SET titulo = 'Scienza' WHERE id = 291;

-- ID: 309 - Italiano C1
UPDATE lecciones SET titulo = 'Retorica' WHERE id = 309;

-- ID: 305 - Italiano C1
UPDATE lecciones SET titulo = 'Ricerca' WHERE id = 305;

-- ID: 314 - Italiano C2
UPDATE lecciones SET titulo = 'Traduzione' WHERE id = 314;

-- ID: 316 - Italiano C2
UPDATE lecciones SET titulo = 'Umorismo' WHERE id = 316;

COMMIT;

-- Verificar cambios
SELECT id, titulo, idioma, nivel FROM lecciones WHERE id IN (173, 181, 188, 187, 204, 202, 201, 205, 220, 219, 217, 231, 235, 242, 240, 107, 116, 114, 128, 130, 131, 127, 142, 136, 146, 143, 157, 161, 168, 166, 15, 14, 255, 247, 262, 276, 278, 281, 279, 275, 294, 291, 309, 305, 314, 316);
