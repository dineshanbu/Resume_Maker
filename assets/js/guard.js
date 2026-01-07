// Route Protection Guards
// Prevents unauthorized access to protected pages

class RouteGuard {
    constructor() {
        this.publicPages = ['/', '/index.html', '/login.html', '/register.html', '/pricing.html'];
        this.userPages = ['/user-dashboard.html', '/user-create-resume.html', '/profile.html', '/resumes.html', '/jobs.html'];
        this.adminPages = ['/admin/admin-layout.html', '/admin/admin-dashboard.html'];
    }

    // ========================================
    // MAIN GUARD CHECK
    // ========================================

    checkAccess() {
        const currentPath = window.location.pathname;
        const isLoggedIn = authManager.isLoggedIn();
        const userRole = authManager.getUserRole();

        console.log('Route Guard Check:', { currentPath, isLoggedIn, userRole });

        // Public pages - accessible to all
        if (this.isPublicPage(currentPath)) {
            // If already logged in, redirect away from auth pages
            if (isLoggedIn && this.isAuthPage(currentPath)) {
                this.redirectToDashboard(userRole);
                return false;
            }
            return true;
        }

        // Protected pages - require authentication
        if (!isLoggedIn) {
            this.redirectToLogin();
            return false;
        }

        // User pages - only for users
        if (this.isUserPage(currentPath)) {
            if (userRole === 'admin') {
                this.redirectToAdminDashboard();
                return false;
            }
            if (userRole !== 'user') {
                this.redirectToLogin();
                return false;
            }
            return true;
        }

        // Admin pages - only for admins
        if (this.isAdminPage(currentPath)) {
            if (userRole === 'user') {
                this.redirectToUserDashboard();
                return false;
            }
            if (userRole !== 'admin') {
                this.redirectToLogin();
                return false;
            }
            return true;
        }

        // Default: allow access
        return true;
    }

    // ========================================
    // PAGE TYPE CHECKERS
    // ========================================

    isPublicPage(path) {
        return this.publicPages.some(page => path.endsWith(page));
    }

    isAuthPage(path) {
        return path.includes('login.html') || path.includes('register.html');
    }

    isUserPage(path) {
        return this.userPages.some(page => path.includes(page));
    }

    isAdminPage(path) {
        return this.adminPages.some(page => path.includes(page));
    }

    // ========================================
    // REDIRECT METHODS
    // ========================================

    redirectToLogin() {
        if (window.AlertUtil) {
            AlertUtil.showWarning('Please login to access this page.', 'Authentication Required').then(() => {
                window.location.replace('/login.html');
            });
        } else {
            alert('Please login to access this page.');
            window.location.replace('/login.html');
        }
    }

    redirectToDashboard(role) {
        if (role === 'admin') {
            window.location.replace('/admin/admin-layout.html');
        } else {
            window.location.replace('/user-dashboard.html');
        }
    }

    redirectToUserDashboard() {
        if (window.AlertUtil) {
            AlertUtil.showWarning('Access denied. Redirecting to your dashboard.', 'Unauthorized').then(() => {
                window.location.replace('/user-dashboard.html');
            });
        } else {
            alert('Access denied. Redirecting to your dashboard.');
            window.location.replace('/user-dashboard.html');
        }
    }

    redirectToAdminDashboard() {
        if (window.AlertUtil) {
            AlertUtil.showWarning('Access denied. Redirecting to admin panel.', 'Unauthorized').then(() => {
                window.location.replace('/admin/admin-layout.html');
            });
        } else {
            alert('Access denied. Redirecting to admin panel.');
            window.location.replace('/admin/admin-layout.html');
        }
    }

    // ========================================
    // SPECIFIC GUARD FUNCTIONS
    // ========================================

    // Guard for user-only pages
    requireUser() {
        const isLoggedIn = authManager.isLoggedIn();
        const userRole = authManager.getUserRole();

        if (!isLoggedIn) {
            this.redirectToLogin();
            return false;
        }

        if (userRole === 'admin') {
            this.redirectToAdminDashboard();
            return false;
        }

        if (userRole !== 'user') {
            this.redirectToLogin();
            return false;
        }

        return true;
    }

    // Guard for admin-only pages
    requireAdmin() {
        const isLoggedIn = authManager.isLoggedIn();
        const userRole = authManager.getUserRole();

        if (!isLoggedIn) {
            this.redirectToLogin();
            return false;
        }

        if (userRole === 'user') {
            this.redirectToUserDashboard();
            return false;
        }

        if (userRole !== 'admin') {
            this.redirectToLogin();
            return false;
        }

        return true;
    }

    // Guard for auth pages (login/signup)
    requireGuest() {
        const isLoggedIn = authManager.isLoggedIn();
        
        if (isLoggedIn) {
            const userRole = authManager.getUserRole();
            this.redirectToDashboard(userRole);
            return false;
        }

        return true;
    }
}

// Create singleton instance
const routeGuard = new RouteGuard();

// Export for use in other modules
window.routeGuard = routeGuard;

// Auto-run guard check when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        routeGuard.checkAccess();
    });
} else {
    routeGuard.checkAccess();
}
