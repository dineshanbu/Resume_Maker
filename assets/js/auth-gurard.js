// ============================================
// AUTH PAGES GUARD - BLOCKING
// Prevents logged-in users from accessing login/signup
// ============================================

(function() {
    'use strict';
    
    // Get auth data
    const token = localStorage.getItem('accessToken');
    const role = localStorage.getItem('userRole');
    
    // If already logged in, redirect to appropriate dashboard
    if (token && role) {
        // Check token validity
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            
            // If token is valid and not expired
            if (payload.exp && payload.exp > currentTime) {
                // Redirect based on role
                if (role === 'admin') {
                    window.location.replace('/admin/admin-layout.html');
                } else if (role === 'user') {
                    window.location.replace('/user-dashboard.html');
                }
                // Stop script execution
                throw new Error('Already authenticated');
            }
        } catch (e) {
            // Token invalid or expired - clear and allow access to auth pages
            localStorage.removeItem('accessToken');
            localStorage.removeItem('userRole');
        }
    }
    
    // Allow access to auth pages
    console.log('✅ Auth guard passed - guest access allowed');
})();
