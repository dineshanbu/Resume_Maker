// Centralized Authentication & Authorization Module
// Manages login state, role validation, and session handling

class AuthManager {
    constructor() {
        this.TOKEN_KEY = 'authToken';
        this.REFRESH_TOKEN_KEY = 'refreshToken';
        this.USER_KEY = 'currentUser';
    }

    // ========================================
    // TOKEN MANAGEMENT
    // ========================================

    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    getRefreshToken() {
        return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }

    setTokens(accessToken, refreshToken) {
        localStorage.setItem(this.TOKEN_KEY, accessToken);
        if (refreshToken) {
            localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
        }
    }

    clearAuth() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        localStorage.removeItem('accessToken'); // Legacy support
    }

    // ========================================
    // USER MANAGEMENT
    // ========================================

    getCurrentUser() {
        const userStr = localStorage.getItem(this.USER_KEY);
        if (!userStr) return null;
        
        try {
            return JSON.parse(userStr);
        } catch (e) {
            console.error('Error parsing user data:', e);
            return null;
        }
    }

    setCurrentUser(userData) {
        const user = {
            id: userData._id || userData.id,
            name: userData.fullName || userData.name,
            email: userData.email,
            phone: userData.phone,
            role: userData.role || 'user',
            plan: userData.currentPlan || userData.plan || 'Free',
            profilePicture: userData.profilePicture,
            isVerified: userData.isVerified
        };
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }

    getUserRole() {
        const user = this.getCurrentUser();
        return user ? user.role : null;
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
        const role = this.getUserRole();
        return role === 'user';
    }

    isAdmin() {
        const role = this.getUserRole();
        return role === 'admin';
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
                // Fallback if AlertUtil not loaded
                if (!confirm('Are you sure you want to logout?')) return;
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
        if (responseData.accessToken) {
            this.setTokens(responseData.accessToken, responseData.refreshToken);
        }
        if (responseData.user) {
            this.setCurrentUser(responseData.user);
        }
    }
}

// Create singleton instance
const authManager = new AuthManager();

// Export for use in other modules
window.authManager = authManager;
