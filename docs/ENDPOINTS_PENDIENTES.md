# Endpoints Pendientes: Sistema de Lecciones Unificado

**Fecha:** 2025-11-17
**Proyecto:** SpeakLexi 2.0
**Versión:** 1.0

---

## 📋 Resumen

Este documento lista los endpoints que deben crearse o modificarse para implementar la arquitectura unificada de lecciones propuesta en `ARQUITECTURA_LECCIONES.md`.

---

## ✅ Endpoints Existentes (Funcionales)

| Método | Endpoint | Función | Archivo | Línea |
|--------|----------|---------|---------|-------|
| GET | `/api/lecciones/catalogo` | Catálogo estudiante | leccionController.js | 12 |
| GET | `/api/lecciones` | Listar todas (admin) | leccionController.js | 403 |
| GET | `/api/lecciones/:id` | Detalle de lección | leccionController.js | 459 |
| POST | `/api/lecciones` | Crear lección | leccionController.js | 347 |
| PUT | `/api/lecciones/:id` | Actualizar lección | leccionController.js | 494 |
| DELETE | `/api/lecciones/:id` | Eliminar lección | leccionController.js | 542 |
| POST | `/api/lecciones/:id/progreso` | Registrar progreso | leccionController.js | 589 |
| POST | `/api/lecciones/:id/completar` | Completar lección | leccionController.js | 695 |
| GET | `/api/lecciones/idiomas` | Idiomas disponibles | leccionController.js | 185 |
| GET | `/api/lecciones/niveles` | Niveles disponibles | leccionController.js | 210 |
| GET | `/api/lecciones/estadisticas/progreso` | Estadísticas usuario | leccionController.js | 244 |
| GET | `/api/lecciones/recientes` | Lecciones recientes | leccionController.js | 303 |

---

## 🔴 Endpoints a CREAR (Nuevos)

### 1. Gestión de Contenido Pedagógico (KB)

#### 1.1 Crear/Actualizar Contenido KB

```
POST /api/lecciones/:id/contenido-kb
```

**Descripción:** Crea o actualiza el contenido pedagógico (Knowledge Base) de una lección

**Autenticación:** Profesor, Admin

**Request Body:**
```json
{
  "vocabulario": ["word1", "word2", "..."],
  "verbos": ["verb1", "verb2", "..."],
  "adjetivos": ["adj1", "adj2", "..."],
  "frases_clave": ["phrase1", "phrase2", "..."],
  "gramatica": ["rule1", "rule2", "..."],
  "contextos": ["context1", "context2", "..."],
  "ejemplos": {
    "seleccion_multiple": [...],
    "verdadero_falso": [...],
    "completar_espacios": [...],
    "emparejamiento": [...]
  }
}
```

**Response:**
```json
{
  "success": true,
  "mensaje": "Contenido KB actualizado",
  "data": {
    "leccion_id": 123,
    "version": 2,
    "estado": "borrador"
  }
}
```

