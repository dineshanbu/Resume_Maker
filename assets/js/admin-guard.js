// ============================================
// ADMIN ROUTE GUARD - BLOCKING
// Executes BEFORE DOM render to prevent flash
// ============================================

(function() {
    'use strict';
    
    // Get auth data
    const token = localStorage.getItem('accessToken');
    const role = localStorage.getItem('userRole');
    
    // Get current page
    const currentPath = window.location.pathname;
    
    // Check if token exists
    if (!token) {
        // No token - redirect to login IMMEDIATELY
        window.location.replace('/login.html');
        // Stop script execution
        throw new Error('Authentication required');
    }
    
    // Check if user has admin role
    if (role !== 'admin') {
        // Not admin - redirect based on role
        if (role === 'user') {
            window.location.replace('/user-dashboard.html');
        } else {
            window.location.replace('/login.html');
        }
        // Stop script execution
        throw new Error('Admin access required');
    }
    
    // Token expiry check
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        
        if (payload.exp && payload.exp < currentTime) {
            // Token expired
            localStorage.removeItem('accessToken');
            localStorage.removeItem('userRole');
            window.location.replace('/login.html');
            throw new Error('Session expired');
        }
    } catch (e) {
        // Invalid token
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userRole');
        window.location.replace('/login.html');
        throw new Error('Invalid session');
    }
    
    // All checks passed - allow page to render
    console.log('✅ Admin guard passed');
})();
