// ============================================
// GLOBAL API HANDLER
// Single source of truth for all API calls
// ============================================

class APIHandler {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
        this.endpoints = API_CONFIG.ENDPOINTS;
    }

    // Get current auth token
    getToken() {
        return localStorage.getItem('accessToken');
    }

    // Get user role
    getUserRole() {
        return localStorage.getItem('userRole');
    }

    // ========================================
    // CORE REQUEST METHOD
    // ========================================
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = this.getToken();

        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers
        };

        // Auto-attach Authorization header if token exists
        if (token && !options.skipAuth) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers,
            mode: 'cors',
            credentials: 'include'
        };

        try {
            const response = await fetch(url, config);
            
            // Handle 401/403 - Unauthorized/Forbidden
            if (response.status === 401 || response.status === 403) {
                this.handleUnauthorized();
                throw new Error('Session expired or unauthorized access');
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Request failed with status ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    // Handle unauthorized access globally
    handleUnauthorized() {
        // Clear auth data
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userRole');
        
        // Show alert if available
        if (window.AlertUtil) {
            AlertUtil.showSessionExpired().then(() => {
                window.location.href = '/login.html';
            });
        } else {
            window.location.href = '/login.html';
        }
    }

    // ========================================
    // HTTP METHODS
    // ========================================
    async get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    async post(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }

    // ========================================
    // AUTHENTICATION METHODS
    // ========================================
    async login(email, password) {
        try {
            const response = await this.post(this.endpoints.AUTH.LOGIN, {
                email,
                password
            }, { skipAuth: true });

            return {
                success: true,
                data: response.data || response
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    async signup(userData) {
        try {
            const response = await this.post(this.endpoints.AUTH.SIGNUP, userData, { skipAuth: true });
            
            return {
                success: true,
                data: response.data || response
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    async logout() {
        try {
            await this.post(this.endpoints.AUTH.LOGOUT);
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            // Always clear local auth
            localStorage.removeItem('accessToken');
            localStorage.removeItem('userRole');
        }
    }
}

// Create singleton instance
const apiService = new APIHandler();

// Export globally - SINGLE SOURCE OF TRUTH
window.apiService = apiService;