**Implementación propuesta:**
```javascript
// backend/controllers/leccionController.js
exports.crearContenidoKB = async (req, res) => {
    const { id } = req.params;
    const { vocabulario, verbos, adjetivos, frases_clave, gramatica, contextos, ejemplos } = req.body;

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Verificar que la lección existe
        const [leccion] = await connection.execute(
            'SELECT id FROM lecciones WHERE id = ?',
            [id]
        );

        if (leccion.length === 0) {
            return res.status(404).json({ success: false, error: 'Lección no encontrada' });
        }

        // Insertar o actualizar contenido KB
        const [result] = await connection.execute(`
            INSERT INTO leccion_contenido_kb
            (leccion_id, vocabulario, verbos, adjetivos, frases_clave, gramatica, contextos, creado_por, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'borrador')
            ON DUPLICATE KEY UPDATE
                vocabulario = VALUES(vocabulario),
                verbos = VALUES(verbos),
                adjetivos = VALUES(adjetivos),
                frases_clave = VALUES(frases_clave),
                gramatica = VALUES(gramatica),
                contextos = VALUES(contextos),
                actualizado_por = ?,
                version = version + 1
        `, [
            id,
            JSON.stringify(vocabulario || []),
            JSON.stringify(verbos || []),
            JSON.stringify(adjetivos || []),
            JSON.stringify(frases_clave || []),
            JSON.stringify(gramatica || []),
            JSON.stringify(contextos || []),
            req.user.id,
            req.user.id
        ]);

        // Guardar ejemplos
        if (ejemplos) {
            for (const [tipo, items] of Object.entries(ejemplos)) {
                if (Array.isArray(items)) {
                    for (const [index, item] of items.entries()) {
                        await connection.execute(`
                            INSERT INTO leccion_ejemplos (leccion_id, tipo, contenido, orden)
                            VALUES (?, ?, ?, ?)
                        `, [id, tipo, JSON.stringify(item), index]);
                    }
                }
            }
        }

        // Actualizar estado de sincronización
        await connection.execute(`
            UPDATE leccion_estado_sincronizacion
            SET tiene_contenido_kb = TRUE,
                ultima_sincronizacion = NOW()
            WHERE leccion_id = ?
        `, [id]);

        await connection.commit();

        res.json({
            success: true,
            mensaje: 'Contenido KB actualizado',
            data: { leccion_id: id }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error creando contenido KB:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        connection.release();
    }
};
```

---

#### 1.2 Obtener Contenido KB

```
GET /api/lecciones/:id/contenido-kb
```

**Descripción:** Obtiene el contenido pedagógico completo de una lección

**Autenticación:** Profesor, Admin

**Response:**
```json
{
  "success": true,
  "data": {
    "leccion_id": 123,
    "vocabulario": ["word1", "word2"],
    "verbos": ["verb1", "verb2"],
    "adjetivos": ["adj1", "adj2"],
    "frases_clave": ["phrase1", "phrase2"],
    "gramatica": ["rule1", "rule2"],
    "contextos": ["context1", "context2"],
    "version": 2,
    "estado": "aprobado",
    "ejemplos": {
      "seleccion_multiple": [...],
      "verdadero_falso": [...],
      "completar_espacios": [...],
      "emparejamiento": [...]
    }
  }
}
```

---

### 2. Estado y Sincronización

#### 2.1 Obtener Estado de Sincronización

```
GET /api/lecciones/:id/estado-sincronizacion
```

**Descripción:** Obtiene el estado de completitud y sincronización de una lección

**Autenticación:** Profesor, Admin

**Response:**
```json
{
  "success": true,
  "data": {
    "leccion_id": 123,
    "tiene_contenido_kb": true,
    "tiene_ejercicios": true,
    "tiene_multimedia": false,
    "total_ejercicios": 15,
    "total_multimedia": 0,
    "validacion_pedagogica": true,
    "validacion_tecnica": true,
    "porcentaje_completitud": 85,
    "ultima_sincronizacion": "2025-11-17T10:30:00Z",
    "estado_recomendado": "revisar_multimedia"
  }
}
```

---

#### 2.2 Forzar Sincronización

```
POST /api/lecciones/:id/sincronizar
```

**Descripción:** Fuerza la sincronización de una lección (regenera KB, ejercicios, etc.)

**Autenticación:** Admin

**Request Body:**
```json
{
  "tipo": "completa",  // 'completa' | 'solo_kb' | 'solo_ejercicios'
  "sobrescribir": false
}
```

**Response:**
```json
{
  "success": true,
  "mensaje": "Sincronización iniciada",
  "data": {
    "job_id": "sync-123-abc",
    "estado": "en_cola",
    "tiempo_estimado_segundos": 30
  }
}
```

---

#### 2.3 Dashboard de Sincronización (Admin)

```
GET /api/lecciones/dashboard/sincronizacion
```

**Descripción:** Obtiene un resumen del estado de sincronización de todas las lecciones

**Autenticación:** Admin

**Query Params:**
- `idioma` (opcional): Filtrar por idioma
- `nivel` (opcional): Filtrar por nivel
- `estado` (opcional): `completa` | `incompleta` | `error`

