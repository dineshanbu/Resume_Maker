// Enhanced Authentication System with API Integration

class AuthService {
    constructor() {
        this.apiService = apiService;
        this.securityManager = securityManager;
    }

    // Sign up new user
    async signup(userData) {
        try {
            // Validate data
            const validation = this.securityManager.validateFormData(userData, {
                fullName: { required: true, label: 'Full Name', minLength: 2 },
                email: { required: true, type: 'email', label: 'Email' },
                password: { required: true, type: 'password', label: 'Password' },
                phone: { required: true, type: 'phone', label: 'Phone' }
            });

            if (!validation.isValid) {
                throw new Error(Object.values(validation.errors)[0]);
            }

            // Sanitize inputs
            const sanitizedData = {
                fullName: this.securityManager.sanitizeInput(userData.fullName),
                email: this.securityManager.sanitizeInput(userData.email),
                password: userData.password, // Don't sanitize password
                phone: this.securityManager.sanitizeInput(userData.phone)
            };

            // Make API call
            const response = await this.apiService.post(
                API_CONFIG.ENDPOINTS.AUTH.SIGNUP,
                sanitizedData,
                { skipAuth: true }
            );

            if (response.success && response.data) {
                // Store tokens and user data
                this.handleAuthSuccess(response.data);
                return { success: true, message: 'Account created successfully!' };
            }

            throw new Error(response.message || 'Signup failed');
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, message: error.message };
        }
    }

    // Login user
    async login(credentials) {
        try {
            // Validate data
            const validation = this.securityManager.validateFormData(credentials, {
                email: { required: true, type: 'email', label: 'Email' },
                password: { required: true, label: 'Password' }
            });

            if (!validation.isValid) {
                throw new Error(Object.values(validation.errors)[0]);
            }

            // Make API call
            const response = await this.apiService.post(
                API_CONFIG.ENDPOINTS.AUTH.LOGIN,
                credentials,
                { skipAuth: true }
            );

            if (response.success && response.data) {
                // Store tokens and user data
                this.handleAuthSuccess(response.data);
                return { success: true, message: 'Login successful!' };
            }

            throw new Error(response.message || 'Login failed');
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: error.message };
        }
    }

    // Logout user
    async logout() {
        try {
            // Make API call to logout
            await this.apiService.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            // Clear local storage regardless of API response
            this.apiService.clearTokens();
            
            // Redirect to landing page and prevent back navigation
            window.location.replace('index.html');
            
            // Additional measure to prevent back button
            window.history.pushState(null, '', 'index.html');
            window.addEventListener('popstate', function() {
                window.history.pushState(null, '', 'index.html');
            });
        }
    }

    // Handle successful authentication
    handleAuthSuccess(data) {
        // Store tokens
        if (data.accessToken) {
            this.apiService.setTokens(data.accessToken, data.refreshToken);
        }

        // Store user data
        if (data.user) {
            const userData = {
                id: data.user._id,
                name: data.user.fullName,
                email: data.user.email,
                phone: data.user.phone,
                role: data.user.role || 'user',
                plan: data.user.currentPlan || 'Free',
                profilePicture: data.user.profilePicture,
                isVerified: data.user.isVerified
            };
            localStorage.setItem(API_CONFIG.USER_KEY, JSON.stringify(userData));
        }
    }

    // Check if user is logged in
    isLoggedIn() {
        const token = this.apiService.getToken();
        if (!token) return false;

        // Check if token is expired
        if (this.securityManager.isTokenExpired(token)) {
            this.apiService.clearTokens();
            return false;
        }

        return true;
    }

    // Get current user
    getCurrentUser() {
        const userStr = localStorage.getItem(API_CONFIG.USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    }

    // Require authentication (use in pages)
    requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    // Require admin role
    requireAdmin() {
        if (!this.isLoggedIn()) {
            window.location.href = 'login.html';
            return false;
        }

        const user = this.getCurrentUser();
        if (!user || user.role !== 'admin') {
            window.location.href = 'user-dashboard.html';
            return false;
        }

        return true;
    }

    // Update user data in localStorage
    updateUserData(updates) {
        const user = this.getCurrentUser();
        if (user) {
            const updatedUser = { ...user, ...updates };
            localStorage.setItem(API_CONFIG.USER_KEY, JSON.stringify(updatedUser));
        }
    }
}

// Create singleton instance
const authService = new AuthService();

// Legacy function wrappers for backwards compatibility
function isLoggedIn() {
    return authService.isLoggedIn();
}

function getCurrentUser() {
    return authService.getCurrentUser();
}

function logout() {
    authService.logout();
}

function requireAuth() {
    return authService.requireAuth();
}

function requireAdmin() {
    return authService.requireAdmin();
}
