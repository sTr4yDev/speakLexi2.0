/**
 * EjercicioRenderer - Renderiza todos los tipos de ejercicios
 * ✅ CORREGIDO: Soporta tipos en español E inglés
 * ✅ MEJORADO: Maneja casos de opciones vacías y ejercicios incompletos
 */
class EjercicioRenderer {
    constructor(ejercicio, contenedor) {
        this.ejercicio = ejercicio;
        this.contenedor = contenedor;
        this.respuestasUsuario = {};
        
        // ✅ Mapeo de tipos para compatibilidad
        this.mapeoTipos = {
            // Español → Interno (mantener español para compatibilidad)
            'seleccion_multiple': 'seleccion_multiple',
            'verdadero_falso': 'verdadero_falso', 
            'completar_espacios': 'completar_espacios',
            'emparejamiento': 'emparejamiento',
            'escritura': 'escritura',
            
            // Inglés → Español (para backend que envía inglés)
            'multiple_choice': 'seleccion_multiple',
            'true_false': 'verdadero_falso',
            'fill_blank': 'completar_espacios',
            'matching': 'emparejamiento',
            'writing': 'escritura'
        };
        
        console.log(`🎯 EjercicioRenderer inicializado:`, {
            tipo_original: ejercicio.tipo,
            tipo_mapeado: this.obtenerTipoMapeado(),
            ejercicio_id: ejercicio.id
        });
    }

    /**
     * Obtener tipo mapeado para compatibilidad
     */
    obtenerTipoMapeado() {
        const tipoOriginal = this.ejercicio.tipo;
        const tipoMapeado = this.mapeoTipos[tipoOriginal] || tipoOriginal;
        
        if (tipoOriginal !== tipoMapeado) {
            console.log(`🔄 Mapeando tipo: "${tipoOriginal}" → "${tipoMapeado}"`);
        }
        
        return tipoMapeado;
    }