**Response:**
```json
{
  "success": true,
  "data": {
    "resumen": {
      "total_lecciones": 100,
      "completas": 75,
      "incompletas": 20,
      "con_errores": 5,
      "porcentaje_completitud_promedio": 82.5
    },
    "por_idioma": [
      {
        "idioma": "Inglés",
        "total": 50,
        "completas": 40,
        "incompletas": 8,
        "errores": 2
      }
    ],
    "lecciones_problematicas": [
      {
        "id": 123,
        "titulo": "Lección X",
        "problema": "Sin ejercicios generados",
        "completitud": 40
      }
    ]
  }
}
```

---

### 3. Validación y Aprobación

#### 3.1 Validar Lección Pedagógicamente

```
POST /api/lecciones/:id/validar-pedagogia
```

**Descripción:** Marca una lección como validada pedagógicamente

**Autenticación:** Profesor, Admin

**Request Body:**
```json
{
  "aprobado": true,
  "observaciones": "Contenido revisado y aprobado"
}
```

**Response:**
```json
{
  "success": true,
  "mensaje": "Lección validada pedagógicamente",
  "data": {
    "leccion_id": 123,
    "validacion_pedagogica": true,
    "porcentaje_completitud": 90
  }
}
```

---

#### 3.2 Validar Lección Técnicamente

```
POST /api/lecciones/:id/validar-tecnica
```

**Descripción:** Valida técnicamente que la lección tiene todo lo necesario

**Autenticación:** Admin

**Response:**
```json
{
  "success": true,
  "data": {
    "validacion_tecnica": true,
    "errores": [],
    "advertencias": [
      "Solo 10 ejercicios, se recomiendan 15+"
    ]
  }
}
```

---

#### 3.3 Publicar Lección

```
POST /api/lecciones/:id/publicar
```

**Descripción:** Publica una lección (la hace visible para estudiantes)

**Autenticación:** Admin

**Requisitos:**
- Validación pedagógica: ✅
- Validación técnica: ✅
- Completitud >= 70%

**Response:**
```json
{
  "success": true,
  "mensaje": "Lección publicada exitosamente",
  "data": {
    "leccion_id": 123,
    "estado": "activa",
    "publicado_en": "2025-11-17T10:30:00Z"
  }
}
```

---

### 4. Historial y Rollback

#### 4.1 Obtener Historial de Cambios

```
GET /api/lecciones/:id/historial
```

**Descripción:** Obtiene el historial completo de cambios de una lección

**Autenticación:** Profesor, Admin

