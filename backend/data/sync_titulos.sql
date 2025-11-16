-- ============================================
-- SINCRONIZACIÓN DE TÍTULOS BD ↔ KB
-- Total de updates: 87
-- ============================================

USE speaklexi;

-- Iniciar transacción
START TRANSACTION;

-- [Alemán-A1] Das Alphabet und Aussprache → Alphabet und Aussprache
UPDATE lecciones SET titulo = 'Alphabet und Aussprache' WHERE id = 172;

-- [Alemán-A1] Grundlegendes Essen und Trinken → Essen und Getränke
UPDATE lecciones SET titulo = 'Essen und Getränke' WHERE id = 180;

-- [Alemán-A1] Wochentage und Monate → Tage und Monate
UPDATE lecciones SET titulo = 'Tage und Monate' WHERE id = 178;

-- [Alemán-A1] Zahlen von 1 bis 100 → Zahlen 1-100
UPDATE lecciones SET titulo = 'Zahlen 1-100' WHERE id = 175;

-- [Alemán-A2] Menschen Beschreiben → Personen Beschreiben
UPDATE lecciones SET titulo = 'Personen Beschreiben' WHERE id = 186;

-- [Alemán-A2] Öffentliche Verkehrsmittel → Öffentlicher Verkehr
UPDATE lecciones SET titulo = 'Öffentlicher Verkehr' WHERE id = 184;

-- [Alemán-A2] Wegbeschreibungen und Orte → Wegbeschreibungen
UPDATE lecciones SET titulo = 'Wegbeschreibungen' WHERE id = 190;

-- [Alemán-A2] Zukunftspläne → Zukunft
UPDATE lecciones SET titulo = 'Zukunft' WHERE id = 193;

-- [Alemán-B1] Anfragen und Beschwerden → Beschwerden
UPDATE lecciones SET titulo = 'Beschwerden' WHERE id = 207;

-- [Alemán-B1] Technologie und Medien → Technologie
UPDATE lecciones SET titulo = 'Technologie' WHERE id = 200;

-- [Alemán-B2] Fortgeschrittene Argumentation → Argumentation
UPDATE lecciones SET titulo = 'Argumentation' WHERE id = 213;

-- [Alemán-B2] Literatur und Kunst → Literatur
UPDATE lecciones SET titulo = 'Literatur' WHERE id = 218;

-- [Alemán-B2] Öffentliche Präsentationen → Präsentationen
UPDATE lecciones SET titulo = 'Präsentationen' WHERE id = 212;

-- [Alemán-B2] Vorstellungsgespräche → Bewerbungsgespräche
UPDATE lecciones SET titulo = 'Bewerbungsgespräche' WHERE id = 215;

-- [Alemán-B2] Wirtschaft und Finanzen → Wirtschaft
UPDATE lecciones SET titulo = 'Wirtschaft' WHERE id = 216;

-- [Alemán-C1] Akademischer Diskurs → Akademische Rede
UPDATE lecciones SET titulo = 'Akademische Rede' WHERE id = 226;

-- [Alemán-C1] Philosophie und Ethik → Philosophie
UPDATE lecciones SET titulo = 'Philosophie' WHERE id = 230;

-- [Alemán-C1] Professionelles Schreiben → Professionelles Verfassen
UPDATE lecciones SET titulo = 'Professionelles Verfassen' WHERE id = 228;

-- [Alemán-C1] Sprachnuancen → Sprachliche Nuancen
UPDATE lecciones SET titulo = 'Sprachliche Nuancen' WHERE id = 229;

-- [Alemán-C2] Beherrschung von Redewendungen → Beherrschung von Ausdrücken
UPDATE lecciones SET titulo = 'Beherrschung von Ausdrücken' WHERE id = 236;

-- [Alemán-C2] Pragmatische Feinheiten → Pragmatische Nuancen
UPDATE lecciones SET titulo = 'Pragmatische Nuancen' WHERE id = 237;

-- [Alemán-C2] Vollständige Perfektion → Vollständige Beherrschung
UPDATE lecciones SET titulo = 'Vollständige Beherrschung' WHERE id = 245;

-- [Francés-A1] Jours de la Semaine et Mois → Jours et Mois
UPDATE lecciones SET titulo = 'Jours et Mois' WHERE id = 104;

-- [Francés-A1] L'Alphabet et la Prononciation → Alphabet et Prononciation
UPDATE lecciones SET titulo = 'Alphabet et Prononciation' WHERE id = 98;

-- [Francés-A1] Les Nombres de 1 à 100 → Nombres 1-100
UPDATE lecciones SET titulo = 'Nombres 1-100' WHERE id = 101;

-- [Francés-A1] Nourriture et Boisson de Base → Nourriture et Boissons
UPDATE lecciones SET titulo = 'Nourriture et Boissons' WHERE id = 106;

-- [Francés-A1] Salutations et Adieux → Salutations
UPDATE lecciones SET titulo = 'Salutations' WHERE id = 99;

