// Centralized API Handler
// All API requests go through this single module

class APIHandler {
    constructor() {
        this.baseURL = 'http://localhost:5000';
        this.endpoints = {
            auth: {
                signup: '/api/v1/auth/signup',
                login: '/api/v1/auth/login',
                logout: '/api/v1/auth/logout'
            },
            users: '/api/v1/users',
            resumes: '/api/v1/resumes',
            jobs: '/api/v1/jobs',
            applications: '/api/v1/applications',
            templates: '/api/v1/templates',
            subscriptions: '/api/v1/subscriptions'
        };
    }

    // ========================================
    // CORE REQUEST METHOD
    // ========================================

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        // Build headers
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers
        };

        // Add auth token if available and not skipped
        if (!options.skipAuth && window.authManager) {
            const token = authManager.getToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        // Build config
        const config = {
            method: options.method || 'GET',
            headers,
            mode: 'cors',
            credentials: 'include',
            ...options
        };

        // Add body if present
        if (options.body) {
            config.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(url, config);
            
            // Handle different status codes
            if (response.status === 401) {
                return this.handleUnauthorized();
            }

            if (response.status === 403) {
                return this.handleForbidden();
            }

            if (!response.ok) {
                return this.handleError(response);
            }

            // Parse and return successful response
            const data = await response.json();
            return data;

        } catch (error) {
            return this.handleNetworkError(error);
        }
    }

    // ========================================
    // ERROR HANDLERS
    // ========================================

    handleUnauthorized() {
        console.error('Unauthorized: Session expired or invalid token');
        
        // Clear auth data
        if (window.authManager) {
            authManager.clearAuth();
        }

        // Show session expired alert
        if (window.AlertUtil) {
            AlertUtil.showSessionExpired().then(() => {
                window.location.href = '/login.html';
            });
        } else {
            alert('Your session has expired. Please login again.');
            window.location.href = '/login.html';
        }

        throw new Error('Unauthorized');
    }

    handleForbidden() {
        console.error('Forbidden: Access denied');
        
        if (window.AlertUtil) {
            AlertUtil.showUnauthorized().then(() => {
                // Redirect based on role
                if (window.authManager) {
                    const role = authManager.getUserRole();
                    if (role === 'admin') {
                        window.location.href = '/admin/admin-layout.html';
                    } else {
                        window.location.href = '/user-dashboard.html';
                    }
                } else {
                    window.location.href = '/index.html';
                }
            });
        } else {
            alert('Access denied. You do not have permission.');
            window.location.href = '/index.html';
        }

        throw new Error('Forbidden');
    }

    async handleError(response) {
        try {
            const errorData = await response.json();
            const errorMessage = errorData.message || `Request failed with status ${response.status}`;
            
            if (window.AlertUtil) {
                AlertUtil.showError(errorMessage);
            }
            
            throw new Error(errorMessage);
        } catch (parseError) {
            const errorMessage = `Request failed with status ${response.status}`;
            
            if (window.AlertUtil) {
                AlertUtil.showError(errorMessage);
            }
            
            throw new Error(errorMessage);
        }
    }

    handleNetworkError(error) {
        console.error('Network error:', error);
        
        let errorMessage = 'Network error. Please check your connection.';
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = 'Cannot connect to server. Please ensure the backend is running.';
        }
        
        if (window.AlertUtil) {
            AlertUtil.showError(errorMessage);
        } else {
            alert(errorMessage);
        }
        
        throw new Error(errorMessage);
    }

    // ========================================
    // HTTP METHODS
    // ========================================

    async get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    async post(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'POST', body });
    }

    async put(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'PUT', body });
    }

    async patch(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'PATCH', body });
    }

    async delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }

    // ========================================
    // CONVENIENCE METHODS FOR COMMON APIS
    // ========================================

    // Auth APIs
    async login(email, password) {
        return this.post(this.endpoints.auth.login, { email, password }, { skipAuth: true });
    }

    async signup(userData) {
        return this.post(this.endpoints.auth.signup, userData, { skipAuth: true });
    }

    async logout() {
        return this.post(this.endpoints.auth.logout);
    }

    // User APIs
    async getUsers() {
        return this.get(this.endpoints.users);
    }

    async getUser(id) {
        return this.get(`${this.endpoints.users}/${id}`);
    }

    async updateUser(id, data) {
        return this.put(`${this.endpoints.users}/${id}`, data);
    }

    async deleteUser(id) {
        return this.delete(`${this.endpoints.users}/${id}`);
    }

    // Resume APIs
    async getResumes() {
        return this.get(this.endpoints.resumes);
    }

    async getResume(id) {
        return this.get(`${this.endpoints.resumes}/${id}`);
    }

    async createResume(data) {
        return this.post(this.endpoints.resumes, data);
    }

    async updateResume(id, data) {
        return this.put(`${this.endpoints.resumes}/${id}`, data);
    }

    async deleteResume(id) {
        return this.delete(`${this.endpoints.resumes}/${id}`);
    }
}

// Create singleton instance
const apiHandler = new APIHandler();

// Export for use in other modules
window.apiHandler = apiHandler;