**Query Params:**
- `limit` (default: 50): Número de registros
- `offset` (default: 0): Offset para paginación

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 125,
    "cambios": [
      {
        "id": 1001,
        "accion": "actualizar",
        "campo_modificado": "titulo",
        "valor_anterior": "Old Title",
        "valor_nuevo": "New Title",
        "usuario": {
          "id": 5,
          "nombre": "Admin User"
        },
        "creado_en": "2025-11-17T10:30:00Z"
      }
    ]
  }
}
```

---

#### 4.2 Rollback de Lección

```
POST /api/lecciones/:id/rollback
```

**Descripción:** Restaura una lección a una versión anterior

**Autenticación:** Admin

**Request Body:**
```json
{
  "version": 5,  // Número de versión o timestamp
  "motivo": "Restaurar versión estable"
}
```

**Response:**
```json
{
  "success": true,
  "mensaje": "Lección restaurada a versión 5",
  "data": {
    "leccion_id": 123,
    "version_anterior": 7,
    "version_actual": 5
  }
}
```

---

### 5. Generación Automática

#### 5.1 Generar Contenido KB con IA

```
POST /api/lecciones/:id/generar-kb
```

**Descripción:** Genera automáticamente contenido pedagógico usando IA

**Autenticación:** Profesor, Admin

**Request Body:**
```json
{
  "modelo": "gpt-4",  // Opcional
  "sobrescribir": false,
  "incluir_ejemplos": true
}
```

**Response:**
```json
{
  "success": true,
  "mensaje": "Generación iniciada",
  "data": {
    "job_id": "gen-kb-123-abc",
    "estado": "en_cola",
    "tiempo_estimado_segundos": 60
  }
}
```

---

#### 5.2 Generar Ejercicios Automáticamente

```
POST /api/lecciones/:id/generar-ejercicios
```

**Descripción:** Genera ejercicios basados en el contenido KB

**Autenticación:** Profesor, Admin

**Request Body:**
```json
{
  "cantidad": 15,
  "tipos": ["seleccion_multiple", "completar_espacios", "verdadero_falso"],
  "dificultades": ["facil", "medio", "dificil"],
  "distribucion": "equilibrada"  // 'equilibrada' | 'personalizada'
}
```

**Response:**
```json
{
  "success": true,
  "mensaje": "Generación de ejercicios iniciada",
  "data": {
    "job_id": "gen-ej-123-abc",
    "estado": "en_cola",
    "ejercicios_solicitados": 15
  }
}
```

---

### 6. Exportación e Importación

#### 6.1 Exportar Lección Completa

```
GET /api/lecciones/:id/exportar
```

**Descripción:** Exporta una lección completa (metadata + KB + ejercicios) en formato JSON

**Autenticación:** Profesor, Admin

**Query Params:**
- `formato` (default: `json`): `json` | `yaml` | `csv`
- `incluir_ejercicios` (default: `true`): boolean
- `incluir_multimedia` (default: `true`): boolean

**Response:**
```json
{
  "success": true,
  "data": {
    "leccion": { ... },
    "contenido_kb": { ... },
    "ejercicios": [ ... ],
    "multimedia": [ ... ],
    "metadatos_exportacion": {
      "version": "1.0",
      "exportado_en": "2025-11-17T10:30:00Z",
      "exportado_por": 5
    }
  }
}
```

---

#### 6.2 Importar Lección

```
POST /api/lecciones/importar
```

**Descripción:** Importa una lección desde un archivo JSON

**Autenticación:** Admin

**Request Body:** (multipart/form-data)
```
archivo: File (JSON)
sobrescribir_existente: boolean
validar_antes: boolean
```

**Response:**
```json
{
  "success": true,
  "mensaje": "Lección importada exitosamente",
  "data": {
    "leccion_id": 124,
    "advertencias": [],
    "errores": []
  }
}
```

---

### 7. Jobs y Monitoreo

#### 7.1 Obtener Estado de Job

```
GET /api/jobs/:job_id
```

**Descripción:** Consulta el estado de un job asíncrono (generación KB, ejercicios, etc.)

**Autenticación:** Profesor, Admin

**Response:**
```json
{
  "success": true,
  "data": {
    "job_id": "gen-kb-123-abc",
    "tipo": "generar-kb",
    "estado": "completado",  // 'en_cola' | 'procesando' | 'completado' | 'fallido'
    "progreso": 100,
    "resultado": {
      "leccion_id": 123,
      "elementos_generados": 150
    },
    "error": null,
    "creado_en": "2025-11-17T10:30:00Z",
    "completado_en": "2025-11-17T10:31:30Z"
  }
}
```

---

#### 7.2 Listar Jobs

```
GET /api/jobs
```

**Descripción:** Lista todos los jobs (con filtros)

**Autenticación:** Admin

**Query Params:**
- `tipo` (opcional): Tipo de job
- `estado` (opcional): Estado del job
- `usuario_id` (opcional): Filtrar por usuario
- `limit` (default: 50)
- `offset` (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 234,
    "jobs": [
      {
        "job_id": "gen-kb-123-abc",
        "tipo": "generar-kb",
        "estado": "completado",
        "leccion_id": 123,
        "creado_en": "2025-11-17T10:30:00Z"
      }
    ]
  }
}
```

---

## 🟡 Endpoints a MODIFICAR (Existentes)

### 1. POST /api/lecciones (Crear Lección)

**Cambios necesarios:**

1. Agregar creación automática de `leccion_estado_sincronizacion`
2. Registrar en `leccion_historial`
3. Encolar job de generación de KB
4. Retornar estado de sincronización