    /**
     * Método principal para renderizar el ejercicio
     */
    renderizar() {
        const tipo = this.obtenerTipoMapeado();
        
        console.log(`🎨 Renderizando ejercicio tipo: ${tipo}`);
        
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
     * ✅ CORREGIDO: Maneja tanto 'preguntas' como 'pregunta' individual
     * ✅ MEJORADO: Maneja casos de opciones vacías con mensajes informativos
     */
    renderSeleccionMultiple() {
        // ✅ COMPATIBILIDAD: Manejar diferentes estructuras de contenido
        let preguntas = [];
        
        if (this.ejercicio.contenido.preguntas && Array.isArray(this.ejercicio.contenido.preguntas)) {
            // Estructura con array de preguntas
            preguntas = this.ejercicio.contenido.preguntas;
        } else if (this.ejercicio.contenido.pregunta) {
            // Estructura con pregunta única
            preguntas = [{
                pregunta: this.ejercicio.contenido.pregunta,
                opciones: this.ejercicio.contenido.opciones || []
            }];
        } else {
            // Fallback: usar título como pregunta
            preguntas = [{
                pregunta: this.ejercicio.titulo || "Selecciona la opción correcta",
                opciones: this.ejercicio.contenido.opciones || []
            }];
        }
        
        console.log(`📝 Selección múltiple: ${preguntas.length} pregunta(s)`, preguntas);

        // ✅ NUEVO: Verificar si hay opciones en alguna pregunta
        const tieneOpciones = preguntas.some(p => p.opciones && p.opciones.length > 0);
        
        if (!tieneOpciones) {
            return `
                <div class="ejercicio-seleccion-multiple">
                    <div class="p-6 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-600 rounded-lg">
                        <div class="flex items-center gap-4">
                            <div class="text-3xl">⚠️</div>
                            <div>
                                <h3 class="text-lg font-bold text-yellow-800 dark:text-yellow-300">
                                    Ejercicio Incompleto
                                </h3>
                                <p class="text-yellow-700 dark:text-yellow-400 mt-1">
                                    Esta pregunta de selección múltiple no tiene opciones definidas.
                                </p>
                                <p class="text-sm text-yellow-600 dark:text-yellow-500 mt-2">
                                    <strong>Pregunta:</strong> ${preguntas[0]?.pregunta || 'Sin título'}
                                </p>
                                <div class="mt-3 p-3 bg-white dark:bg-gray-800 rounded border">
                                    <p class="text-sm text-gray-600 dark:text-gray-400">
                                        <strong>Para el profesor:</strong> Edita esta lección y agrega opciones a la pregunta.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="ejercicio-seleccion-multiple">
                ${preguntas.map((pregunta, index) => {
                    const opciones = pregunta.opciones || [];
                    const tieneOpcionesEstaPregunta = opciones.length > 0;
                    
                    if (!tieneOpcionesEstaPregunta) {
                        return `
                            <div class="ejercicio-pregunta mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-300 dark:border-yellow-600">
                                <h4 class="font-semibold text-lg mb-2 text-yellow-800 dark:text-yellow-300">
                                    <span class="inline-block w-8 h-8 bg-yellow-500 text-white rounded-full text-center leading-8 mr-2">
                                        ${index + 1}
                                    </span>
                                    ${pregunta.pregunta || "Pregunta sin opciones"}
                                </h4>
                                <p class="text-yellow-700 dark:text-yellow-400">
                                    <i class="fas fa-exclamation-triangle mr-2"></i>
                                    Esta pregunta no tiene opciones definidas.
                                </p>
                            </div>
                        `;
                    }
                    
                    return `
                        <div class="ejercicio-pregunta mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <h4 class="font-semibold text-lg mb-4 text-gray-900 dark:text-white">
                                <span class="inline-block w-8 h-8 bg-blue-500 text-white rounded-full text-center leading-8 mr-2">
                                    ${index + 1}
                                </span>
                                ${pregunta.pregunta || "Selecciona la opción correcta"}
                            </h4>
                            <div class="space-y-2 ml-10">
                                ${opciones.map((opcion, optIndex) => {
                                    // ✅ COMPATIBILIDAD: Manejar opciones como strings u objetos
                                    const textoOpcion = typeof opcion === 'string' ? opcion : 
                                                       opcion.texto || opcion.opcion || `Opción ${optIndex + 1}`;
                                    
                                    return `
                                    <label class="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors group">
                                        <input 
                                            type="radio" 
                                            name="pregunta-${this.ejercicio.id}-${index}" 
                                            value="${optIndex}"
                                            class="mr-3 w-4 h-4 text-blue-600"
                                            data-pregunta="${index}"
                                        >
                                        <span class="text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-400">
                                            ${textoOpcion}
                                        </span>
                                    </label>
                                `}).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    /**
     * COMPLETAR ESPACIOS
     * ✅ CORREGIDO: Maneja diferentes nombres de propiedades
     * ✅ MEJORADO: Maneja casos sin texto o espacios definidos
     */
    renderCompletarEspacios() {
        // ✅ COMPATIBILIDAD: Manejar diferentes nombres de propiedades
        const texto = this.ejercicio.contenido.texto || "";
        const espacios = this.ejercicio.contenido.espacios || this.ejercicio.contenido.palabras_faltantes || [];
        
        console.log(`📝 Completar espacios: ${espacios.length} espacios`, { texto, espacios });

        // ✅ NUEVO: Verificar si hay contenido para renderizar
        if (!texto && espacios.length === 0) {
            return `
                <div class="ejercicio-completar-espacios p-6 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-600 rounded-lg">
                    <div class="flex items-center gap-4">
                        <div class="text-3xl">⚠️</div>
                        <div>
                            <h3 class="text-lg font-bold text-yellow-800 dark:text-yellow-300">
                                Ejercicio Incompleto
                            </h3>
                            <p class="text-yellow-700 dark:text-yellow-400 mt-1">
                                Este ejercicio de completar espacios no tiene contenido definido.
                            </p>
                            <div class="mt-3 p-3 bg-white dark:bg-gray-800 rounded border">
                                <p class="text-sm text-gray-600 dark:text-gray-400">
                                    <strong>Para el profesor:</strong> Edita esta lección y agrega el texto con espacios.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Si no hay texto con espacios, crear uno básico
        let textoParaRender = texto;
        if (!textoParaRender && espacios.length > 0) {
            textoParaRender = "Completa los espacios en blanco: " + 
                espacios.map((_, i) => `${i > 0 ? ' ' : ''}___`).join(' ');
        }
        
        const partes = textoParaRender.split('___');
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
     * ✅ CORREGIDO: Maneja diferentes estructuras de pares
     * ✅ MEJORADO: Maneja casos sin pares definidos
     */
    renderEmparejamiento() {
        // ✅ COMPATIBILIDAD: Manejar diferentes estructuras
        let pares = this.ejercicio.contenido.pares || [];
        
        // Si no hay pares, intentar crear desde arrays separados
        if (!pares.length && this.ejercicio.contenido.izquierda && this.ejercicio.contenido.derecha) {
            const izquierda = this.ejercicio.contenido.izquierda;
            const derecha = this.ejercicio.contenido.derecha;
            pares = izquierda.map((izq, index) => ({
                izquierda: izq,
                derecha: derecha[index] || `Opción ${index + 1}`
            }));
        }
        
        console.log(`📝 Emparejamiento: ${pares.length} pares`, pares);

        // ✅ NUEVO: Verificar si hay pares para renderizar
        if (pares.length === 0) {
            return `
                <div class="ejercicio-emparejamiento p-6 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-600 rounded-lg">
                    <div class="flex items-center gap-4">
                        <div class="text-3xl">⚠️</div>
                        <div>
                            <h3 class="text-lg font-bold text-yellow-800 dark:text-yellow-300">
                                Ejercicio Incompleto
                            </h3>
                            <p class="text-yellow-700 dark:text-yellow-400 mt-1">
                                Este ejercicio de emparejamiento no tiene elementos para emparejar.
                            </p>
                            <div class="mt-3 p-3 bg-white dark:bg-gray-800 rounded border">
                                <p class="text-sm text-gray-600 dark:text-gray-400">
                                    <strong>Para el profesor:</strong> Edita esta lección y agrega los pares de elementos.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

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
     * ✅ CORREGIDO: Maneja diferentes estructuras de afirmaciones
     * ✅ MEJORADO: Maneja casos sin afirmaciones definidas
     */
    renderVerdaderoFalso() {
        // ✅ COMPATIBILIDAD: Manejar diferentes estructuras
        let afirmaciones = [];
        
        if (this.ejercicio.contenido.afirmaciones && Array.isArray(this.ejercicio.contenido.afirmaciones)) {
            afirmaciones = this.ejercicio.contenido.afirmaciones;
        } else if (this.ejercicio.contenido.afirmacion) {
            afirmaciones = [this.ejercicio.contenido.afirmacion];
        } else {
            afirmaciones = [this.ejercicio.titulo || "Indica si es verdadero o falso"];
        }
        
        console.log(`📝 Verdadero/Falso: ${afirmaciones.length} afirmación(es)`, afirmaciones);

        // ✅ NUEVO: Verificar si hay afirmaciones para renderizar
        if (afirmaciones.length === 0) {
            return `
                <div class="ejercicio-verdadero-falso p-6 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-600 rounded-lg">
                    <div class="flex items-center gap-4">
                        <div class="text-3xl">⚠️</div>
                        <div>
                            <h3 class="text-lg font-bold text-yellow-800 dark:text-yellow-300">
                                Ejercicio Incompleto
                            </h3>
                            <p class="text-yellow-700 dark:text-yellow-400 mt-1">
                                Este ejercicio de verdadero/falso no tiene afirmaciones definidas.
                            </p>
                            <div class="mt-3 p-3 bg-white dark:bg-gray-800 rounded border">
                                <p class="text-sm text-gray-600 dark:text-gray-400">
                                    <strong>Para el profesor:</strong> Edita esta lección y agrega las afirmaciones.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="ejercicio-verdadero-falso space-y-4">
                ${afirmaciones.map((afirmacion, index) => {
                    // ✅ COMPATIBILIDAD: Manejar afirmaciones como strings u objetos
                    const textoAfirmacion = typeof afirmacion === 'string' ? afirmacion : 
                                          afirmacion.texto || afirmacion.afirmacion || `Afirmación ${index + 1}`;
                    
                    return `
                    <div class="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p class="font-medium text-gray-900 dark:text-white mb-3">
                            ${index + 1}. ${textoAfirmacion}
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
                `}).join('')}
            </div>
        `;
    }

    /**
     * ESCRITURA LIBRE
     * ✅ CORREGIDO: Maneja diferentes nombres de propiedades
     * ✅ MEJORADO: Maneja casos sin instrucciones definidas
     */
    renderEscritura() {
        // ✅ COMPATIBILIDAD: Manejar diferentes nombres de propiedades
        const instrucciones = this.ejercicio.contenido.instrucciones || 
                             this.ejercicio.contenido.consigna || 
                             this.ejercicio.titulo || 
                             "Escribe tu respuesta";
        const palabras_minimas = this.ejercicio.contenido.palabras_minimas || 
                               this.ejercicio.contenido.minWords || 
                               50;
        
        console.log(`📝 Escritura: "${instrucciones}" (mín. ${palabras_minimas} palabras)`);

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
        console.error(`❌ Tipo no soportado: ${tipo}`, this.ejercicio);
        
        return `
            <div class="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
                <p class="text-yellow-800 dark:text-yellow-300">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    Tipo de ejercicio no soportado: <strong>${tipo}</strong>
                </p>
                <p class="text-sm mt-2">
                    Ejercicio ID: ${this.ejercicio.id}<br>
                    Tipos soportados: seleccion_multiple, completar_espacios, emparejamiento, verdadero_falso, escritura
                </p>
                <div class="mt-3 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                    <strong>Datos del ejercicio:</strong><br>
                    <pre>${JSON.stringify(this.ejercicio, null, 2)}</pre>
                </div>
            </div>
        `;
    }

    /**
     * RECOLECTAR RESPUESTAS DEL USUARIO
     */
    recolectarRespuestas() {
        const tipo = this.obtenerTipoMapeado();
        
        console.log(`📤 Recolectando respuestas para tipo: ${tipo}`);
        
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
                console.error(`❌ No se puede recolectar respuestas para tipo: ${tipo}`);
                return null;
        }
    }

    recolectarSeleccionMultiple() {
        const respuestas = [];
        let preguntas = [];
        
        // ✅ Misma lógica de compatibilidad que en render
        if (this.ejercicio.contenido.preguntas && Array.isArray(this.ejercicio.contenido.preguntas)) {
            preguntas = this.ejercicio.contenido.preguntas;
        } else {
            preguntas = [this.ejercicio.contenido];
        }
        
        for (let i = 0; i < preguntas.length; i++) {
            const input = document.querySelector(`input[name="pregunta-${this.ejercicio.id}-${i}"]:checked`);
            respuestas.push(input ? parseInt(input.value) : null);
        }
        
        console.log(`📤 Respuestas selección múltiple:`, respuestas);
        return { respuestas };
    }

    recolectarCompletarEspacios() {
        const inputs = document.querySelectorAll(`input[data-ejercicio="${this.ejercicio.id}"]`);
        const respuestas = Array.from(inputs).map(input => input.value.trim());
        
        console.log(`📤 Respuestas completar espacios:`, respuestas);
        return { respuestas };
    }

    recolectarEmparejamiento() {
        const selects = document.querySelectorAll(`select[data-ejercicio="${this.ejercicio.id}"]`);
        const respuestas = Array.from(selects).map(select => parseInt(select.value));
        
        console.log(`📤 Respuestas emparejamiento:`, respuestas);
        return { respuestas };
    }

    recolectarVerdaderoFalso() {
        let afirmaciones = [];
        
        if (this.ejercicio.contenido.afirmaciones && Array.isArray(this.ejercicio.contenido.afirmaciones)) {
            afirmaciones = this.ejercicio.contenido.afirmaciones;
        } else {
            afirmaciones = [this.ejercicio.contenido];
        }
        
        const respuestas = [];
        
        for (let i = 0; i < afirmaciones.length; i++) {
            const input = document.querySelector(`input[name="vf-${this.ejercicio.id}-${i}"]:checked`);
            respuestas.push(input ? input.value === 'true' : null);
        }
        
        console.log(`📤 Respuestas verdadero/falso:`, respuestas);
        return { respuestas };
    }

    recolectarEscritura() {
        const textarea = document.getElementById(`textarea-escritura-${this.ejercicio.id}`);
        const texto = textarea ? textarea.value.trim() : '';
        const palabras = texto ? texto.split(/\s+/).filter(p => p.length > 0).length : 0;
        
        console.log(`📤 Respuesta escritura: ${palabras} palabras`);
        return { 
            texto: texto,
            palabras: palabras
        };
    }

    /**
     * MOSTRAR RESULTADOS DESPUÉS DE VALIDAR
     */
    mostrarResultados(resultado) {
        const tipo = this.obtenerTipoMapeado();
        
        console.log(`🎯 Mostrando resultados para tipo: ${tipo}`, resultado);
        
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
            default:
                console.error(`❌ No se puede mostrar resultados para tipo: ${tipo}`);
        }
    }

    mostrarResultadosSeleccionMultiple(resultado) {
        // ✅ Manejar ambos formatos: nuevo y legacy  
        const correctas = resultado.correctas || 
                          resultado.data?.respuesta_correcta?.respuestas || 
                          resultado.respuesta_correcta?.respuestas || 
                          [];
        
        let preguntas = [];
        if (this.ejercicio.contenido.preguntas && Array.isArray(this.ejercicio.contenido.preguntas)) {
            preguntas = this.ejercicio.contenido.preguntas;
        } else {
            preguntas = [this.ejercicio.contenido];
        }
        
        preguntas.forEach((pregunta, index) => {
            const inputs = document.querySelectorAll(`input[name="pregunta-${this.ejercicio.id}-${index}"]`);
            inputs.forEach(input => {
                input.disabled = true;
                const label = input.closest('label');
                
                if (parseInt(input.value) === correctas[index]) {
                    label.classList.add('bg-green-100', 'dark:bg-green-900/20', 'border-green-500');
                    label.innerHTML += ' <i class="fas fa-check text-green-600 ml-2"></i>';
                } else if (input.checked) {
                    label.classList.add('bg-red-100', 'dark:bg-red-900/20', 'border-red-500');
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
            const esCorrecta = input.value.trim().toLowerCase() === (correctas[index]?.toLowerCase() || '');
            
            if (esCorrecta) {
                input.classList.add('border-green-500', 'bg-green-50', 'dark:bg-green-900/20');
            } else {
                input.classList.add('border-red-500', 'bg-red-50', 'dark:bg-red-900/20');
                // Mostrar respuesta correcta
                const correctoSpan = document.createElement('span');
                correctoSpan.className = 'text-green-600 dark:text-green-400 text-sm ml-2';
                correctoSpan.textContent = `Correcto: ${correctas[index]}`;
                input.parentNode.appendChild(correctoSpan);
            }
        });
    }

    mostrarResultadosVerdaderoFalso(resultado) {
        // ✅ Manejar ambos formatos
        const correctas = resultado.correctas || 
                          resultado.data?.respuesta_correcta?.respuestas || 
                          resultado.respuesta_correcta?.respuestas || 
                          [];
        
        let afirmaciones = [];
        if (this.ejercicio.contenido.afirmaciones && Array.isArray(this.ejercicio.contenido.afirmaciones)) {
            afirmaciones = this.ejercicio.contenido.afirmaciones;
        } else {
            afirmaciones = [this.ejercicio.contenido];
        }
        
        afirmaciones.forEach((_, index) => {
            const inputs = document.querySelectorAll(`input[name="vf-${this.ejercicio.id}-${index}"]`);
            inputs.forEach(input => {
                input.disabled = true;
                const label = input.closest('label');
                const valorCorrecto = correctas[index];
                
                if ((input.value === 'true') === valorCorrecto) {
                    label.classList.add('bg-green-100', 'dark:bg-green-900/20', 'border-green-500');
                } else if (input.checked) {
                    label.classList.add('bg-red-100', 'dark:bg-red-900/20', 'border-red-500');
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
        if (!texto) return '';
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

console.log('✅ EjercicioRenderer cargado correctamente - Compatibilidad mejorada');