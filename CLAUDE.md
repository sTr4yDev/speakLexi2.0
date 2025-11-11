# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SpeakLexi 2.0 is a gamified language learning web application built with a traditional server-client architecture. The system uses vanilla JavaScript on the frontend and Node.js/Express on the backend, with MySQL as the database.

**Key Technologies:**
- Backend: Node.js, Express, MySQL (mysql2/promise), JWT authentication
- Frontend: Vanilla JavaScript, TailwindCSS, no framework
- Architecture: Monolithic with modular organization (5 main modules)

## Development Commands

### Backend Development

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Development with auto-reload
npm run dev

# Production start
npm start

# Run tests
npm test

# Database migration
npm run migrate
```

### Frontend Development

The frontend uses Live Server or similar static file server. No build process required.

```bash
# Serve from frontend directory (use VS Code Live Server or similar)
# Default: http://localhost:5500 or http://localhost:3000
```

### Database Setup

```bash
# Create admin user (Python script)
python backend/scripts/crear-admin.py

# Debug database
node backend/scripts/debug.js
```

## Architecture Overview

### Backend Structure

The backend follows a layered MVC architecture:

```
backend/
├── config/         # Configuration files (database, jwt, email)
├── controllers/    # Request handlers (authController, cursosController, etc.)
├── middleware/     # Auth, validation, upload middleware
├── models/         # Database models (usuario, cursos, lecciones, multimedia)
├── routes/         # Express route definitions
├── services/       # Business logic (emailService)
├── scripts/        # Utility scripts
└── server.js       # Application entry point
```

**Database Connection:**
- Uses mysql2/promise with connection pooling
- The `query()` function in `config/database.js` returns `[rows, fields]` - always destructure properly
- Connection pool is available via `pool` export
- Use `transaction()` helper for multi-step operations

**Authentication Flow:**
- JWT tokens stored in localStorage on frontend
- Middleware: `protect` (verify token), `authorize` (check roles), `requireVerifiedEmail`
- Roles: `alumno` (student), `profesor` (teacher), `admin`, `mantenimiento`
- Token passed via `Authorization: Bearer <token>` header

**Route Pattern:**
- Specific routes MUST come before parameterized routes (e.g., `/estudiante/mis-cursos` before `/:id`)
- All API routes prefixed with `/api`
- Controllers handle business logic, routes only define endpoints

### Frontend Structure

The frontend uses a modular architecture without a framework:

```
frontend/
├── assets/
│   ├── js/
│   │   ├── core/          # Core utilities (api-client, form-validator, utils)
│   │   └── pages/         # Page-specific logic (admin/, auth/, estudiante/, onboarding/)
│   ├── css/               # Styles (TailwindCSS)
│   └── components/        # Reusable HTML components (navbar, footer)
├── pages/                 # HTML pages organized by role
└── config/
    └── app-config.js      # Central configuration file
