# Render Deployment Checklist

## Step 1: Go to Render
https://render.com → Sign up with GitHub

---

## Step 2: Create New Web Service
Click **New** → **Web Service**

---

## Step 3: Copy-Paste These Values

### Basic Settings

**Name:**
```
healthcare-blockchain-backend
```

**Language:**
```
Node
```

**Branch:**
```
main
```

**Region:**
```
Oregon (US West)
```

**Root Directory:**
```
backend
```

**Build Command:**
```
npm install
```

**Start Command:**
```
npm start
```

**Instance Type:**
```
Free
```

---

## Step 4: Environment Variables

Copy-paste each line in "NAME" and "value" fields:

| NAME | VALUE |
|------|-------|
| `MONGODB_URI` | `Get from MongoDB Atlas - mongodb+srv://username:password@...` |
| `JWT_SECRET` | `random-secret-string-min-32-chars-xyz123!@#$%^` |
| `JWT_EXPIRES_IN` | `7d` |
| `FRONTEND_URL` | `https://your-vercel-app.vercel.app` |
| `IPFS_HOST` | `gateway.ipfs.io` |
| `IPFS_PORT` | `443` |
| `IPFS_PROTOCOL` | `https` |
| `RPC_URL` | `http://127.0.0.1:8545` |
| `PRIVATE_KEY` | `0x0000000000000000000000000000000000000000000000000000000000000000` |
| `MEDICAL_RECORDS_ADDRESS` | `0x0000000000000000000000000000000000000000` |
| `BLOOD_DONATION_ADDRESS` | `0x0000000000000000000000000000000000000000` |
| `ORGAN_DONATION_ADDRESS` | `0x0000000000000000000000000000000000000000` |
| `MEDICINE_VERIFICATION_ADDRESS` | `0x0000000000000000000000000000000000000000` |

---

## Step 5: MongoDB Atlas Setup (If you haven't done)

1. Go to https://mongodb.com/cloud/atlas
2. Create FREE account
3. Create FREE cluster
4. Create database user (username + password)
5. Copy connection string: 
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/healthcare_trust?retryWrites=true&w=majority
```
6. Paste in Render's `MONGODB_URI`

---

## Step 6: Deploy
Click **Deploy web service**

Wait 3-5 minutes...

---

## Step 7: Get URL
After deploy, Render dashboard shows:
```
https://your-app-name.onrender.com
```

Test it:
```
https://your-app-name.onrender.com/health
```
Should return: `{"status":"ok","service":"Healthcare Blockchain Backend"}`

---

## Step 8: Update Vercel Frontend

1. Go to https://vercel.com → your project → Settings
2. Environment Variables
3. Add/Update:
```
VITE_API_URL = https://your-app-name.onrender.com
```
4. Redeploy (click the redeploy button)

---

## Done! ✅

Frontend + Backend now live!

Test register/login at:
https://your-frontend.vercel.app
