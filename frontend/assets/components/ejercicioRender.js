/**
 * EjercicioRenderer - Renderiza todos los tipos de ejercicios
 * Tipos soportados:
 * - seleccion_multiple
 * - completar_espacios
 * - emparejamiento
 * - verdadero_falso
 * - escritura
 */
class EjercicioRenderer {
    constructor(ejercicio, contenedor) {
        this.ejercicio = ejercicio;
        this.contenedor = contenedor;
        this.respuestasUsuario = {};
    }

    /**
     * Método principal para renderizar el ejercicio
     */
    renderizar() {
        const tipo = this.ejercicio.tipo;
        
        switch (tipo) {
            case 'seleccion_multiple':
                return this.renderSeleccionMultiple();
            case 'completar_espacios':
                return this.renderCompletarEspacios();
            case 'emparejamiento':
                return this.renderEmparejamiento();
            case 'verdadero_falso':
                return this.renderVerdaderoFalso();
            case 'escritura':
                return this.renderEscritura();
            default:
                return this.renderNoSoportado(tipo);
        }
    }

    /**
     * SELECCIÓN MÚLTIPLE
     */
    renderSeleccionMultiple() {
        const preguntas = this.ejercicio.contenido.preguntas || [];
        
        return `
            <div class="ejercicio-seleccion-multiple">
                ${preguntas.map((pregunta, index) => `
                    <div class="ejercicio-pregunta mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h4 class="font-semibold text-lg mb-4 text-gray-900 dark:text-white">
                            <span class="inline-block w-8 h-8 bg-blue-500 text-white rounded-full text-center leading-8 mr-2">
                                ${index + 1}
                            </span>
                            ${pregunta.pregunta}
                        </h4>
                        <div class="space-y-2 ml-10">
                            ${pregunta.opciones.map((opcion, optIndex) => `
                                <label class="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors group">
                                    <input 
                                        type="radio" 
                                        name="pregunta-${this.ejercicio.id}-${index}" 
                                        value="${optIndex}"
                                        class="mr-3 w-4 h-4 text-blue-600"
                                        data-pregunta="${index}"
                                    >
                                    <span class="text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-400">
                                        ${opcion}
                                    </span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * COMPLETAR ESPACIOS
     */
    renderCompletarEspacios() {
        const texto = this.ejercicio.contenido.texto || '';
        const partes = texto.split('___');
        let inputIndex = 0;
        
        return `
            <div class="ejercicio-completar-espacios p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div class="text-lg leading-relaxed text-gray-900 dark:text-white">
                    ${partes.map((parte, index) => `
                        <span>${this.escaparHTML(parte)}</span>${index < partes.length - 1 ? `
                            <input 
                                type="text" 
                                class="espacio-blanco inline-block border-b-2 border-blue-500 mx-2 px-2 py-1 w-32 bg-transparent text-center focus:outline-none focus:border-blue-700 dark:text-white"
                                placeholder="..."
                                data-index="${inputIndex++}"
                                data-ejercicio="${this.ejercicio.id}"
                            >
                        ` : ''}
                    `).join('')}
                </div>
                <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    <i class="fas fa-info-circle mr-1"></i>
                    Completa los espacios en blanco con las palabras correctas
                </p>
            </div>
        `;
    }

    /**
     * EMPAREJAMIENTO
     */
    renderEmparejamiento() {
        const pares = this.ejercicio.contenido.pares || [];
        const columnaDerecha = [...pares.map(p => p.derecha)].sort(() => Math.random() - 0.5);
        
        return `
            <div class="ejercicio-emparejamiento">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Columna Izquierda -->
                    <div class="space-y-3">
                        <h5 class="font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            <i class="fas fa-arrow-right mr-2"></i>Conecta
                        </h5>
                        ${pares.map((par, index) => `
                            <div class="flex items-center gap-2">
                                <div class="flex-1 p-3 bg-blue-100 dark:bg-blue-900 rounded-lg border border-blue-300 dark:border-blue-700 text-gray-900 dark:text-white">
                                    ${par.izquierda}
                                </div>
                                <select 
                                    class="w-40 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    data-izquierda="${index}"
                                    data-ejercicio="${this.ejercicio.id}"
                                >
                                    <option value="">Selecciona...</option>
                                    ${columnaDerecha.map((derecha, idx) => `
                                        <option value="${idx}">${derecha}</option>
                                    `).join('')}
                                </select>
                            </div>
                        `).join('')}
                    </div>
                    
                    <!-- Columna Derecha (referencia) -->
                    <div class="space-y-3">
                        <h5 class="font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            <i class="fas fa-list mr-2"></i>Con
                        </h5>
                        ${columnaDerecha.map((derecha, index) => `
                            <div class="p-3 bg-green-100 dark:bg-green-900 rounded-lg border border-green-300 dark:border-green-700 text-gray-900 dark:text-white">
                                ${derecha}
                            </div>
                        `).join('')}
                    </div>
                </div>
                <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    <i class="fas fa-info-circle mr-1"></i>
                    Selecciona la opción correspondiente para cada elemento
                </p>
            </div>
        `;
    }

    /**
     * VERDADERO O FALSO
     */
    renderVerdaderoFalso() {
        const afirmaciones = this.ejercicio.contenido.afirmaciones || [];
        
        return `
            <div class="ejercicio-verdadero-falso space-y-4">
                ${afirmaciones.map((afirmacion, index) => `
                    <div class="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p class="font-medium text-gray-900 dark:text-white mb-3">
                            ${index + 1}. ${afirmacion}
                        </p>
                        <div class="flex gap-4">
                            <label class="flex items-center p-3 border-2 border-green-300 dark:border-green-700 rounded-lg cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors flex-1">
                                <input 
                                    type="radio" 
                                    name="vf-${this.ejercicio.id}-${index}" 
                                    value="true"
                                    class="mr-3 w-4 h-4"
                                    data-afirmacion="${index}"
                                >
                                <span class="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold">
                                    <i class="fas fa-check-circle"></i>
                                    Verdadero
                                </span>
                            </label>
                            <label class="flex items-center p-3 border-2 border-red-300 dark:border-red-700 rounded-lg cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-1">
                                <input 
                                    type="radio" 
                                    name="vf-${this.ejercicio.id}-${index}" 
                                    value="false"
                                    class="mr-3 w-4 h-4"
                                    data-afirmacion="${index}"
                                >
                                <span class="flex items-center gap-2 text-red-700 dark:text-red-400 font-semibold">
                                    <i class="fas fa-times-circle"></i>
                                    Falso
                                </span>
                            </label>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * ESCRITURA LIBRE
     */
    renderEscritura() {
        const instrucciones = this.ejercicio.contenido.instrucciones || '';
        const palabras_minimas = this.ejercicio.contenido.palabras_minimas || 50;
        
        return `
            <div class="ejercicio-escritura p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                    <p class="text-gray-700 dark:text-gray-300">
                        <i class="fas fa-pencil-alt mr-2"></i>
                        ${instrucciones}
                    </p>
                </div>
                
                <textarea 
                    class="w-full h-48 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Escribe tu respuesta aquí..."
                    data-ejercicio="${this.ejercicio.id}"
                    id="textarea-escritura-${this.ejercicio.id}"
                ></textarea>
                
                <div class="flex justify-between items-center mt-2 text-sm">
                    <span class="text-gray-500 dark:text-gray-400">
                        Mínimo de palabras: ${palabras_minimas}
                    </span>
                    <span id="contador-palabras-${this.ejercicio.id}" class="text-gray-600 dark:text-gray-400">
                        0 palabras
                    </span>
                </div>
            </div>
        `;
    }

    /**
     * TIPO NO SOPORTADO
     */
    renderNoSoportado(tipo) {
        return `
            <div class="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
                <p class="text-yellow-800 dark:text-yellow-300">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    Tipo de ejercicio no soportado: <strong>${tipo}</strong>
                </p>
            </div>
        `;
    }

    /**
     * RECOLECTAR RESPUESTAS DEL USUARIO
     */
    recolectarRespuestas() {
        const tipo = this.ejercicio.tipo;
        
        switch (tipo) {
            case 'seleccion_multiple':
                return this.recolectarSeleccionMultiple();
            case 'completar_espacios':
                return this.recolectarCompletarEspacios();
            case 'emparejamiento':
                return this.recolectarEmparejamiento();
            case 'verdadero_falso':
                return this.recolectarVerdaderoFalso();
            case 'escritura':
                return this.recolectarEscritura();
            default:
                return null;
        }
    }

    recolectarSeleccionMultiple() {
        const respuestas = [];
        const preguntas = this.ejercicio.contenido.preguntas || [];
        
        for (let i = 0; i < preguntas.length; i++) {
            const input = document.querySelector(`input[name="pregunta-${this.ejercicio.id}-${i}"]:checked`);
            respuestas.push(input ? parseInt(input.value) : null);
        }
        
        return { respuestas };
    }

    recolectarCompletarEspacios() {
        const inputs = document.querySelectorAll(`input[data-ejercicio="${this.ejercicio.id}"]`);
        const respuestas = Array.from(inputs).map(input => input.value.trim());
        
        return { respuestas };
    }

    recolectarEmparejamiento() {
        const selects = document.querySelectorAll(`select[data-ejercicio="${this.ejercicio.id}"]`);
        const respuestas = Array.from(selects).map(select => parseInt(select.value));
        
        return { respuestas };
    }

    recolectarVerdaderoFalso() {
        const afirmaciones = this.ejercicio.contenido.afirmaciones || [];
        const respuestas = [];
        
        for (let i = 0; i < afirmaciones.length; i++) {
            const input = document.querySelector(`input[name="vf-${this.ejercicio.id}-${i}"]:checked`);
            respuestas.push(input ? input.value === 'true' : null);
        }
        
        return { respuestas };
    }

    recolectarEscritura() {
        const textarea = document.getElementById(`textarea-escritura-${this.ejercicio.id}`);
        return { 
            texto: textarea ? textarea.value.trim() : '',
            palabras: textarea ? textarea.value.trim().split(/\s+/).length : 0
        };
    }

    /**
     * MOSTRAR RESULTADOS DESPUÉS DE VALIDAR
     */
    mostrarResultados(resultado) {
        const tipo = this.ejercicio.tipo;
        
        switch (tipo) {
            case 'seleccion_multiple':
                this.mostrarResultadosSeleccionMultiple(resultado);
                break;
            case 'completar_espacios':
                this.mostrarResultadosCompletarEspacios(resultado);
                break;
            case 'verdadero_falso':
                this.mostrarResultadosVerdaderoFalso(resultado);
                break;
            case 'emparejamiento':
                this.mostrarResultadosEmparejamiento(resultado);
                break;
            case 'escritura':
                this.mostrarResultadosEscritura(resultado);
                break;
        }
    }

    mostrarResultadosSeleccionMultiple(resultado) {
        // ✅ Manejar ambos formatos: nuevo y legacy  
        const correctas = resultado.correctas || 
                          resultado.data?.respuesta_correcta?.respuestas || 
                          resultado.respuesta_correcta?.respuestas || 
                          [];
        
        const preguntas = this.ejercicio.contenido.preguntas || [];
        
        preguntas.forEach((pregunta, index) => {
            const inputs = document.querySelectorAll(`input[name="pregunta-${this.ejercicio.id}-${index}"]`);
            inputs.forEach(input => {
                input.disabled = true;
                const label = input.closest('label');
                
                if (parseInt(input.value) === correctas[index]) {
                    label.classList.add('bg-green-100', 'border-green-500');
                    label.innerHTML += ' <i class="fas fa-check text-green-600 ml-2"></i>';
                } else if (input.checked) {
                    label.classList.add('bg-red-100', 'border-red-500');
                    label.innerHTML += ' <i class="fas fa-times text-red-600 ml-2"></i>';
                }
            });
        });
    }

    mostrarResultadosCompletarEspacios(resultado) {
        const inputs = document.querySelectorAll(`input[data-ejercicio="${this.ejercicio.id}"]`);
        
        // ✅ Manejar ambos formatos
        const correctas = resultado.correctas || 
                          resultado.data?.respuesta_correcta?.respuestas || 
                          resultado.respuesta_correcta?.respuestas || 
                          [];
        
        inputs.forEach((input, index) => {
            input.disabled = true;
            const esCorrecta = input.value.trim().toLowerCase() === correctas[index]?.toLowerCase();
            
            if (esCorrecta) {
                input.classList.add('border-green-500', 'bg-green-50');
            } else {
                input.classList.add('border-red-500', 'bg-red-50');
                input.placeholder = `Correcto: ${correctas[index]}`;
            }
        });
    }

    mostrarResultadosVerdaderoFalso(resultado) {
        // ✅ Manejar ambos formatos
        const correctas = resultado.correctas || 
                          resultado.data?.respuesta_correcta?.respuestas || 
                          resultado.respuesta_correcta?.respuestas || 
                          [];
        
        const afirmaciones = this.ejercicio.contenido.afirmaciones || [];
        
        afirmaciones.forEach((_, index) => {
            const inputs = document.querySelectorAll(`input[name="vf-${this.ejercicio.id}-${index}"]`);
            inputs.forEach(input => {
                input.disabled = true;
                const label = input.closest('label');
                const valorCorrecto = correctas[index];
                
                if ((input.value === 'true') === valorCorrecto) {
                    label.classList.add('bg-green-100', 'border-green-500');
                } else if (input.checked) {
                    label.classList.add('bg-red-100', 'border-red-500');
                }
            });
        });
    }

    mostrarResultadosEmparejamiento(resultado) {
        const selects = document.querySelectorAll(`select[data-ejercicio="${this.ejercicio.id}"]`);
        selects.forEach(select => {
            select.disabled = true;
        });
    }

    mostrarResultadosEscritura(resultado) {
        const textarea = document.getElementById(`textarea-escritura-${this.ejercicio.id}`);
        if (textarea) {
            textarea.disabled = true;
            textarea.classList.add('bg-gray-100', 'dark:bg-gray-700');
        }
    }

    /**
     * UTILIDADES
     */
    escaparHTML(texto) {
        const div = document.createElement('div');
        div.textContent = texto;
        return div.innerHTML;
    }
}

// Exportar globalmente para uso en leccion-activa.js
window.EjercicioRenderer = EjercicioRenderer;

// Inicializar contador de palabras para ejercicios de escritura
document.addEventListener('input', (e) => {
    if (e.target.matches('textarea[id^="textarea-escritura-"]')) {
        const id = e.target.id.replace('textarea-escritura-', '');
        const contador = document.getElementById(`contador-palabras-${id}`);
        if (contador) {
            const palabras = e.target.value.trim().split(/\s+/).filter(p => p.length > 0).length;
            contador.textContent = `${palabras} palabra${palabras !== 1 ? 's' : ''}`;
        }
    }
});

console.log('✅ EjercicioRenderer cargado correctamente');