/* ============================================
   SOLUCIÓN FINAL - RETROALIMENTACIÓN
   ============================================ */

class RetroalimentacionProfesor {
    constructor() {
        this.API_URL = 'http://localhost:5000/api';
        this.token = localStorage.getItem('token');
        this.conversaciones = [];
        this.estudiantes = [];
        this.init();
    }

    async init() {
        console.log('🚀 INICIO');
        await this.cargarConversaciones();
        this.setupEventos();
    }

    async cargarConversaciones() {
        try {
            const response = await fetch(`${this.API_URL}/mensajes`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            const result = await response.json();
            console.log('📦 RESPUESTA:', result);
            
            // ✅ ARREGLO: Verificar result.data directamente
            const mensajes = result.data?.data || result.data || [];
            console.log('📬 MENSAJES:', mensajes.length);
            
            if (mensajes.length === 0) {
                this.mostrarVacio();
                return;
            }
            
            this.procesarMensajes(mensajes);
            this.renderizar();
            
        } catch (error) {
            console.error('❌', error);
            this.mostrarVacio();
        }
    }

    procesarMensajes(mensajes) {
        const grupos = {};
        const miId = JSON.parse(localStorage.getItem('usuario')).id;
        
        mensajes.forEach(m => {
            const otraPersona = m.remitente_id === miId ? m.destinatario_id : m.remitente_id;
            const nombre = m.remitente_id === miId ? 
                (m.nombre_destinatario || m.destinatario_nombre || 'Desconocido') : 
                (m.nombre_remitente || m.remitente_nombre || 'Desconocido');
            
            if (!grupos[otraPersona]) {
                grupos[otraPersona] = {
                    id: otraPersona,
                    nombre: nombre || 'Sin nombre',
                    mensajes: []
                };
            }
            grupos[otraPersona].mensajes.push(m);
        });
        
        this.estudiantes = Object.values(grupos);
        console.log('👥 ESTUDIANTES:', this.estudiantes.length, this.estudiantes);
    }

    renderizar() {
        const lista = document.getElementById('lista-alumnos');
        const vacio = document.getElementById('estado-vacio-alumnos');
        
        if (!lista) {
            console.error('❌ No existe #lista-alumnos');
            return;
        }
        
        if (this.estudiantes.length === 0) {
            vacio?.classList.remove('hidden');
            lista.innerHTML = '';
            return;
        }
        
        vacio?.classList.add('hidden');
        
        lista.innerHTML = this.estudiantes.map(e => {
            const inicial = (e.nombre || 'U').charAt(0).toUpperCase();
            const nombreSeguro = e.nombre || 'Usuario';
            
            return `
            <div class="p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                <div class="flex items-center gap-3 mb-3">
                    <div class="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold">
                        ${inicial}
                    </div>
                    <div>
                        <h4 class="font-semibold text-gray-900 dark:text-white">${nombreSeguro}</h4>
                        <p class="text-xs text-gray-500">${e.mensajes.length} mensajes</p>
                    </div>
                </div>
                <button onclick="retroalimentacionProfesor.enviar(${e.id}, '${nombreSeguro}')" 
                        class="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm">
                    📤 Enviar Retroalimentación
                </button>
            </div>
        `;
        }).join('');
        
        // ✅ LLENAR SELECT DEL MODAL
        const select = document.getElementById('select-destinatario');
        if (select) {
            select.innerHTML = '<option value="">Selecciona...</option>' + 
                this.estudiantes.map(e => `<option value="${e.id}">${e.nombre}</option>`).join('');
        }
    }

    mostrarVacio() {
        const vacio = document.getElementById('estado-vacio-alumnos');
        const lista = document.getElementById('lista-alumnos');
        
        if (vacio) {
            vacio.innerHTML = `
                <div class="p-8 text-center">
                    <i class="fas fa-inbox text-4xl text-gray-300 mb-3"></i>
                    <p class="text-gray-500">No hay conversaciones</p>
                    <a href="/pages/mensajes.html" class="mt-3 inline-block px-4 py-2 bg-primary-600 text-white rounded">
                        Ir a Mensajes
                    </a>
                </div>
            `;
            vacio.classList.remove('hidden');
        }
        if (lista) lista.innerHTML = '';
    }

    async enviar(alumnoId, nombreAlumno) {
        const mensaje = `🎯 RETROALIMENTACIÓN DEL PROFESOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hola ${nombreAlumno},

He revisado tu progreso reciente:

✅ FORTALEZAS:
• Buena actitud y constancia
• Participación activa

📚 ÁREAS DE MEJORA:
• Gramática - Tiempos verbales
• Vocabulario - Expresiones comunes

💡 RECOMENDACIONES:
• Practicar 30 min diarios
• Enfocarte en ejercicios específicos
• Preguntar dudas cuando surjan

¡Sigue adelante! 🚀`;

        if (!confirm(`¿Enviar retroalimentación a ${nombreAlumno}?`)) return;

        try {
            const response = await fetch(`${this.API_URL}/mensajes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    destinatario_id: alumnoId,
                    mensaje: mensaje
                })
            });

            const result = await response.json();
            
            if (result.success) {
                alert('✅ ¡Retroalimentación enviada!');
            } else {
                alert('❌ Error: ' + (result.message || 'Desconocido'));
            }

        } catch (error) {
            console.error('❌', error);
            alert('❌ Error al enviar');
        }
    }

    // ============================================
    // MODAL
    // ============================================
    abrirModal() {
        const modal = document.getElementById('modal-nuevo-mensaje');
        if (modal) modal.classList.remove('hidden');
    }

    cerrarModal() {
        const modal = document.getElementById('modal-nuevo-mensaje');
        if (modal) modal.classList.add('hidden');
    }

    async enviarDesdeModal(e) {
        e.preventDefault();
        
        const alumnoId = document.getElementById('select-destinatario').value;
        const tipo = document.getElementById('select-tipo-retro')?.value || 'general';
        const mensaje = document.getElementById('textarea-mensaje').value;
        
        if (!alumnoId || !mensaje) {
            alert('⚠️ Completa todos los campos');
            return;
        }

        const plantillas = {
            general: '💬 RETROALIMENTACIÓN:\n\n',
            felicitacion: '🎉 FELICITACIÓN:\n\n',
            mejora: '📚 ÁREA DE MEJORA:\n\n',
            alerta: '⚠️ ALERTA:\n\n'
        };

        const mensajeFinal = (plantillas[tipo] || plantillas.general) + mensaje;

        try {
            const response = await fetch(`${this.API_URL}/mensajes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    destinatario_id: parseInt(alumnoId),
                    mensaje: mensajeFinal
                })
            });