**Modificación:**
```javascript
// backend/controllers/leccionController.js:347
exports.crearLeccion = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Crear lección (código existente)
        const leccionId = await Leccion.crear(req.body, connection);

        // 🔥 NUEVO: Crear estado de sincronización
        await connection.execute(`
            INSERT INTO leccion_estado_sincronizacion (leccion_id)
            VALUES (?)
        `, [leccionId]);

        // 🔥 NUEVO: Registrar en historial
        await connection.execute(`
            INSERT INTO leccion_historial (leccion_id, accion, usuario_id, campo_modificado, valor_nuevo)
            VALUES (?, 'crear', ?, 'leccion', ?)
        `, [leccionId, req.user.id, JSON.stringify(req.body)]);

        await connection.commit();

        // 🔥 NUEVO: Encolar job de generación de KB
        const jobId = await kbQueue.add('generar-contenido-kb', {
            leccion_id: leccionId,
            idioma: req.body.idioma,
            nivel: req.body.nivel,
            titulo: req.body.titulo
        });

        res.status(201).json({
            success: true,
            mensaje: 'Lección creada. Generando contenido pedagógico...',
            data: {
                id: leccionId,
                leccion_id: leccionId,
                ...req.body,
                estado_sincronizacion: {
                    completitud: 0,
                    job_id: jobId.id,
                    pendiente_contenido_kb: true
                }
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error creando lección:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        connection.release();
    }
};
```

---

### 2. PUT /api/lecciones/:id (Actualizar Lección)

**Cambios necesarios:**

1. Registrar cambios en `leccion_historial` (antes/después)
2. Actualizar `leccion_estado_sincronizacion.ultima_sincronizacion`
3. Encolar job de regeneración si cambió idioma/nivel/título
4. Invalidar cache

**Modificación:**
```javascript
// backend/controllers/leccionController.js:494
exports.actualizarLeccion = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 🔥 NUEVO: Obtener valores anteriores
        const [anterior] = await connection.execute(
            'SELECT * FROM lecciones WHERE id = ?',
            [req.params.id]
        );

        if (anterior.length === 0) {
            return res.status(404).json({ success: false, error: 'Lección no encontrada' });
        }

        // Actualizar lección (código existente)
        await Leccion.actualizar(req.params.id, req.body, connection);

        // 🔥 NUEVO: Registrar cada cambio en historial
        for (const [campo, valorNuevo] of Object.entries(req.body)) {
            const valorAnterior = anterior[0][campo];
            if (valorAnterior !== valorNuevo) {
                await connection.execute(`
                    INSERT INTO leccion_historial (leccion_id, accion, usuario_id, campo_modificado, valor_anterior, valor_nuevo)
                    VALUES (?, 'actualizar', ?, ?, ?, ?)
                `, [req.params.id, req.user.id, campo, String(valorAnterior), String(valorNuevo)]);
            }
        }

        // 🔥 NUEVO: Actualizar timestamp de sincronización
        await connection.execute(`
            UPDATE leccion_estado_sincronizacion
            SET ultima_sincronizacion = NOW()
            WHERE leccion_id = ?
        `, [req.params.id]);

        await connection.commit();

        // 🔥 NUEVO: Si cambió idioma/nivel/título, regenerar KB
        const cambiosCriticos = ['idioma', 'nivel', 'titulo'];
        if (cambiosCriticos.some(campo => req.body[campo] !== undefined)) {
            await kbQueue.add('regenerar-contenido-kb', {
                leccion_id: req.params.id,
                cambios: req.body
            });
        }

        // 🔥 NUEVO: Invalidar cache
        await redis.del(`leccion:${req.params.id}`);
        await redis.del(`catalogo:*`);  // Invalidar todos los catálogos

        res.json({ success: true, mensaje: 'Lección actualizada exitosamente' });

    } catch (error) {
        await connection.rollback();
        console.error('Error actualizando lección:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        connection.release();
    }
};
```

---

### 3. DELETE /api/lecciones/:id (Eliminar Lección)