-- [Francés-A2] Décrire des Personnes → Décrire les Personnes
UPDATE lecciones SET titulo = 'Décrire les Personnes' WHERE id = 112;

-- [Francés-A2] Le Temps et le Climat → Temps et Météo
UPDATE lecciones SET titulo = 'Temps et Météo' WHERE id = 113;

-- [Francés-A2] Passé Simple → Passé Composé
UPDATE lecciones SET titulo = 'Passé Composé' WHERE id = 118;

-- [Francés-A2] Transports Publics → Transport Public
UPDATE lecciones SET titulo = 'Transport Public' WHERE id = 110;

-- [Francés-B1] Conditionnels → Conditionnel
UPDATE lecciones SET titulo = 'Conditionnel' WHERE id = 124;

-- [Francés-B1] Technologie et Médias → Technologie
UPDATE lecciones SET titulo = 'Technologie' WHERE id = 126;

-- [Francés-B2] Argumentation Avancée → Argumentation
UPDATE lecciones SET titulo = 'Argumentation' WHERE id = 139;

-- [Francés-B2] Langage Idiomatique → Expressions Idiomatiques
UPDATE lecciones SET titulo = 'Expressions Idiomatiques' WHERE id = 140;

-- [Francés-B2] Littérature et Art → Littérature
UPDATE lecciones SET titulo = 'Littérature' WHERE id = 144;

-- [Francés-B2] Politique et Société → Politique
UPDATE lecciones SET titulo = 'Politique' WHERE id = 145;

-- [Francés-B2] Présentations Publiques → Présentations
UPDATE lecciones SET titulo = 'Présentations' WHERE id = 138;

-- [Francés-B2] Style Indirect → Discours Indirect
UPDATE lecciones SET titulo = 'Discours Indirect' WHERE id = 148;

-- [Francés-B2] Temps Parfaits Avancés → Temps des Verbes Avancés
UPDATE lecciones SET titulo = 'Temps des Verbes Avancés' WHERE id = 147;

-- [Francés-C1] Philosophie et Éthique → Philosophie
UPDATE lecciones SET titulo = 'Philosophie' WHERE id = 156;

-- [Francés-C2] Maîtrise des Idiomes → Maîtrise des Expressions
UPDATE lecciones SET titulo = 'Maîtrise des Expressions' WHERE id = 162;

-- [Inglés-A1] Numbers from 1 to 100 → Números del 1 al 100
UPDATE lecciones SET titulo = 'Números del 1 al 100' WHERE id = 27;

-- [Inglés-A1] Presentarse en Inglés → Presentarse en el Idioma
UPDATE lecciones SET titulo = 'Presentarse en el Idioma' WHERE id = 6;

-- [Inglés-A1] Saludos y Presentaciones Básicas → Saludos y Despedidas
UPDATE lecciones SET titulo = 'Saludos y Despedidas' WHERE id = 1;

-- [Inglés-A1] The Alphabet and Pronunciation → El Alfabeto y Pronunciación
UPDATE lecciones SET titulo = 'El Alfabeto y Pronunciación' WHERE id = 24;

-- [Inglés-A2] At the Hotel → En el Hotel
UPDATE lecciones SET titulo = 'En el Hotel' WHERE id = 37;

-- [Inglés-A2] At the Restaurant → En el Restaurante
UPDATE lecciones SET titulo = 'En el Restaurante' WHERE id = 34;

-- [Inglés-A2] Conversaciones en Restaurantes → En el Restaurante
UPDATE lecciones SET titulo = 'En el Restaurante' WHERE id = 3;

-- [Inglés-A2] Describing People → Describir Personas
UPDATE lecciones SET titulo = 'Describir Personas' WHERE id = 38;

-- [Inglés-A2] Directions and Locations → Direcciones y Ubicaciones
UPDATE lecciones SET titulo = 'Direcciones y Ubicaciones' WHERE id = 42;

-- [Inglés-B1] Comparisons → Comparaciones
UPDATE lecciones SET titulo = 'Comparaciones' WHERE id = 49;

-- [Inglés-B1] Conditionals → Condicionales
UPDATE lecciones SET titulo = 'Condicionales' WHERE id = 50;

-- [Inglés-B1] Culture and Traditions → Cultura y Tradiciones
UPDATE lecciones SET titulo = 'Cultura y Tradiciones' WHERE id = 54;

-- [Inglés-B1] Expressing Opinions → Expresar Opiniones
UPDATE lecciones SET titulo = 'Expresar Opiniones' WHERE id = 46;

-- [Inglés-B1] Sports and Fitness → Deportes y Fitness
UPDATE lecciones SET titulo = 'Deportes y Fitness' WHERE id = 57;

-- [Inglés-B1] Technology and Media → Tecnología y Medios
UPDATE lecciones SET titulo = 'Tecnología y Medios' WHERE id = 52;

-- [Inglés-B2] Economy and Finance → Economía y Finanzas
UPDATE lecciones SET titulo = 'Economía y Finanzas' WHERE id = 68;

