// frontend/public/js/config.js
class AppConfig {
  constructor() {
    this.ENV = this.getEnvironment();
    this.config = this.loadConfig();
    this.init();
  }

  // Detectar ambiente
  getEnvironment() {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    } else if (hostname.includes('staging')) {
      return 'staging';
    } else {
      return 'production';
    }
  }

  // Cargar configuración según el ambiente
  loadConfig() {
    const baseConfig = {
      development: {
        API_URL: 'http://localhost:5000/api',
        FRONTEND_URL: 'http://localhost:3000',
        DEBUG: true,
        LOG_LEVEL: 'debug'
      },
      staging: {
        API_URL: 'https://api.staging.speaklexi.com/api',
        FRONTEND_URL: 'https://staging.speaklexi.com',
        DEBUG: true,
        LOG_LEVEL: 'info'
      },
      production: {
        API_URL: 'https://api.speaklexi.com/api',
        FRONTEND_URL: 'https://speaklexi.com',
        DEBUG: false,
        LOG_LEVEL: 'error'
      }
    };

    return {
      ...baseConfig[this.ENV],
      // Configuración común a todos los ambientes
      TOKEN_KEY: 'speaklexi_token',
      USER_KEY: 'speaklexi_user',
      THEME_KEY: 'speaklexi_theme',
      LANGUAGE_KEY: 'speaklexi_language',
      
      // Tiempos de expiración (en milisegundos)
      TIMEOUTS: {
        API_REQUEST: 30000,
        TOKEN_REFRESH: 300000, // 5 minutos
        SESSION_EXPIRY: 24 * 60 * 60 * 1000 // 24 horas
      },

      // Endpoints de la API
      ENDPOINTS: {
        AUTH: {
          LOGIN: '/auth/login',
          REGISTER: '/auth/registro',
          VERIFY_EMAIL: '/auth/verificar-email',
          RESEND_CODE: '/auth/reenviar-codigo',
          FORGOT_PASSWORD: '/auth/recuperar-password',
          RESET_PASSWORD: '/auth/reset-password',
          LOGOUT: '/auth/logout',
          REFRESH_TOKEN: '/auth/refresh-token'
        },
        USER: {
          PROFILE: '/users/perfil',
          UPDATE_PROFILE: '/users/perfil',
          CHANGE_PASSWORD: '/users/cambiar-password',
          UPLOAD_AVATAR: '/users/avatar'
        },
        LESSONS: {
          LIST: '/lessons',
          PROGRESS: '/progress',
          COMPLETE: '/lessons/completar'
        }
      },

      // Configuración de UI
      UI: {
        DEFAULT_LANGUAGE: 'es',
        SUPPORTED_LANGUAGES: ['es', 'en'],
        THEMES: ['light', 'dark', 'auto'],
        DEFAULT_THEME: 'light'
      },

      // Configuración de notificaciones
      NOTIFICATIONS: {
        AUTO_HIDE: true,
        DEFAULT_DURATION: 5000,
        POSITION: 'top-right'
      }
    };
  }

  // Inicializar configuración
  init() {
    this.setupInterceptors();
    this.validateConfig();
    this.setupErrorHandling();
  }

  // Configurar interceptors para las peticiones
  setupInterceptors() {
    // Interceptor para agregar token a las peticiones
    if (typeof axios !== 'undefined') {
      axios.interceptors.request.use(
        (config) => {
          const token = this.getToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          
          config.baseURL = this.config.API_URL;
          config.timeout = this.config.TIMEOUTS.API_REQUEST;
          
          return config;
        },
        (error) => {
          return Promise.reject(error);
        }
      );

      // Interceptor para manejar respuestas
      axios.interceptors.response.use(
        (response) => response,
        (error) => {
          this.handleApiError(error);
          return Promise.reject(error);
        }
      );
    }
  }

  // Validar configuración crítica
  validateConfig() {
    const required = ['API_URL', 'FRONTEND_URL'];
    const missing = required.filter(key => !this.config[key]);
    
    if (missing.length > 0) {
      console.error('❌ Configuración faltante:', missing);
      throw new Error(`Configuración incompleta: ${missing.join(', ')}`);
    }
  }

  // Manejo centralizado de errores
  setupErrorHandling() {
    window.addEventListener('error', (event) => {
      this.log('error', `Error no capturado: ${event.error}`, event);
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.log('error', `Promesa rechazada no manejada: ${event.reason}`, event);
    });
  }

  // Métodos de utilidad
  getToken() {
    return localStorage.getItem(this.config.TOKEN_KEY);
  }

  setToken(token) {
    localStorage.setItem(this.config.TOKEN_KEY, token);
  }

  removeToken() {
    localStorage.removeItem(this.config.TOKEN_KEY);
    localStorage.removeItem(this.config.USER_KEY);
  }

  getUser() {
    const userStr = localStorage.getItem(this.config.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  setUser(user) {
    localStorage.setItem(this.config.USER_KEY, JSON.stringify(user));
  }

  // Logger configurado
  log(level, message, data = null) {
    if (!this.config.DEBUG && level === 'debug') return;

    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;

    switch (level) {
      case 'error':
        console.error(logMessage, data);
        break;
      case 'warn':
        console.warn(logMessage, data);
        break;
      case 'info':
        console.info(logMessage, data);
        break;
      case 'debug':
        console.debug(logMessage, data);
        break;
      default:
        console.log(logMessage, data);
    }
  }

  // Manejo de errores de API
  handleApiError(error) {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          this.removeToken();
          window.location.href = `${this.config.FRONTEND_URL}/login.html`;
          break;
        case 403:
          this.log('warn', 'Acceso denegado', data);
          break;
        case 429:
          this.log('warn', 'Demasiadas peticiones', data);
          break;
        case 500:
          this.log('error', 'Error interno del servidor', data);
          break;
        default:
          this.log('error', `Error HTTP ${status}`, data);
      }
    } else if (error.request) {
      this.log('error', 'Error de conexión con el servidor');
    } else {
      this.log('error', 'Error inesperado', error.message);
    }
  }

  // Verificar si el usuario está autenticado
  isAuthenticated() {
    const token = this.getToken();
    const user = this.getUser();
    
    if (!token || !user) return false;

    try {
      // Verificar expiración básica del token (sin decodificar JWT completo)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  // Obtener URL completa del endpoint
  getApiUrl(endpoint) {
    return `${this.config.API_URL}${endpoint}`;
  }

  // Obtener configuración pública de la API
  async loadServerConfig() {
    try {
      const response = await fetch(this.getApiUrl('/auth/config'));
      const serverConfig = await response.json();
      
      // Fusionar configuración del servidor con la local
      this.config.server = serverConfig;
      
      this.log('info', 'Configuración del servidor cargada', serverConfig);
    } catch (error) {
      this.log('warn', 'No se pudo cargar la configuración del servidor', error);
    }
  }
}

// Instancia global de configuración
const CONFIG = new AppConfig();

// Hacer disponible globalmente (solo en desarrollo)
if (window && process.env.NODE_ENV === 'development') {
  window.APP_CONFIG = CONFIG;
}

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}