**Cambios necesarios:**

1. Soft delete en lugar de hard delete (marcar como inactiva)
2. Registrar en historial
3. Mantener contenido KB para auditoría
4. Invalidar cache

**Modificación:**
```javascript
// backend/controllers/leccionController.js:542
exports.eliminarLeccion = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Verificar que existe
        const [leccion] = await connection.execute(
            'SELECT * FROM lecciones WHERE id = ?',
            [req.params.id]
        );

        if (leccion.length === 0) {
            return res.status(404).json({ success: false, error: 'Lección no encontrada' });
        }

        // 🔥 CAMBIO: Soft delete en lugar de DELETE
        await connection.execute(`
            UPDATE lecciones
            SET estado = 'eliminada', actualizado_en = NOW()
            WHERE id = ?
        `, [req.params.id]);

        // 🔥 NUEVO: Registrar eliminación
        await connection.execute(`
            INSERT INTO leccion_historial (leccion_id, accion, usuario_id, valor_anterior)
            VALUES (?, 'eliminar', ?, ?)
        `, [req.params.id, req.user.id, JSON.stringify(leccion[0])]);

        await connection.commit();

        // 🔥 NUEVO: Invalidar cache
        await redis.del(`leccion:${req.params.id}`);
        await redis.del(`catalogo:*`);

        res.json({ success: true, mensaje: 'Lección eliminada exitosamente' });

    } catch (error) {
        await connection.rollback();
        console.error('Error eliminando lección:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        connection.release();
    }
};
```

---

### 4. GET /api/lecciones/catalogo (Catálogo Estudiante)

**Cambios necesarios:**

1. Agregar JOIN con `leccion_estado_sincronizacion`
2. Filtrar solo lecciones con completitud >= 70%
3. Agregar cache de Redis
4. Retornar porcentaje de completitud

**Modificación:**
```javascript
// backend/controllers/leccionController.js:12
exports.obtenerCatalogo = async (req, res) => {
    try {
        const usuarioId = req.user.id;

        // Obtener idioma y nivel del usuario
        const [perfil] = await pool.execute(`
            SELECT idioma_aprendizaje as idioma, nivel_actual as nivel
            FROM perfil_estudiantes
            WHERE usuario_id = ?
        `, [usuarioId]);

        const { idioma, nivel } = perfil[0];
        const cacheKey = `catalogo:${idioma}:${nivel}:${usuarioId}`;

        // 🔥 NUEVO: Verificar cache
        const cached = await redis.get(cacheKey);
        if (cached) {
            return res.json(JSON.parse(cached));
        }

        // 🔥 MODIFICADO: Agregar JOIN con estado_sincronizacion
        const [lecciones] = await pool.execute(`
            SELECT
                l.*,
                s.porcentaje_completitud,
                s.tiene_contenido_kb,
                s.tiene_ejercicios,
                s.total_ejercicios,
                COALESCE(MAX(p.progreso), 0) as progreso_usuario,
                CASE
                    WHEN MAX(p.completada) = 1 THEN 'completada'
                    WHEN MAX(p.progreso) > 0 THEN 'en_progreso'
                    ELSE 'nueva'
                END as estado_usuario
            FROM lecciones l
            INNER JOIN leccion_estado_sincronizacion s ON l.id = s.leccion_id
            LEFT JOIN progreso_lecciones p ON l.id = p.leccion_id AND p.usuario_id = ?
            WHERE l.estado = 'activa'
              AND l.idioma = ?
              AND l.nivel = ?
              AND s.porcentaje_completitud >= 70  -- 🔥 NUEVO: Filtro de completitud
            GROUP BY l.id
            ORDER BY l.orden, l.titulo
        `, [usuarioId, idioma, nivel]);

        const resultado = {
            success: true,
            data: { lecciones, total: lecciones.length, ... }
        };

        // 🔥 NUEVO: Guardar en cache (5 minutos)
        await redis.setex(cacheKey, 300, JSON.stringify(resultado));

        res.json(resultado);

    } catch (error) {
        console.error('Error obteniendo catálogo:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
```

