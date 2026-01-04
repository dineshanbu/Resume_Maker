// Simple HTTP Server for serving HTML files
// This is needed to avoid CORS issues with file:// protocol

const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the current directory
app.use(express.static(__dirname));

// Default route - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
  ✅ RESUNOVA AI Frontend Server Running!
  
  📍 Local:    http://localhost:${PORT}
  📍 Network:  http://127.0.0.1:${PORT}
  
  📄 Pages Available:
     - Landing:         http://localhost:${PORT}/index.html
     - Login:           http://localhost:${PORT}/login.html
     - Register:        http://localhost:${PORT}/register.html
     - Dashboard:       http://localhost:${PORT}/dashboard.html
     - Resume Builder:  http://localhost:${PORT}/resume-builder.html
  
  ⚙️  Backend API should be running on: http://localhost:5000
  
  Press Ctrl+C to stop
  `);
});
