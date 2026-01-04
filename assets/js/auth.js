// Authentication utilities

// Check if user is logged in
function isLoggedIn() {
    return localStorage.getItem('currentUser') !== null;
}

// Get current user
function getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

// Logout
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// Protect page (require login)
function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Require admin
function requireAdmin() {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
        window.location.href = 'dashboard.html';
        return false;
    }
    return true;
}

// Initialize dummy data if not exists
function initializeDummyData() {
    // Initialize users if not exist
    if (!localStorage.getItem('users')) {
        const dummyUsers = [
            {
                name: 'Demo User',
                email: 'user@demo.com',
                password: 'password123',
                role: 'user',
                plan: 'free',
                createdAt: new Date().toISOString()
            },
            {
                name: 'Admin User',
                email: 'admin@demo.com',
                password: 'admin123',
                role: 'admin',
                plan: 'premium',
                createdAt: new Date().toISOString()
            }
        ];
        localStorage.setItem('users', JSON.stringify(dummyUsers));
    }
}

// Call on page load
initializeDummyData();