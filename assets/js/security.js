// Security Utilities

class SecurityManager {
    constructor() {
        this.initTokenExpiryCheck();
    }

    // Sanitize input to prevent XSS
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    // Validate email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validate password strength
    validatePassword(password) {
        const errors = [];
        
        if (password.length < SECURITY_CONFIG.PASSWORD_MIN_LENGTH) {
            errors.push(`Password must be at least ${SECURITY_CONFIG.PASSWORD_MIN_LENGTH} characters`);
        }
        
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        
        if (!/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        
        if (!/[@$!%*?&]/.test(password)) {
            errors.push('Password must contain at least one special character (@$!%*?&)');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Validate phone number
    isValidPhone(phone) {
        const phoneRegex = /^[\d\s()+-]+$/;
        return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
    }

    // Decode JWT token (client-side only for display purposes)
    decodeJWT(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error decoding JWT:', error);
            return null;
        }
    }

    // Check if token is expired
    isTokenExpired(token) {
        const decoded = this.decodeJWT(token);
        if (!decoded || !decoded.exp) return true;
        
        const currentTime = Math.floor(Date.now() / 1000);
        return decoded.exp < currentTime;
    }

    // Initialize token expiry check
    initTokenExpiryCheck() {
        setInterval(() => {
            const token = apiService.getToken();
            if (token && this.isTokenExpired(token)) {
                this.handleTokenExpiry();
            }
        }, SECURITY_CONFIG.TOKEN_EXPIRY_CHECK_INTERVAL);
    }

    // Handle token expiry
    handleTokenExpiry() {
        apiService.clearTokens();
        
        // Show expiry message
        if (window.location.pathname !== '/login.html' && window.location.pathname !== '/register.html') {
            alert('Your session has expired. Please login again.');
            window.location.href = 'login.html';
        }
    }

    // Generate CSRF token
    generateCSRFToken() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    // Escape HTML to prevent XSS
    escapeHTML(str) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    // Validate form data
    validateFormData(formData, rules) {
        const errors = {};
        
        for (const [field, rule] of Object.entries(rules)) {
            const value = formData[field];
            
            // Required check
            if (rule.required && (!value || value.trim() === '')) {
                errors[field] = `${rule.label || field} is required`;
                continue;
            }
            
            // Email validation
            if (rule.type === 'email' && value && !this.isValidEmail(value)) {
                errors[field] = 'Please enter a valid email address';
            }
            
            // Phone validation
            if (rule.type === 'phone' && value && !this.isValidPhone(value)) {
                errors[field] = 'Please enter a valid phone number';
            }
            
            // Password validation
            if (rule.type === 'password' && value) {
                const passwordValidation = this.validatePassword(value);
                if (!passwordValidation.isValid) {
                    errors[field] = passwordValidation.errors[0];
                }
            }
            
            // Min length
            if (rule.minLength && value && value.length < rule.minLength) {
                errors[field] = `${rule.label || field} must be at least ${rule.minLength} characters`;
            }
            
            // Max length
            if (rule.maxLength && value && value.length > rule.maxLength) {
                errors[field] = `${rule.label || field} must not exceed ${rule.maxLength} characters`;
            }
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
}

// Create singleton instance
const securityManager = new SecurityManager();