---

### 5. GET /api/lecciones/:id (Detalle de Lección)

**Cambios necesarios:**

1. Incluir `leccion_contenido_kb` si el usuario es profesor/admin
2. Incluir estado de sincronización
3. Agregar cache

**Modificación:**
```javascript
// backend/controllers/leccionController.js:459
exports.obtenerLeccion = async (req, res) => {
    try {
        const leccionId = req.params.id;
        const cacheKey = `leccion:${leccionId}`;

        // 🔥 NUEVO: Verificar cache
        const cached = await redis.get(cacheKey);
        if (cached) {
            return res.json(JSON.parse(cached));
        }

        const leccion = await Leccion.obtenerPorId(leccionId);

        if (!leccion) {
            return res.status(404).json({ success: false, error: 'Lección no encontrada' });
        }

        // 🔥 NUEVO: Obtener estado de sincronización
        const [estadoSync] = await pool.execute(`
            SELECT * FROM leccion_estado_sincronizacion
            WHERE leccion_id = ?
        `, [leccionId]);

        // 🔥 NUEVO: Si es profesor/admin, incluir contenido KB
        let contenidoKB = null;
        if (['profesor', 'admin'].includes(req.user.rol)) {
            const [kb] = await pool.execute(`
                SELECT * FROM leccion_contenido_kb
                WHERE leccion_id = ?
            `, [leccionId]);

            if (kb.length > 0) {
                contenidoKB = {
                    ...kb[0],
                    vocabulario: JSON.parse(kb[0].vocabulario),
                    verbos: JSON.parse(kb[0].verbos),
                    adjetivos: JSON.parse(kb[0].adjetivos),
                    frases_clave: JSON.parse(kb[0].frases_clave),
                    gramatica: JSON.parse(kb[0].gramatica),
                    contextos: JSON.parse(kb[0].contextos)
                };
            }
        }

        // Obtener multimedia (código existente)
        const multimedia = await Multimedia.obtenerPorLeccion(leccionId);

        const resultado = {
            success: true,
            data: {
                ...leccion,
                multimedia,
                estado_sincronizacion: estadoSync[0] || null,
                contenido_kb: contenidoKB
            }
        };

        // 🔥 NUEVO: Guardar en cache (10 minutos)
        await redis.setex(cacheKey, 600, JSON.stringify(resultado));

        res.json(resultado);

    } catch (error) {
        console.error('Error obteniendo lección:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
```

---

## 🔧 Configuración de Rutas

### Archivo: backend/routes/leccionRoutes.js

**Rutas a agregar:**