            const result = await response.json();
            
            if (result.success) {
                alert('✅ ¡Enviado!');
                this.cerrarModal();
                document.getElementById('form-nuevo-mensaje').reset();
            } else {
                alert('❌ Error: ' + (result.message || 'Desconocido'));
            }

        } catch (error) {
            console.error('❌', error);
            alert('❌ Error al enviar');
        }
    }

    setupEventos() {
        // Botón nuevo mensaje
        const btnNuevo = document.getElementById('btn-nuevo-mensaje');
        if (btnNuevo) btnNuevo.onclick = () => this.abrirModal();

        // Botones cerrar modal
        const btnCerrar = document.getElementById('btn-cerrar-modal');
        const btnCancelar = document.getElementById('btn-cancelar-modal');
        if (btnCerrar) btnCerrar.onclick = () => this.cerrarModal();
        if (btnCancelar) btnCancelar.onclick = () => this.cerrarModal();

        // Form modal
        const form = document.getElementById('form-nuevo-mensaje');
        if (form) form.onsubmit = (e) => this.enviarDesdeModal(e);

        // Buscador
        const buscar = document.getElementById('buscador-alumnos');
        if (buscar) {
            buscar.oninput = (e) => {
                const texto = e.target.value.toLowerCase();
                const filtrados = this.estudiantes.filter(est => 
                    est.nombre.toLowerCase().includes(texto)
                );
                const temp = this.estudiantes;
                this.estudiantes = filtrados;
                this.renderizar();
                if (!e.target.value) this.estudiantes = temp;
            };
        }
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================
let retroalimentacionProfesor;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎬 DOM LISTO');
    retroalimentacionProfesor = new RetroalimentacionProfesor();
});

window.retroalimentacionProfesor = retroalimentacionProfesor;