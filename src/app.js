// backend/src/app.js (CORS FIX)
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const passport = require('./config/passport.config');
const session = require('express-session');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const resumeRoutes = require('./routes/resume.routes');
const jobRoutes = require('./routes/job.routes');
const applicationRoutes = require('./routes/application.routes');
const templateRoutes = require('./routes/template.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const adminRoutes = require('./routes/admin.routes');
const notificationRoutes = require('./routes/notification.routes');
// Import middlewares
const { errorHandler, notFound } = require('./middlewares/error.middleware');

// Initialize express app
const app = express();

// Trust proxy
app.set('trust proxy', 1);

// ============================================
// CORS CONFIGURATION (FIXED)
// ============================================

// Allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://localhost:4200',
  "https://resum-nova-ai-frontend.vercel.app",
  process.env.FRONTEND_URL
].filter(Boolean); // Remove undefined values

// CORS Options
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200
};

// Apply CORS
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// ============================================
// SECURITY MIDDLEWARE
// ============================================

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// ============================================
// BODY PARSER & OTHER MIDDLEWARE
// ============================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Session middleware (for OAuth)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Compression
app.use(compression());

// Logging (development only)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve static files
app.use('/uploads', express.static('uploads'));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for OPTIONS requests
  skip: (req) => req.method === 'OPTIONS'
});

app.use('/api/', limiter);

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    cors: 'enabled'
  });
});

// ============================================
// API ROUTES
// ============================================

const API_VERSION = process.env.API_VERSION || 'v1';

// Test endpoint for CORS
app.get(`/api/${API_VERSION}/test`, (req, res) => {
  res.json({
    success: true,
    message: 'CORS is working!',
    origin: req.headers.origin
  });
});

// Mount routes
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/users`, userRoutes);
app.use(`/api/${API_VERSION}/profile`, require('./routes/profile.routes'));
app.use(`/api/${API_VERSION}/appconfig`, require('./routes/appconfig.routes'));
app.use(`/api/${API_VERSION}/plans`, require('./routes/plan.routes'));
app.use(`/api/${API_VERSION}/template-categories`, require('./routes/templateCategory.routes'));
app.use(`/api/${API_VERSION}/resumes`, resumeRoutes);
app.use(`/api/${API_VERSION}/jobs`, jobRoutes);
app.use(`/api/${API_VERSION}/applications`, applicationRoutes);
app.use(`/api/${API_VERSION}/templates`, templateRoutes);
app.use(`/api/${API_VERSION}/template-ratings`, require('./routes/templateRating.routes'));
app.use(`/api/${API_VERSION}/subscriptions`, subscriptionRoutes);
app.use(`/api/${API_VERSION}/notifications`, notificationRoutes);
app.use(`/api/${API_VERSION}/admin`, adminRoutes);
app.use(`/api/${API_VERSION}/user/config`, require('./routes/user-config.routes'));

// Public resume route (outside API versioning)
app.use('/resume/public', require('./routes/publicResume.routes'));



// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Resume & Job Portal API',
    version: API_VERSION,
    cors: 'enabled',
    features: [
      'User Authentication (Local & Google OAuth)',
      'Resume Builder with Multiple Templates',
      'Job Posting & Search',
      'Application Tracking',
      'Subscription Plans',
      'Payment Integration'
    ],
    endpoints: {
      auth: `/api/${API_VERSION}/auth`,
      users: `/api/${API_VERSION}/users`,
      resumes: `/api/${API_VERSION}/resumes`,
      jobs: `/api/${API_VERSION}/jobs`,
      applications: `/api/${API_VERSION}/applications`,
      templates: `/api/${API_VERSION}/templates`,
      subscriptions: `/api/${API_VERSION}/subscriptions`
    }
  });
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

module.exports = app;