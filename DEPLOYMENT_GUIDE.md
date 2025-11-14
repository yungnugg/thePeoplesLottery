# 🚀 Deployment Guide - Real Bitcoin Mining

## RBM2435 - Production Deployment

---

## 🎯 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│         Firebase Hosting (Static Files)                 │
│  - index.html, CSS, JS                                  │
│  - React/Next.js frontend                               │
│  - mining-worker.js                                     │
└─────────────────┬───────────────────────────────────────┘
                  │ WebSocket (needs separate server)
                  ↓
┌─────────────────────────────────────────────────────────┐
│       Node.js Stratum Bridge (Needs Hosting)            │
│  - server.js                                            │
│  - WebSocket server (port 3001)                         │
│  - Connects to CKPool                                   │
└─────────────────────────────────────────────────────────┘
```

**Important:** Firebase Hosting only serves static files. The WebSocket server (server.js) needs separate hosting.

---

## 🔧 Current Issue

**Error:** `ERR_CONNECTION_REFUSED` on `ws://localhost:3001`

**Cause:** The Node.js Stratum bridge (`server.js`) is not running.

**Why:** After deploying to Firebase, the static site is hosted, but the WebSocket server needs to run separately.

---

## ✅ Solution Options

### Option 1: Local Server + Firebase Frontend (Quick Test)

**Use Case:** Testing the deployed frontend with local mining

**Steps:**

1. **Keep server running locally:**
   ```bash
   npm run server:dev
   ```

2. **Access your Firebase site:**
   ```
   https://your-app.firebaseapp.com
   ```

3. **Mining will connect to local server:**
   - Worker tries `ws://localhost:3001`
   - Server running on your machine
   - Only works on your computer

**Pros:**
- ✅ Quick to test
- ✅ No additional setup
- ✅ Free

**Cons:**
- ❌ Only works on your machine
- ❌ Others can't mine
- ❌ Server must stay running

---

### Option 2: Deploy Server to Cloud (Production Ready)

**Use Case:** Public mining accessible to anyone

**Recommended Services:**

#### A. Railway.app (Easiest)
**Free Tier:** Yes (up to $5/month credit)

**Steps:**
1. Create account at https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Railway auto-detects `server.js`
5. Environment variables: None needed
6. Deploy!

**Result:** `wss://your-app.railway.app`

#### B. Render.com
**Free Tier:** Yes

**Steps:**
1. Create account at https://render.com
2. Click "New +" → "Web Service"
3. Connect GitHub repository
4. Build Command: `npm install`
5. Start Command: `node server.js`
6. Port: 3001 (Render provides PORT env var)
7. Deploy!

**Result:** `wss://your-app.onrender.com`

#### C. Heroku
**Free Tier:** No (starting at $7/month)

**Steps:**
1. Create account at https://heroku.com
2. Install Heroku CLI
3. Run commands:
   ```bash
   heroku create your-app-name
   git push heroku main
   ```

**Result:** `wss://your-app-name.herokuapp.com`

---

### Option 3: Ngrok Tunnel (Quick Public Test)

**Use Case:** Temporarily make local server public

**Steps:**

1. **Install ngrok:**
   ```bash
   npm install -g ngrok
   ```

2. **Run server locally:**
   ```bash
   npm run server:dev
   ```

3. **Start ngrok tunnel:**
   ```bash
   ngrok http 3001
   ```

4. **Copy forwarding URL:**
   ```
   Forwarding: https://abc123.ngrok.io -> http://localhost:3001
   ```

5. **Update mining-worker.js:**
   ```javascript
   const WS_URL = "wss://abc123.ngrok.io"; // Use wss:// not ws://
   ```

**Pros:**
- ✅ Instant public access
- ✅ No deployment needed
- ✅ Free tier available

**Cons:**
- ❌ URL changes each restart
- ❌ Temporary solution
- ❌ Your computer must stay on

---

## 🔄 Update Worker for Production

After deploying server, update `mining-worker.js`:

### Current Code:
```javascript
const getWebSocketURL = () => {
  if (typeof location !== 'undefined') {
    const hostname = location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'ws://localhost:3001';
    }
  }
  return 'ws://localhost:3001'; // Falls back to localhost
};
```

### Updated for Production:
```javascript
const getWebSocketURL = () => {
  if (typeof location !== 'undefined') {
    const hostname = location.hostname;
    
    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'ws://localhost:3001';
    }
    
    // Production - use your deployed server URL
    // Replace with your actual server URL from Railway/Render/Heroku
    return 'wss://your-server.railway.app'; // Use wss:// for secure WebSocket
  }
  return 'ws://localhost:3001';
};
```

