# 🚀 GitHub & Railway Deployment - Step by Step

## RBM2435 - Deploy Bitcoin Mining Server

---

## ✅ Step 1: Create GitHub Repository

### Option A: Using GitHub Website (Easiest)

1. **Go to GitHub:**
   - Visit: https://github.com/new
   - Log in if needed

2. **Create Repository:**
   - Repository name: `TheLottery` (or any name you prefer)
   - Description: `Real Bitcoin Mining Lottery with Stratum Integration`
   - Visibility: **Public** (required for Railway free tier)
   - ❌ **Do NOT** initialize with README, .gitignore, or license
   - Click **"Create repository"**

3. **Copy the commands shown** (should look like this):
   ```bash
   git remote add origin https://github.com/yungnugg/thePeoplesLottery.git
   git branch -M main
   git push -u origin main
   ```

### Option B: Using GitHub CLI (Advanced)

```bash
# Install GitHub CLI if needed
winget install GitHub.cli

# Login to GitHub
gh auth login

# Create repository
gh repo create TheLottery --public --source=. --remote=origin

# Push code
git push -u origin main
```

---

## ✅ Step 2: Push Code to GitHub

**Run these commands in your terminal:**

```powershell
# Add GitHub as remote (use YOUR username)
git remote add origin https://github.com/YOUR-USERNAME/TheLottery.git

# Rename branch to main
git branch -M main

# Push code to GitHub
git push -u origin main
```

**You'll be prompted for credentials:**
- Use GitHub Personal Access Token (not password)
- Or authenticate through browser window

---

## ✅ Step 3: Deploy to Railway

### 3.1 Create Railway Account

1. Go to: https://railway.app
2. Click **"Start a New Project"**
3. Sign up with **GitHub** (recommended)
4. Authorize Railway to access your repositories

### 3.2 Deploy Your Repository

1. **Click "Deploy from GitHub repo"**
2. **Select your repository:** `TheLottery`
3. Railway will:
   - ✅ Detect `package.json`
   - ✅ Detect `server.js`
   - ✅ Install dependencies
   - ✅ Start server automatically

4. **Wait for deployment** (~2-3 minutes)
   - You'll see logs in real-time
   - Look for: "✅ Connected to CKPool"

### 3.3 Get Your Server URL

1. **Click on your deployment**
2. **Go to "Settings" tab**
3. **Click "Generate Domain"**
4. **Copy the URL** (e.g., `your-app.up.railway.app`)

---

## ✅ Step 4: Update Frontend

### 4.1 Update Mining Worker

Edit `mining-worker.js` (line ~22):

```javascript
const getWebSocketURL = () => {
  if (typeof location !== 'undefined') {
    const hostname = location.hostname;
    
    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'ws://localhost:3001';
    }
    
    // Production - use your Railway URL
    return 'wss://your-app.up.railway.app'; // ⬅️ CHANGE THIS
  }
  return 'ws://localhost:3001';
};
```

**Important:** Use `wss://` (secure WebSocket) not `ws://`!

### 4.2 Copy to Public Folder

```powershell
Copy-Item "mining-worker.js" "public\mining-worker.js" -Force
```

### 4.3 Commit and Push Changes

```powershell
git add mining-worker.js public/mining-worker.js
git commit -m "Update WebSocket URL for Railway deployment"
git push
```

### 4.4 Redeploy Frontend to Firebase

```powershell
npm run build
firebase deploy
```

---

## ✅ Step 5: Test Everything

### 5.1 Check Railway Server

1. **Go to Railway dashboard**
2. **Click on your deployment**
3. **Check logs** - Should see:
   ```
   🚀 Stratum bridge running on port XXXX
   ✅ Connected to CKPool solo.ckpool.org:3333
   📋 New mining job: ...
   ```

### 5.2 Test Your Site

1. **Open your Firebase URL:** `https://your-app.firebaseapp.com`
2. **Check connection indicator:** Should be 🟢 green
3. **Check console:** Should see "Connected to Stratum bridge"
4. **Click "DREAM BIG":** Mining should work!

