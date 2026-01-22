// backend/server.js
require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

// Connect to database
connectDB();

// Schedule expiry notification checks
const scheduleExpiryChecks = () => {
  const { checkAndNotifyExpiringResumes, checkAndNotifyExpiredResumes } = require('./src/services/resumeExpiry.service');
  
  // Run expiry checks every 6 hours
  setInterval(async () => {
    try {
      console.log('🔔 Running expiry notification checks...');
      await checkAndNotifyExpiringResumes(1); // Check for resumes expiring in 1 day
      await checkAndNotifyExpiredResumes(); // Check for expired resumes
      console.log('✓ Expiry notification checks completed');
    } catch (error) {
      console.error('Error in expiry notification checks:', error);
    }
  }, 6 * 60 * 60 * 1000); // 6 hours

  // Run immediately on startup
  setImmediate(async () => {
    try {
      console.log('🔔 Running initial expiry notification checks...');
      await checkAndNotifyExpiringResumes(1);
      await checkAndNotifyExpiredResumes();
      console.log('✓ Initial expiry notification checks completed');
    } catch (error) {
      console.error('Error in initial expiry notification checks:', error);
    }
  });
};

// Start expiry checks
scheduleExpiryChecks();

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 Resume & Job Portal API Server                      ║
║                                                           ║
║   Environment: ${process.env.NODE_ENV || 'development'}                              ║
║   Port: ${PORT}                                             ║
║   URL: http://localhost:${PORT}                            ║
║   API Version: ${process.env.API_VERSION || 'v1'}                                   ║
║                                                           ║
║   📚 API Documentation: http://localhost:${PORT}/api/v1    ║
║   ❤️  Health Check: http://localhost:${PORT}/health        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('💥 Process terminated!');
  });
});