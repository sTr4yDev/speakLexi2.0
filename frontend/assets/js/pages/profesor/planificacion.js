/* ============================================
   SPEAKLEXI - PLANIFICACIÓN SEMI-REAL
   Genera planes automáticos y los envía por mensajería
   ============================================ */

class PlanificacionProfesor {
    constructor() {
        this.API_URL = window.APP_CONFIG?.API?.API_URL || 'http://localhost:5000/api';
        this.token = localStorage.getItem('token');
        this.estado = {
            estudiantes: [],
            conversaciones: [],
            planesGenerados: [],
            estudianteSeleccionado: null
        };
        
        // 🎯 GENERADOR DE ANÁLISIS AUTOMÁTICO
        this.analizadorIA = {
            areasComunes: [
                { nombre: 'Gramática - Tiempos Verbales', nivel: 'alta', emojis: '📚' },
                { nombre: 'Vocabulario - Expresiones Idiomáticas', nivel: 'media', emojis: '💬' },
                { nombre: 'Pronunciación - Sonidos Específicos', nivel: 'media', emojis: '🗣️' },
                { nombre: 'Comprensión Auditiva', nivel: 'baja', emojis: '👂' },
                { nombre: 'Escritura - Estructura de Oraciones', nivel: 'alta', emojis: '✍️' },
                { nombre: 'Lectura - Comprensión de Textos', nivel: 'media', emojis: '📖' }
            ],
            fortalezas: [
                'Buena actitud y motivación',
                'Constancia en la práctica',
                'Participación activa en clase',
                'Mejora progresiva observable'
            ]
        };
        
        this.init();
    }

    async init() {
        try {
            console.log('✅ Módulo Planificación Semi-Real iniciando...');
            
            await this.verificarAutenticacion();
            await this.cargarEstudiantes();
            this.configurarEventListeners();
            
            console.log('✅ Módulo listo');
        } catch (error) {
            console.error('💥 Error:', error);
            this.mostrarError('Error al cargar el módulo');
        }
    }

    async verificarAutenticacion() {
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
        
        if (!usuario || !usuario.id) {
            window.location.href = '/pages/auth/login.html';
            throw new Error('No autenticado');
        }

        if (!this.token) {
            window.location.href = '/pages/auth/login.html';
            throw new Error('Token no disponible');
        }
    }

    // ============================================
    // ELEMENTOS DOM
    // ============================================
    get elementos() {
        return {
            listaEstudiantes: document.getElementById('lista-estudiantes'),
            btnGenerarAnalisis: document.getElementById('btn-generar-analisis'),
            panelAnalisis: document.getElementById('panel-analisis'),
            contenedorAnalisis: document.getElementById('contenedor-analisis'),
            btnEnviarPlan: document.getElementById('btn-enviar-plan'),
            loadingEstudiantes: document.getElementById('loading-estudiantes'),
            loadingAnalisis: document.getElementById('loading-analisis'),
            estadoVacio: document.getElementById('estado-vacio')
        };
    }

    // ============================================
    // CARGA DE ESTUDIANTES DESDE MENSAJERÍA
    // ============================================

