// frontend/public/js/auth.js - Clase de utilidades de autenticación
class AuthService {
  constructor(config) {
    this.config = config;
  }

  async login(credentials) {
    try {
      const response = await axios.post(
        this.config.getApiUrl(this.config.config.ENDPOINTS.AUTH.LOGIN),
        credentials
      );

      if (response.data.access_token) {
        this.config.setToken(response.data.access_token);
        this.config.setUser(response.data.usuario);
        
        this.config.log('info', 'Login exitoso', { user: response.data.usuario.correo });
        return response.data;
      }
    } catch (error) {
      this.config.log('error', 'Error en login', error.response?.data);
      throw error;
    }
  }

  async register(userData) {
    try {
      const response = await axios.post(
        this.config.getApiUrl(this.config.config.ENDPOINTS.AUTH.REGISTER),
        userData
      );

      this.config.log('info', 'Registro exitoso', { user_id: response.data.usuario_id });
      return response.data;
    } catch (error) {
      this.config.log('error', 'Error en registro', error.response?.data);
      throw error;
    }
  }

  async verifyEmail(email, code) {
    try {
      const response = await axios.post(
        this.config.getApiUrl(this.config.config.ENDPOINTS.AUTH.VERIFY_EMAIL),
        { correo: email, codigo: code }
      );

      this.config.log('info', 'Email verificado', { email });
      return response.data;
    } catch (error) {
      this.config.log('error', 'Error verificando email', error.response?.data);
      throw error;
    }
  }

  logout() {
    this.config.removeToken();
    this.config.log('info', 'Usuario cerró sesión');
    window.location.href = `${this.config.config.FRONTEND_URL}/login.html`;
  }

  // Verificar autenticación y redirigir si es necesario
  requireAuth(redirectTo = '/login.html') {
    if (!this.config.isAuthenticated()) {
      window.location.href = `${this.config.config.FRONTEND_URL}${redirectTo}`;
      return false;
    }
    return true;
  }

  // Verificar si ya está autenticado y redirigir al dashboard
  requireGuest(redirectTo = '/dashboard.html') {
    if (this.config.isAuthenticated()) {
      window.location.href = `${this.config.config.FRONTEND_URL}${redirectTo}`;
      return false;
    }
    return true;
  }
}

// Instancia global del servicio de autenticación
const authService = new AuthService(CONFIG);