**Important:** Use `wss://` (secure) not `ws://` for production!

---

## 📝 Step-by-Step Deployment (Railway Example)

### 1. Prepare Server for Cloud

Update `server.js` to use environment port:

```javascript
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Stratum bridge running on port ${PORT}`);
  // ...
});
```

Already done! ✅

### 2. Create Railway Account

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project"

### 3. Deploy Server

1. Click "Deploy from GitHub repo"
2. Select `TheLottery` repository
3. Railway detects `package.json` and `server.js`
4. Click "Deploy"
5. Wait for build (~2 minutes)

### 4. Get Server URL

1. Click on your deployment
2. Go to "Settings" → "Domains"
3. Click "Generate Domain"
4. Copy URL: `your-app.up.railway.app`

### 5. Update Worker

Edit `mining-worker.js`:
```javascript
return 'wss://your-app.up.railway.app'; // Your actual Railway URL
```

### 6. Redeploy Frontend

```bash
# Copy updated worker
Copy-Item "mining-worker.js" "public\mining-worker.js" -Force

# Build Next.js
npm run build

# Deploy to Firebase
firebase deploy
```

### 7. Test

1. Visit your Firebase URL
2. Check connection indicator (should be green)
3. Click "DREAM BIG"
4. Mining should work!

---

## 🔍 Troubleshooting

### Connection Refused
**Cause:** Server not running
**Fix:** Start server with `npm run server:dev`

### Mixed Content Error
**Cause:** Using `ws://` on HTTPS site
**Fix:** Change to `wss://` for production

### 404 Not Found
**Cause:** Wrong server URL
**Fix:** Verify server URL is correct and server is running

### CORS Error
**Cause:** Server rejecting connections
**Fix:** Server already has CORS enabled, check URL

### Authentication Failed
**Cause:** CKPool rejecting connection
**Fix:** Check wallet address format (should be bc1q...)

---

## 💰 Cost Comparison

| Service | Free Tier | Cost After | Best For |
|---------|-----------|------------|----------|
| **Railway** | $5/month credit | $0.01/min | Easiest setup |
| **Render** | 750 hrs/month | $7/month | Good free tier |
| **Heroku** | No free tier | $7/month | Reliability |
| **ngrok** | Limited time | $8/month | Testing only |
| **Local** | Free | Free | Development |

**Recommendation:** Start with **Railway** (easiest) or **Render** (best free tier).

---

## 🎯 Quick Fix (Right Now)

**To make your deployed site work immediately:**

### On Your Computer:

```bash
# Keep this terminal open
npm run server:dev
```

### In Browser:

1. Open your Firebase site
2. It will connect to your local server
3. Mining will work!

**Note:** This only works while on your computer. For others to mine, deploy the server to a cloud service.

---

## 📋 Complete Deployment Checklist

### Frontend (Firebase)
- [x] Static site deployed
- [x] mining-worker.js in public folder
- [ ] Worker URL updated to production server

### Backend (Cloud Service)
- [ ] Choose hosting service (Railway/Render/Heroku)
- [ ] Deploy server.js
- [ ] Get public URL
- [ ] Test WebSocket connection

### Integration
- [ ] Update worker with server URL
- [ ] Change ws:// to wss://
- [ ] Redeploy frontend
- [ ] Test end-to-end

### Verification
- [ ] Connection indicator shows green
- [ ] Mining button works
- [ ] Progress bar updates
- [ ] Shares can be found
- [ ] Console shows no errors

---

## 🚀 Recommended Path

### Now (5 minutes):
```bash
# Terminal 1: Start local server
npm run server:dev

# Browser: Test Firebase site
# Should connect to local server
```

### Later Today (15 minutes):
1. Sign up for Railway.app
2. Deploy server
3. Update worker URL
4. Redeploy frontend
5. **Fully functional public mining!**

---

## 📞 Support

**Issue:** Server not connecting
**Check:** 
- Is `npm run server:dev` running?
- Console shows "Connected to CKPool"?
- Firewall blocking port 3001?

**Issue:** Deployment failing
**Check:**
- All dependencies in package.json?
- Server.js has no syntax errors?
- PORT environment variable set?

---

## ✅ Summary

**Current Status:**
- ✅ Frontend deployed to Firebase
- ❌ Backend needs deployment or local run

**Quick Fix:**
Run `npm run server:dev` on your computer

**Production Fix:**
Deploy server to Railway/Render and update worker URL

**Code:** RBM2435