    async cargarEstudiantes() {
        try {
            this.mostrarLoading('estudiantes', true);
            
            console.log('📡 Cargando conversaciones...');
            const response = await fetch(`${this.API_URL}/mensajes`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error(`Error ${response.status}`);

            const result = await response.json();
            console.log('📦 Respuesta completa:', result);
            
            // ✅ FIX: Verificar múltiples posibles estructuras
            const mensajes = result.data?.data || result.data || [];
            console.log('📬 Total mensajes:', mensajes.length);
            
            if (mensajes.length > 0) {
                this.procesarEstudiantes(mensajes);
                this.renderizarEstudiantes();
            } else {
                this.mostrarEstadoVacio();
            }

        } catch (error) {
            console.error('❌ Error cargando estudiantes:', error);
            this.mostrarEstadoVacio();
        } finally {
            this.mostrarLoading('estudiantes', false);
        }
    }

    procesarEstudiantes(mensajes) {
        const estudiantesMap = new Map();
        const usuarioId = this.obtenerUsuarioId();

        mensajes.forEach(mensaje => {
            const estudianteId = mensaje.remitente_id === usuarioId ? 
                mensaje.destinatario_id : mensaje.remitente_id;
            
            // ✅ FIX: Manejo de nombres con fallback
            const nombreEstudiante = mensaje.remitente_id === usuarioId ?
                (mensaje.nombre_destinatario || mensaje.destinatario_nombre || 'Estudiante') :
                (mensaje.nombre_remitente || mensaje.remitente_nombre || 'Estudiante');

            if (!estudiantesMap.has(estudianteId)) {
                estudiantesMap.set(estudianteId, {
                    id: estudianteId,
                    nombre_completo: nombreEstudiante || 'Estudiante Sin Nombre',
                    nivel: this.generarNivelAleatorio(),
                    mensajes_totales: 0,
                    ultimo_contacto: mensaje.creado_en
                });
            }

            const estudiante = estudiantesMap.get(estudianteId);
            estudiante.mensajes_totales++;
            
            if (new Date(mensaje.creado_en) > new Date(estudiante.ultimo_contacto)) {
                estudiante.ultimo_contacto = mensaje.creado_en;
            }
        });

        this.estado.estudiantes = Array.from(estudiantesMap.values());
        console.log(`✅ ${this.estado.estudiantes.length} estudiantes procesados`, this.estado.estudiantes);
    }

    generarNivelAleatorio() {
        const niveles = ['A1', 'A2', 'B1', 'B2', 'C1'];
        return niveles[Math.floor(Math.random() * niveles.length)];
    }

    // ============================================
    // RENDERIZADO DE ESTUDIANTES
    // ============================================

    renderizarEstudiantes() {
        const elementos = this.elementos;
        if (!elementos.listaEstudiantes) return;

        if (this.estado.estudiantes.length === 0) {
            this.mostrarEstadoVacio();
            return;
        }

        elementos.listaEstudiantes.innerHTML = this.estado.estudiantes.map(est => {
            // ✅ FIX: Manejo seguro de nombres
            const nombreCompleto = est.nombre_completo || 'Estudiante';
            const iniciales = nombreCompleto.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'ES';
            
            return `
                <div class="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all cursor-pointer"
                     onclick="planificacionProfesor.seleccionarEstudiante(${est.id})">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            ${iniciales}
                        </div>
                        <div class="flex-1">
                            <h3 class="font-bold text-lg text-gray-900 dark:text-white">
                                ${nombreCompleto}
                            </h3>
                            <div class="flex items-center gap-3 mt-1">
                                <span class="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full text-xs font-bold">
                                    ${est.nivel}
                                </span>
                                <span class="text-sm text-gray-600 dark:text-gray-400">
                                    <i class="fas fa-comments mr-1"></i>
                                    ${est.mensajes_totales} mensajes
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <button class="w-full px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-semibold hover:from-primary-700 hover:to-primary-800 transition-all flex items-center justify-center gap-2 shadow-md">
                        <i class="fas fa-brain"></i>
                        Generar Plan de Mejora
                    </button>
                </div>
            `;
        }).join('');
    }

    mostrarEstadoVacio() {
        const elementos = this.elementos;
        if (elementos.estadoVacio) {
            elementos.estadoVacio.classList.remove('hidden');
        }
        if (elementos.listaEstudiantes) {
            elementos.listaEstudiantes.innerHTML = '';
        }
    }

    // ============================================
    // GENERACIÓN DE ANÁLISIS AUTOMÁTICO
    // ============================================

    async seleccionarEstudiante(estudianteId) {
        const estudiante = this.estado.estudiantes.find(e => e.id === estudianteId);
        if (!estudiante) return;

        this.estado.estudianteSeleccionado = estudiante;
        
        await this.generarAnalisisAutomatico(estudiante);
    }

    async generarAnalisisAutomatico(estudiante) {
        const elementos = this.elementos;
        
        // Mostrar panel de análisis
        if (elementos.panelAnalisis) {
            elementos.panelAnalisis.classList.remove('hidden');
            elementos.panelAnalisis.scrollIntoView({ behavior: 'smooth' });
        }

        this.mostrarLoading('analisis', true);

        // Simular tiempo de análisis
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 🎯 GENERAR ANÁLISIS PERSONALIZADO
        const analisis = this.crearAnalisisPersonalizado(estudiante);
        
        this.renderizarAnalisis(analisis);
        this.mostrarLoading('analisis', false);
    }

    crearAnalisisPersonalizado(estudiante) {
        // Seleccionar 3-4 áreas aleatorias
        const areasSeleccionadas = this.shuffleArray([...this.analizadorIA.areasComunes])
            .slice(0, 3 + Math.floor(Math.random() * 2));

        // Seleccionar 2 fortalezas aleatorias
        const fortalezasSeleccionadas = this.shuffleArray([...this.analizadorIA.fortalezas])
            .slice(0, 2);

        return {
            estudiante: estudiante,
            areasDebilidad: areasSeleccionadas,
            fortalezas: fortalezasSeleccionadas,
            recomendaciones: this.generarRecomendaciones(areasSeleccionadas),
            objetivos: this.generarObjetivos(areasSeleccionadas, estudiante.nivel)
        };
    }

    generarRecomendaciones(areas) {
        const recomendaciones = {
            'Gramática - Tiempos Verbales': [
                'Practicar con ejercicios de transformación de tiempos',
                'Hacer ejercicios de completar espacios con el tiempo correcto',
                'Leer textos y identificar los tiempos verbales'
            ],
            'Vocabulario - Expresiones Idiomáticas': [
                'Crear flashcards con expresiones comunes',
                'Ver series/películas con subtítulos',
                'Practicar con ejercicios de contexto'
            ],
            'Pronunciación - Sonidos Específicos': [
                'Practicar con ejercicios de repetición',
                'Grabar tu voz y comparar',
                'Enfocarse en sonidos problemáticos específicos'
            ],
            'Comprensión Auditiva': [
                'Escuchar podcasts en inglés',
                'Ver videos con subtítulos progresivamente menos',
                'Practicar con ejercicios de listening'
            ],
            'Escritura - Estructura de Oraciones': [
                'Practicar escribir párrafos cortos diariamente',
                'Revisar estructuras gramaticales básicas',
                'Hacer ejercicios de ordenar oraciones'
            ],
            'Lectura - Comprensión de Textos': [
                'Leer artículos cortos diariamente',
                'Practicar técnicas de skimming y scanning',
                'Hacer ejercicios de comprensión lectora'
            ]
        };

        return areas.map(area => ({
            area: area.nombre,
            acciones: recomendaciones[area.nombre] || ['Practicar regularmente']
        }));
    }

    generarObjetivos(areas, nivel) {
        const objetivosBase = [
            `Mejorar habilidades identificadas en las próximas 4 semanas`,
            `Practicar al menos 30 minutos diarios`,
            `Completar ejercicios específicos de refuerzo`,
            `Avanzar hacia el siguiente nivel (${this.siguienteNivel(nivel)})`
        ];

        return objetivosBase;
    }

    siguienteNivel(nivelActual) {
        const niveles = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        const index = niveles.indexOf(nivelActual);
        return index < niveles.length - 1 ? niveles[index + 1] : 'C2';
    }

    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    // ============================================
    // RENDERIZADO DEL ANÁLISIS
    // ============================================

    renderizarAnalisis(analisis) {
        const elementos = this.elementos;
        if (!elementos.contenedorAnalisis) return;

        const estudiante = analisis.estudiante;

        elementos.contenedorAnalisis.innerHTML = `
            <!-- Header del Estudiante -->
            <div class="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl p-6 mb-6 text-white">
                <div class="flex items-center gap-4">
                    <div class="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
                        ${estudiante.nombre_completo.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                    </div>
                    <div>
                        <h2 class="text-2xl font-bold mb-1">Plan de Mejora Personalizado</h2>
                        <p class="text-primary-100">Para: ${estudiante.nombre_completo}</p>
                        <p class="text-primary-200 text-sm mt-1">Nivel Actual: ${estudiante.nivel}</p>
                    </div>
                </div>
            </div>

            <!-- Fortalezas -->
            <div class="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 mb-6 border-2 border-green-200 dark:border-green-800">
                <h3 class="text-lg font-bold text-green-800 dark:text-green-300 mb-4 flex items-center gap-2">
                    <i class="fas fa-star"></i>
                    Fortalezas Identificadas
                </h3>
                <ul class="space-y-2">
                    ${analisis.fortalezas.map(f => `
                        <li class="flex items-center gap-2 text-green-700 dark:text-green-400">
                            <i class="fas fa-check-circle text-green-500"></i>
                            <span>${f}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>

            <!-- Áreas de Mejora -->
            <div class="mb-6">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <i class="fas fa-bullseye"></i>
                    Áreas de Mejora Prioritarias
                </h3>
                <div class="space-y-4">
                    ${analisis.areasDebilidad.map(area => {
                        const colores = {
                            alta: 'border-red-300 bg-red-50 dark:bg-red-900/20',
                            media: 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20',
                            baja: 'border-orange-300 bg-orange-50 dark:bg-orange-900/20'
                        };
                        
                        return `
                            <div class="border-l-4 ${colores[area.nivel]} rounded-lg p-4">
                                <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                                    ${area.emojis} ${area.nombre}
                                </h4>
                                <div class="flex items-center gap-2">
                                    <span class="px-3 py-1 rounded-full text-xs font-bold ${
                                        area.nivel === 'alta' ? 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-300' :
                                        area.nivel === 'media' ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                                        'bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
                                    }">
                                        Prioridad ${area.nivel}
                                    </span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- Recomendaciones Específicas -->
            <div class="mb-6">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <i class="fas fa-lightbulb"></i>
                    Recomendaciones Específicas
                </h3>
                <div class="space-y-6">
                    ${analisis.recomendaciones.map(rec => `
                        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                            <h4 class="font-semibold text-blue-900 dark:text-blue-300 mb-3">
                                📚 ${rec.area}
                            </h4>
                            <ul class="space-y-2">
                                ${rec.acciones.map(accion => `
                                    <li class="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-400">
                                        <i class="fas fa-arrow-right text-blue-500 mt-1"></i>
                                        <span>${accion}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Objetivos -->
            <div class="mb-6">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <i class="fas fa-flag-checkered"></i>
                    Objetivos del Plan
                </h3>
                <ul class="space-y-3">
                    ${analisis.objetivos.map(obj => `
                        <li class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div class="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-check text-white text-sm"></i>
                            </div>
                            <span class="text-gray-700 dark:text-gray-300">${obj}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>

            <!-- Botón de Envío -->
            <div class="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 border-2 border-green-200 dark:border-green-800">
                <div class="text-center mb-4">
                    <i class="fas fa-paper-plane text-4xl text-green-600 dark:text-green-400 mb-3"></i>
                    <h4 class="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        ¿Listo para enviar el plan?
                    </h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                        Este plan se enviará como mensaje personalizado al estudiante
                    </p>
                </div>
                <button onclick="planificacionProfesor.enviarPlanComoMensaje()" 
                        class="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3">
                    <i class="fas fa-rocket"></i>
                    Enviar Plan de Mejora al Estudiante
                </button>
            </div>
        `;

        // Guardar análisis actual
        this.estado.analisisActual = analisis;
    }

    // ============================================
    // ENVÍO DEL PLAN COMO MENSAJE REAL
    // ============================================

    async enviarPlanComoMensaje() {
        if (!this.estado.analisisActual || !this.estado.estudianteSeleccionado) {
            this.mostrarError('No hay análisis para enviar');
            return;
        }

        const analisis = this.estado.analisisActual;
        const estudiante = this.estado.estudianteSeleccionado;

        // 🎯 FORMATEAR MENSAJE COMPLETO
        const mensajePlan = this.formatearMensajePlan(analisis, estudiante);

        try {
            const btnEnviar = event.target;
            btnEnviar.disabled = true;
            btnEnviar.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Enviando Plan...';

            console.log('📤 Enviando plan a estudiante:', estudiante.id);

            // ✅ ENVIAR MENSAJE REAL A TRAVÉS DE LA API
            const response = await fetch(`${this.API_URL}/mensajes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    destinatario_id: estudiante.id,
                    mensaje: mensajePlan
                })
            });

            if (!response.ok) throw new Error(`Error ${response.status}`);

            const result = await response.json();
            
            if (result.success) {
                this.mostrarExito('✅ ¡Plan enviado exitosamente al estudiante!');
                
                // Guardar en historial local
                this.estado.planesGenerados.push({
                    estudiante_id: estudiante.id,
                    estudiante_nombre: estudiante.nombre_completo,
                    fecha: new Date().toISOString(),
                    analisis: analisis
                });

                // Resetear y volver a lista
                setTimeout(() => {
                    this.resetearPanel();
                }, 2000);
            } else {
                throw new Error('Respuesta inválida del servidor');
            }

        } catch (error) {
            console.error('❌ Error enviando plan:', error);
            this.mostrarError('Error al enviar el plan: ' + error.message);
            
            const btnEnviar = event.target;
            btnEnviar.disabled = false;
            btnEnviar.innerHTML = '<i class="fas fa-rocket mr-2"></i>Enviar Plan de Mejora al Estudiante';
        }
    }

    formatearMensajePlan(analisis, estudiante) {
        return `
🎯 PLAN DE MEJORA PERSONALIZADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 Estudiante: ${estudiante.nombre_completo}
📊 Nivel Actual: ${estudiante.nivel}
📅 Fecha: ${new Date().toLocaleDateString('es-MX', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
})}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⭐ FORTALEZAS IDENTIFICADAS:

${analisis.fortalezas.map((f, i) => `${i + 1}. ✅ ${f}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 ÁREAS DE MEJORA PRIORITARIAS:

${analisis.areasDebilidad.map((area, i) => `
${i + 1}. ${area.emojis} ${area.nombre}
   Prioridad: ${area.nivel.toUpperCase()}
`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 RECOMENDACIONES ESPECÍFICAS:

${analisis.recomendaciones.map((rec, i) => `
📚 ${rec.area}:
${rec.acciones.map((a, j) => `   ${j + 1}. ${a}`).join('\n')}
`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏁 OBJETIVOS DEL PLAN:

${analisis.objetivos.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 NOTA DEL PROFESOR:

Este plan ha sido diseñado específicamente para ti basándose en un análisis de tu progreso actual. Te recomiendo enfocarte en las áreas prioritarias durante las próximas 4 semanas.

Recuerda: la constancia es clave. Practicar 30 minutos diarios es más efectivo que estudiar 3 horas una vez a la semana.

¡Estoy aquí para apoyarte en tu proceso de aprendizaje! Si tienes dudas sobre cualquier punto del plan, no dudes en escribirme.

¡Mucho éxito! 🚀

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `.trim();
    }

    resetearPanel() {
        const elementos = this.elementos;
        
        if (elementos.panelAnalisis) {
            elementos.panelAnalisis.classList.add('hidden');
        }
        
        if (elementos.contenedorAnalisis) {
            elementos.contenedorAnalisis.innerHTML = '';
        }

        this.estado.estudianteSeleccionado = null;
        this.estado.analisisActual = null;

        // Scroll a lista
        if (elementos.listaEstudiantes) {
            elementos.listaEstudiantes.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // ============================================
    // UTILIDADES
    // ============================================

    obtenerUsuarioId() {
        try {
            const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
            return usuario.id || 0;
        } catch {
            return 0;
        }
    }

    mostrarLoading(tipo, mostrar) {
        const elementos = this.elementos;
        const elemento = tipo === 'estudiantes' ? elementos.loadingEstudiantes : elementos.loadingAnalisis;
        if (elemento) {
            elemento.classList.toggle('hidden', !mostrar);
        }
    }

    mostrarExito(mensaje) {
        if (window.toastManager) {
            window.toastManager.success(mensaje);
        } else {
            alert(`✅ ${mensaje}`);
        }
    }

    mostrarError(mensaje) {
        if (window.toastManager) {
            window.toastManager.error(mensaje);
        } else {
            alert(`❌ ${mensaje}`);
        }
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================

    configurarEventListeners() {
        // Los eventos se manejan inline con onclick por simplicidad
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================

let planificacionProfesor;

document.addEventListener('DOMContentLoaded', () => {
    planificacionProfesor = new PlanificacionProfesor();
});

window.planificacionProfesor = planificacionProfesor;