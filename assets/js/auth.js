// ============================================
// CENTRALIZED AUTHENTICATION MANAGER
// Single source of truth for auth state
// Stores ONLY: accessToken + userRole
// ============================================

class AuthManager {
    constructor() {
        this.TOKEN_KEY = 'accessToken';
        this.ROLE_KEY = 'userRole';
    }

    // ========================================
    // TOKEN MANAGEMENT
    // ========================================

    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    setToken(token) {
        if (token) {
            localStorage.setItem(this.TOKEN_KEY, token);
        }
    }

    clearAuth() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.ROLE_KEY);
        // Clear legacy keys if they exist
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentUser');
    }

    // ========================================
    // ROLE MANAGEMENT
    // ========================================

    getUserRole() {
        return localStorage.getItem(this.ROLE_KEY);
    }

    setUserRole(role) {
        if (role) {
            localStorage.setItem(this.ROLE_KEY, role);
        }
    }

    // ========================================
    // AUTHENTICATION STATE
    // ========================================

    isLoggedIn() {
        const token = this.getToken();
        if (!token) return false;

        // Check token expiry
        if (this.isTokenExpired(token)) {
            this.clearAuth();
            return false;
        }

        return true;
    }

    isTokenExpired(token) {
        try {
            const payload = this.decodeJWT(token);
            if (!payload || !payload.exp) return true;
            
            const currentTime = Math.floor(Date.now() / 1000);
            return payload.exp < currentTime;
        } catch (e) {
            return true;
        }
    }

    decodeJWT(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error decoding JWT:', error);
            return null;
        }
    }

    // ========================================
    // ROLE CHECKS
    // ========================================

    isUser() {
        return this.getUserRole() === 'user';
    }

    isAdmin() {
        return this.getUserRole() === 'admin';
    }

    // ========================================
    // LOGOUT
    // ========================================

    async logout() {
        try {
            // Show confirmation
            if (window.AlertUtil) {
                const confirmed = await AlertUtil.showConfirm(
                    'Are you sure you want to logout?',
                    'Logout',
                    'Yes, Logout',
                    'Cancel'
                );
                
                if (!confirmed) return;
            } else {
                if (!confirm('Are you sure you want to logout?')) return;
            }

            // Call API logout if available
            if (window.apiHandler) {
                await apiHandler.logout();
            }

            // Clear auth data
            this.clearAuth();

            // Show success message
            if (window.AlertUtil) {
                await AlertUtil.showToast('Logged out successfully', 'success');
            }

            // Redirect to landing page
            window.location.replace('/index.html');
        } catch (error) {
            console.error('Logout error:', error);
            this.clearAuth();
            window.location.replace('/index.html');
        }
    }

    // ========================================
    // SAVE AUTH DATA (after login/signup)
    // ========================================

    saveAuthData(responseData) {
        // Extract token
        const token = responseData.accessToken || responseData.token;
        if (token) {
            this.setToken(token);
        }

        // Extract role from response or decode from token
        let role = responseData.role || responseData.user?.role;
        
        if (!role && token) {
            // Try to extract role from token
            try {
                const payload = this.decodeJWT(token);
                role = payload.role || payload.user?.role || 'user';
            } catch (e) {
                role = 'user'; // Default to user
            }
        }

        if (role) {
            this.setUserRole(role);
        }

        console.log('✅ Auth data saved:', { hasToken: !!token, role });
    }
}


// Create singleton instance
const authManager = new AuthManager();

// Export for use in other modules
window.authManager = authManager;
