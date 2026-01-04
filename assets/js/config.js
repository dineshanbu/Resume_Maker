// API Configuration
const API_CONFIG = {
    BASE_URL: 'http://localhost:5000',
    ENDPOINTS: {
        AUTH: {
            SIGNUP: '/api/v1/auth/signup',
            LOGIN: '/api/v1/auth/login',
            LOGOUT: '/api/v1/auth/logout',
            TEST: '/api/v1/test'
        },
        USERS: '/api/v1/users',
        RESUMES: '/api/v1/resumes',
        JOBS: '/api/v1/jobs',
        APPLICATIONS: '/api/v1/applications',
        TEMPLATES: '/api/v1/templates',
        SUBSCRIPTIONS: '/api/v1/subscriptions'
    },
    TOKEN_KEY: 'authToken',
    REFRESH_TOKEN_KEY: 'refreshToken',
    USER_KEY: 'currentUser',
    // CORS handling
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

// Security Configuration
const SECURITY_CONFIG = {
    TOKEN_EXPIRY_CHECK_INTERVAL: 60000, // Check every minute
    AUTO_LOGOUT_WARNING: 300000, // 5 minutes before expiry
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
};