### 5.3 Test from Another Device

1. **Open site on phone or another computer**
2. **Should connect to Railway server**
3. **Mining should work from anywhere!**

---

## 🔍 Troubleshooting

### Issue: Git push asks for password

**Solution 1: Use Personal Access Token**
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo`, `workflow`
4. Copy token
5. Use token as password when pushing

**Solution 2: Use SSH**
```powershell
# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to GitHub
# Copy the public key and add at: https://github.com/settings/keys
```

### Issue: Railway build failing

**Check:**
- All dependencies in `package.json`?
- `server.js` has no syntax errors?
- Logs show what's failing?

**Common fixes:**
```json
// Add to package.json if missing:
"scripts": {
  "start": "node server.js"
}
```

### Issue: WebSocket still not connecting

**Check:**
1. Railway server is running (check logs)
2. `mining-worker.js` has correct Railway URL
3. Using `wss://` not `ws://`
4. Deployed updated worker to Firebase
5. Hard refresh browser (Ctrl+Shift+R)

### Issue: CORS errors

**Already fixed in server.js:**
```javascript
app.use(cors()); // ✅ Already present
```

---

## 📋 Complete Checklist

### GitHub Setup
- [ ] Created repository on GitHub
- [ ] Added remote: `git remote add origin ...`
- [ ] Pushed code: `git push -u origin main`
- [ ] Repository is public (for Railway free tier)

### Railway Deployment
- [ ] Created Railway account
- [ ] Connected GitHub
- [ ] Deployed repository
- [ ] Server is running (check logs)
- [ ] Generated domain
- [ ] Copied server URL

### Frontend Update
- [ ] Updated `mining-worker.js` with Railway URL
- [ ] Changed to `wss://` (secure WebSocket)
- [ ] Copied to `public/` folder
- [ ] Committed changes
- [ ] Pushed to GitHub
- [ ] Redeployed to Firebase

### Testing
- [ ] Railway logs show "Connected to CKPool"
- [ ] Firebase site shows green indicator
- [ ] Mining button works
- [ ] Progress bar updates
- [ ] Can find shares
- [ ] Works from other devices

---

## 🎯 Quick Command Reference

```powershell
# GitHub Setup
git remote add origin https://github.com/YOUR-USERNAME/TheLottery.git
git branch -M main
git push -u origin main

# Update Worker URL
# (Edit mining-worker.js manually)

# Copy and Deploy
Copy-Item "mining-worker.js" "public\mining-worker.js" -Force
git add .
git commit -m "Update for Railway deployment"
git push
npm run build
firebase deploy
```

---

## 💰 Railway Free Tier

**Included:**
- $5 credit per month
- 500 hours execution
- Shared CPU/RAM
- Perfect for this project!

**Usage:**
- Server runs 24/7
- Handles multiple miners
- Auto-restarts on crash
- Free SSL certificate

---

## ✅ Success!

Once complete, you'll have:
- ✅ Code on GitHub
- ✅ Server on Railway (24/7)
- ✅ Frontend on Firebase
- ✅ Real Bitcoin mining
- ✅ Accessible worldwide!

**Total setup time:** ~10-15 minutes

**Code:** RBM2435

---

## 🆘 Need Help?

**GitHub not working?**
- Try: `gh auth login` (GitHub CLI)
- Or use GitHub Desktop app

**Railway not deploying?**
- Check build logs
- Verify `package.json` has `start` script
- Ensure repository is public

**WebSocket not connecting?**
- Verify Railway URL is correct
- Use `wss://` not `ws://`
- Check Railway server logs
- Hard refresh browser

---

## 🎉 Ready to Deploy!

Your code is committed and ready. Now follow the steps above to:
1. Create GitHub repository
2. Push code
3. Deploy to Railway
4. Update worker URL
5. Start mining!

Good luck! 🚀