```

**Frontend Configuration:**
- `frontend/config/app-config.js` is the single source of truth for:
  - API endpoints
  - Storage keys (localStorage)
  - Validation rules
  - Role configurations
  - Error codes and messages
  - CEFR levels and gamification
- All variables exported to `window` object
- Always use `APP_CONFIG` constants instead of hardcoding values

**API Client Pattern:**
- `assets/js/core/api-client.js` provides `APIClient` class
- Handles token management, request/response, error handling
- Always use APIClient instead of raw fetch()

**Page Loading:**
- Each page has corresponding JS file in `assets/js/pages/`
- Use module loader pattern for dynamic content
- Components loaded via `navbar-loader.js`

### Module Organization (5 Main Modules)

The system is organized into 5 functional modules based on use cases:

1. **Módulo 1: Gestión de Usuarios (UC-01 to UC-07)**
   - Authentication, registration, profile management
   - Routes: `/api/auth/*`, `/api/usuario/*`

2. **Módulo 2: Gestión de Lecciones y Contenido (UC-08, UC-09)**
   - Lesson creation, multimedia management
   - Routes: `/api/lecciones/*`, `/api/multimedia/*`, `/api/cursos/*`

3. **Módulo 3: Gestión del Aprendizaje (UC-10, UC-11, UC-12)**
   - Progress tracking, gamification, leaderboards
   - Routes: `/api/progreso/*`, `/api/recompensas/*`, `/api/gamificacion/*`

4. **Módulo 4: Gestión de Desempeño (UC-13, UC-14, UC-15)**
   - Statistics, feedback, content planning
   - Routes: `/api/estadisticas/*`, `/api/retroalimentacion/*`, `/api/planificacion/*`

5. **Módulo 5: Soporte y Mantenimiento (UC-16, UC-17)**
   - Bug reports, maintenance tasks
   - Routes: `/api/reportes/*`, `/api/mantenimiento/*`

## Critical Implementation Details

### Database Query Pattern

**ALWAYS destructure query results correctly:**

```javascript
// ✅ CORRECT
const [rows] = await database.query('SELECT * FROM usuarios WHERE id = ?', [id]);
const user = rows[0];

// ❌ WRONG
const rows = await database.query(...); // Missing destructure
```

### Authentication Middleware

**Route protection order matters:**

```javascript
// ✅ CORRECT - specific routes first
router.get('/estudiante/mis-cursos', protect, authorize('alumno'), controller.getMyCourses);
router.get('/:id', controller.getCourse); // generic route last

// ❌ WRONG - generic route will catch all
router.get('/:id', controller.getCourse);
router.get('/estudiante/mis-cursos', protect, authorize('alumno'), controller.getMyCourses);
```

### Frontend Configuration Usage

**Always use centralized config:**

```javascript
// ✅ CORRECT
const endpoint = APP_CONFIG.API.ENDPOINTS.CURSOS.LISTAR;
const token = localStorage.getItem(APP_CONFIG.STORAGE.KEYS.TOKEN);

// ❌ WRONG
const endpoint = '/api/cursos';
const token = localStorage.getItem('token');
```

### Role-Based Routing

Dashboard redirects based on user role (defined in `app-config.js`):
- `alumno` → `/pages/estudiante/estudiante-dashboard.html`
- `profesor` → `/pages/profesor/profesor-dashboard.html`
- `admin` → `/pages/admin/admin-dashboard.html`

Use `navegarAlDashboard(rol)` helper function.

### CORS Configuration

Allowed origins (in `server.js`):
- `http://localhost:3000`
- `http://127.0.0.1:3000`
- `http://localhost:5500`
- `http://127.0.0.1:5500`

## Database Schema Reference

Key tables and their relationships:

- **usuarios**: Core user table (id, nombre, correo, password_hash, rol, estado_cuenta, email_verificado)
- **perfil_estudiantes**: Student profile (usuario_id, idioma_aprendizaje, nivel_actual, total_xp, racha_dias)
- **cursos**: Courses (id, nombre, idioma, nivel, descripcion, imagen_portada)
- **lecciones**: Lessons (id, curso_id, titulo, contenido, orden, duracion_estimada)
- **multimedia**: Media files (id, leccion_id, tipo, nombre_archivo, url)
- **progreso_lecciones**: Student progress tracking
- **inscripciones_curso**: Course enrollments

## Environment Variables

Required in `backend/.env`:

```
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=SpeakLexi2

# Server
PORT=5000
HOST=localhost
NODE_ENV=development

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email
EMAIL_PASS=your_password

# Frontend
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

## Common Development Patterns

### Adding a New API Endpoint

1. Define endpoint in `frontend/config/app-config.js` under `API_CONFIG.ENDPOINTS`
2. Create controller method in appropriate controller file
3. Add route in corresponding routes file (respect route order!)
4. Add middleware as needed (`protect`, `authorize`)
5. Update frontend API client usage

### Adding New Middleware

Place in `backend/middleware/` and export in the middleware file. Common patterns:
- Authentication: Use existing `protect`, `authorize`, `requireVerifiedEmail`
- Validation: Use `express-validator` (see `validator.js`)
- File uploads: Use `multer` (see `uploadMiddleware.js`)

### Frontend Page Creation

1. Create HTML file in appropriate `pages/` subdirectory
2. Create corresponding JS file in `assets/js/pages/` matching directory structure
3. Import required core utilities (`api-client.js`, `utils.js`, etc.)
4. Use configuration from `app-config.js`
5. Add route to `UI_CONFIG.RUTAS` if needed

## Testing

```bash
# Backend tests
cd backend
npm test

# Tests use Jest
# Test files should be named *.test.js
```

## Security Considerations

- Passwords hashed with bcryptjs (10 rounds)
- JWT tokens expire based on JWT_EXPIRE setting
- Rate limiting enabled (configurable via env vars)
- Helmet.js for security headers
- CORS restricted to specific origins
- Input validation using express-validator
- SQL injection prevention via parameterized queries (mysql2)

## Common Troubleshooting

### Database Connection Issues
- Verify MySQL is running
- Check `.env` credentials
- Ensure database `SpeakLexi2` exists
- Run `backend/scripts/debug.js` to test connection

### CORS Errors
- Verify frontend URL matches allowed origins in `server.js`
- Check that request includes proper headers
- Ensure credentials are enabled if sending cookies

### Authentication Failures
- Check token is stored in localStorage with correct key
- Verify token is sent in Authorization header: `Bearer <token>`
- Check token hasn't expired
- Ensure user account is active and email verified (if required)

### Route Not Found (404)
- Verify route order (specific before parameterized)
- Check route is registered in `server.js`
- Confirm API prefix `/api` is included
- Check HTTP method matches (GET, POST, PUT, DELETE)
