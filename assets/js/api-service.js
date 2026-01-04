// API Service - Handles all HTTP requests
class APIService {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
    }

    // Get auth token
    getToken() {
        return localStorage.getItem(API_CONFIG.TOKEN_KEY);
    }

    // Get refresh token
    getRefreshToken() {
        return localStorage.getItem(API_CONFIG.REFRESH_TOKEN_KEY);
    }

    // Set tokens
    setTokens(accessToken, refreshToken) {
        localStorage.setItem(API_CONFIG.TOKEN_KEY, accessToken);
        if (refreshToken) {
            localStorage.setItem(API_CONFIG.REFRESH_TOKEN_KEY, refreshToken);
        }
    }

    // Clear tokens
    clearTokens() {
        localStorage.removeItem(API_CONFIG.TOKEN_KEY);
        localStorage.removeItem(API_CONFIG.REFRESH_TOKEN_KEY);
        localStorage.removeItem(API_CONFIG.USER_KEY);
    }

    // Make HTTP request
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = this.getToken();

        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers
        };

        // Add auth token if available
        if (token && !options.skipAuth) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers,
            mode: 'cors', // Explicitly set CORS mode
            credentials: 'include' // Include cookies for authentication
        };

        try {
            const response = await fetch(url, config);
            
            // Check if response is ok before parsing JSON
            if (!response.ok) {
                // Handle 401 Unauthorized
                if (response.status === 401) {
                    this.clearTokens();
                    if (window.location.pathname !== '/login.html' && window.location.pathname !== '/register.html') {
                        window.location.href = 'login.html';
                    }
                    throw new Error('Session expired. Please login again.');
                }
                
                // Try to parse error response
                try {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Request failed with status ${response.status}`);
                } catch (parseError) {
                    throw new Error(`Request failed with status ${response.status}`);
                }
            }

            const data = await response.json();
            return data;
        } catch (error) {
            // Handle CORS errors specifically
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                console.error('CORS Error: Make sure your backend allows requests from this origin');
                throw new Error('Cannot connect to server. Please check if the backend is running and CORS is configured correctly.');
            }
            
            console.error('API Request Error:', error);
            throw error;
        }
    }

    // Test CORS connection
    async testConnection() {
        try {
            const response = await this.get(API_CONFIG.ENDPOINTS.AUTH.TEST, { skipAuth: true });
            console.log('✅ API Connection successful:', response);
            return true;
        } catch (error) {
            console.error('❌ API Connection failed:', error);
            return false;
        }
    }

    // GET request
    async get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    // POST request
    async post(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT request
    async put(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // DELETE request
    async delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }
}

// Create singleton instance
const apiService = new APIService();
