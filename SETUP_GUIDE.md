# RESUNOVA AI - Setup & CORS Fix Guide

## 🚀 Quick Start Guide

### Prerequisites
- ✅ Backend API running on `http://localhost:5000`
- ✅ Node.js installed

---

## 📝 SETUP INSTRUCTIONS

### Step 1: Start Your Backend Server
Make sure your backend is running on port 5000:
```bash
cd /path/to/your/backend
npm start  # or yarn start
```

**Verify backend is running:**
Open browser: `http://localhost:5000/health`

---

### Step 2: Start Frontend Server (FIX for CORS)
Open a **NEW terminal** and run:

```bash
cd /app/resunova-ai
npm start
```

This will start the frontend server on `http://localhost:3000`

**✅ Your frontend will now be accessible at:**
- 🏠 Landing Page: http://localhost:3000/index.html
- 🔐 Login: http://localhost:3000/login.html
- 📝 Register: http://localhost:3000/register.html
- 📊 Dashboard: http://localhost:3000/dashboard.html

---

## 🔧 Why This Fixes CORS

**Problem:** 
- Opening HTML files directly (`file://` protocol) causes CORS errors
- Browsers block cross-origin requests from file:// to http://

**Solution:**
- Serve HTML files through Express server on `http://localhost:3000`
- Your backend already allows `http://localhost:3000` in CORS config ✅

---

## 🧪 Testing the Setup

### Test 1: Health Check
Open: `http://localhost:5000/health`

**Expected Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "cors": "enabled"
}
```

### Test 2: CORS Test
Open: `http://localhost:5000/api/v1/test`

**Expected Response:**
```json
{
  "success": true,
  "message": "CORS is working!",
  "origin": "http://localhost:3000"
}
```

### Test 3: Login Flow
1. Go to: `http://localhost:3000/login.html`
2. Enter credentials:
   - Email: john@example.com
   - Password: Password123
3. Click Login
4. Check browser console (F12) - should see "✅ API Connection successful"

---

## 🛠️ Backend CORS Configuration (Already Done)

Your backend `app.js` already has correct CORS config:

```javascript
const allowedOrigins = [
  'http://localhost:3000',  // ✅ Your frontend
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL
];
```

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to server"
**Solution:**
1. Check if backend is running: `http://localhost:5000/health`
2. Check if frontend server is running: `http://localhost:3000`
3. Don't open HTML files directly (file://) - use http://localhost:3000

### Issue: "CORS error in browser console"
**Solution:**
1. Make sure you're accessing via `http://localhost:3000` (not file://)
2. Restart both backend and frontend servers
3. Clear browser cache (Ctrl+Shift+Delete)

### Issue: "Port 3000 already in use"
**Solution:**
1. Kill process on port 3000:
   ```bash
   # Linux/Mac
   lsof -ti:3000 | xargs kill -9
   
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```
2. Or use different port:
   ```bash
   PORT=3001 npm start
   ```

---

## 📊 Port Configuration

| Service | Port | URL |
|---------|------|-----|
| Backend API | 5000 | http://localhost:5000 |
| Frontend Server | 3000 | http://localhost:3000 |

---

## 🔐 API Endpoints

Base URL: `http://localhost:5000/api/v1`

### Authentication
- POST `/auth/signup` - Register new user
- POST `/auth/login` - Login user
- POST `/auth/logout` - Logout user

### Sample Login Request
```javascript
POST http://localhost:5000/api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Password123"
}
```

### Sample Response
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

## 🎯 Next Steps

After fixing CORS:
1. ✅ Login/Register should work perfectly
2. ✅ Dashboard will load user data
3. ✅ All API calls will work without CORS errors

---

## 💡 Development Workflow

**Terminal 1 (Backend):**
```bash
cd /path/to/backend
npm start
```

**Terminal 2 (Frontend):**
```bash
cd /app/resunova-ai
npm start
```

**Browser:**
```
http://localhost:3000
```

---

## ✅ Success Indicators

- ✅ No CORS errors in browser console
- ✅ Login redirects to dashboard
- ✅ JWT tokens stored in localStorage
- ✅ User data displayed correctly

---

## 📞 Need Help?

If issues persist:
1. Check browser console (F12) for detailed errors
2. Check backend logs for API errors
3. Verify both servers are running on correct ports
4. Test API directly in Postman first

---

**Created by:** RESUNOVA AI Team
**Last Updated:** 2025