```javascript
// ========================================
// RUTAS DE CONTENIDO KB
// ========================================
router.post('/:id/contenido-kb',
    authMiddleware.verificarRol('profesor', 'admin'),
    param('id').isInt({ min: 1 }),
    leccionController.crearContenidoKB
);

router.get('/:id/contenido-kb',
    authMiddleware.verificarRol('profesor', 'admin'),
    param('id').isInt({ min: 1 }),
    leccionController.obtenerContenidoKB
);

// ========================================
// RUTAS DE ESTADO Y SINCRONIZACIÓN
// ========================================
router.get('/:id/estado-sincronizacion',
    authMiddleware.verificarRol('profesor', 'admin'),
    param('id').isInt({ min: 1 }),
    leccionController.obtenerEstadoSincronizacion
);

router.post('/:id/sincronizar',
    authMiddleware.verificarRol('admin'),
    param('id').isInt({ min: 1 }),
    leccionController.forzarSincronizacion
);

router.get('/dashboard/sincronizacion',
    authMiddleware.verificarRol('admin'),
    leccionController.dashboardSincronizacion
);

// ========================================
// RUTAS DE VALIDACIÓN
// ========================================
router.post('/:id/validar-pedagogia',
    authMiddleware.verificarRol('profesor', 'admin'),
    param('id').isInt({ min: 1 }),
    leccionController.validarPedagogia
);

router.post('/:id/validar-tecnica',
    authMiddleware.verificarRol('admin'),
    param('id').isInt({ min: 1 }),
    leccionController.validarTecnica
);

router.post('/:id/publicar',
    authMiddleware.verificarRol('admin'),
    param('id').isInt({ min: 1 }),
    leccionController.publicarLeccion
);

// ========================================
// RUTAS DE HISTORIAL Y ROLLBACK
// ========================================
router.get('/:id/historial',
    authMiddleware.verificarRol('profesor', 'admin'),
    param('id').isInt({ min: 1 }),
    leccionController.obtenerHistorial
);

router.post('/:id/rollback',
    authMiddleware.verificarRol('admin'),
    param('id').isInt({ min: 1 }),
    leccionController.rollbackLeccion
);

// ========================================
// RUTAS DE GENERACIÓN AUTOMÁTICA
// ========================================
router.post('/:id/generar-kb',
    authMiddleware.verificarRol('profesor', 'admin'),
    param('id').isInt({ min: 1 }),
    leccionController.generarKBConIA
);

router.post('/:id/generar-ejercicios',
    authMiddleware.verificarRol('profesor', 'admin'),
    param('id').isInt({ min: 1 }),
    leccionController.generarEjercicios
);

// ========================================
// RUTAS DE EXPORTACIÓN/IMPORTACIÓN
// ========================================
router.get('/:id/exportar',
    authMiddleware.verificarRol('profesor', 'admin'),
    param('id').isInt({ min: 1 }),
    leccionController.exportarLeccion
);

router.post('/importar',
    authMiddleware.verificarRol('admin'),
    uploadMiddleware.single('archivo'),
    leccionController.importarLeccion
);

// ========================================
// RUTAS DE JOBS
// ========================================
router.get('/jobs/:job_id',
    authMiddleware.verificarRol('profesor', 'admin'),
    leccionController.obtenerEstadoJob
);

router.get('/jobs',
    authMiddleware.verificarRol('admin'),
    leccionController.listarJobs
);
```

---

## 📊 Priorización de Implementación

### Fase 1: CRÍTICA (Semana 1-2)
1. ✅ Modificar POST /api/lecciones
2. ✅ Modificar PUT /api/lecciones/:id
3. ✅ Modificar DELETE /api/lecciones/:id
4. ✅ Modificar GET /api/lecciones/catalogo
5. ✅ GET /api/lecciones/:id/estado-sincronizacion
6. ✅ POST /api/lecciones/:id/contenido-kb
7. ✅ GET /api/lecciones/:id/contenido-kb

### Fase 2: ALTA (Semana 3)
8. ✅ POST /api/lecciones/:id/sincronizar
9. ✅ GET /api/lecciones/dashboard/sincronizacion
10. ✅ POST /api/lecciones/:id/validar-pedagogia
11. ✅ POST /api/lecciones/:id/publicar
12. ✅ GET /api/lecciones/:id/historial

### Fase 3: MEDIA (Semana 4)
13. ✅ POST /api/lecciones/:id/generar-kb
14. ✅ POST /api/lecciones/:id/generar-ejercicios
15. ✅ GET /api/jobs/:job_id
16. ✅ GET /api/jobs

### Fase 4: BAJA (Semana 5)
17. ✅ POST /api/lecciones/:id/rollback
18. ✅ GET /api/lecciones/:id/exportar
19. ✅ POST /api/lecciones/importar
20. ✅ POST /api/lecciones/:id/validar-tecnica

---

## ✅ Checklist de Implementación

- [ ] Crear nuevas tablas de BD
- [ ] Escribir triggers de BD
- [ ] Implementar sistema de jobs (Bull)
- [ ] Crear controladores nuevos
- [ ] Modificar controladores existentes
- [ ] Actualizar rutas
- [ ] Implementar cache con Redis
- [ ] Escribir tests unitarios
- [ ] Escribir tests de integración
- [ ] Actualizar documentación de API
- [ ] Actualizar frontend (admin)
- [ ] Actualizar frontend (estudiante)

---

**Fecha:** 2025-11-17
**Autor:** Claude Code
**Versión:** 1.0