-- [Inglés-B2] Literature and Art → Literatura y Arte
UPDATE lecciones SET titulo = 'Literatura y Arte' WHERE id = 70;

-- [Inglés-B2] Negotiation → Negociación
UPDATE lecciones SET titulo = 'Negociación' WHERE id = 63;

-- [Inglés-B2] Politics and Society → Política y Sociedad
UPDATE lecciones SET titulo = 'Política y Sociedad' WHERE id = 71;

-- [Inglés-B2] Professional Emails → Emails Profesionales
UPDATE lecciones SET titulo = 'Emails Profesionales' WHERE id = 61;

-- [Inglés-B2] Science and Technology → Ciencia y Tecnología
UPDATE lecciones SET titulo = 'Ciencia y Tecnología' WHERE id = 69;

-- [Inglés-C1] Rhetoric and Persuasion → Retórica y Persuasión
UPDATE lecciones SET titulo = 'Retórica y Persuasión' WHERE id = 87;

-- [Inglés-C1] Writing Argumentative Essays → Escribir Ensayos Argumentativos
UPDATE lecciones SET titulo = 'Escribir Ensayos Argumentativos' WHERE id = 76;

-- [Inglés-C2] Translation and Interpretation → Traducción e Interpretación
UPDATE lecciones SET titulo = 'Traducción e Interpretación' WHERE id = 92;

-- [Italiano-A1] Cibo e Bevande di Base → Cibo e Bevande
UPDATE lecciones SET titulo = 'Cibo e Bevande' WHERE id = 254;

-- [Italiano-A1] Giorni della Settimana e Mesi → Giorni e Mesi
UPDATE lecciones SET titulo = 'Giorni e Mesi' WHERE id = 252;

-- [Italiano-A1] L'Alfabeto e la Pronuncia → Alfabeto e Pronuncia
UPDATE lecciones SET titulo = 'Alfabeto e Pronuncia' WHERE id = 246;

-- [Italiano-A1] Numeri da 1 a 100 → Numeri 1-100
UPDATE lecciones SET titulo = 'Numeri 1-100' WHERE id = 249;

-- [Italiano-A2] Indicazioni e Luoghi → Indicazioni
UPDATE lecciones SET titulo = 'Indicazioni' WHERE id = 264;

-- [Italiano-A2] Passato Semplice → Passato Prossimo
UPDATE lecciones SET titulo = 'Passato Prossimo' WHERE id = 266;

-- [Italiano-A2] Trasporti Pubblici → Trasporto Pubblico
UPDATE lecciones SET titulo = 'Trasporto Pubblico' WHERE id = 258;

-- [Italiano-B1] Condizionali → Condizionale
UPDATE lecciones SET titulo = 'Condizionale' WHERE id = 272;

-- [Italiano-B1] Forma Passiva → Voce Passiva
UPDATE lecciones SET titulo = 'Voce Passiva' WHERE id = 282;

-- [Italiano-B1] Tecnologia e Media → Tecnologia
UPDATE lecciones SET titulo = 'Tecnologia' WHERE id = 274;

-- [Italiano-B2] Argomentazione Avanzata → Argomentazione
UPDATE lecciones SET titulo = 'Argomentazione' WHERE id = 287;

-- [Italiano-B2] Economia e Finanza → Economia
UPDATE lecciones SET titulo = 'Economia' WHERE id = 290;

-- [Italiano-B2] Letteratura e Arte → Letteratura
UPDATE lecciones SET titulo = 'Letteratura' WHERE id = 292;

-- [Italiano-B2] Politica e Società → Politica
UPDATE lecciones SET titulo = 'Politica' WHERE id = 293;

-- [Italiano-B2] Presentazioni Pubbliche → Presentazioni
UPDATE lecciones SET titulo = 'Presentazioni' WHERE id = 286;

-- [Italiano-B2] Riunioni di Lavoro → Colloqui di Lavoro
UPDATE lecciones SET titulo = 'Colloqui di Lavoro' WHERE id = 284;

-- [Italiano-B2] Tempi Perfetti Avanzati → Tempi Verbali Avanzati
UPDATE lecciones SET titulo = 'Tempi Verbali Avanzati' WHERE id = 295;

-- [Italiano-C1] Filosofia ed Etica → Filosofia
UPDATE lecciones SET titulo = 'Filosofia' WHERE id = 304;

-- [Italiano-C1] Scrittura Professionale → Redazione Professionale
UPDATE lecciones SET titulo = 'Redazione Professionale' WHERE id = 302;

-- [Italiano-C2] Perfezionamento Totale → Padronanza Totale
UPDATE lecciones SET titulo = 'Padronanza Totale' WHERE id = 319;

-- [Italiano-C2] Sottigliezze Pragmatiche → Sfumature Pragmatiche
UPDATE lecciones SET titulo = 'Sfumature Pragmatiche' WHERE id = 311;

-- Confirmar cambios
COMMIT;

-- Verificar cambios
SELECT COUNT(*) as total_actualizadas FROM lecciones;
