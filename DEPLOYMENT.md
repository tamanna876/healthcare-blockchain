# Deployment Instructions

## Backend Deployment on Railway

### Prerequisites
- GitHub account with the repository pushed
- Railway.app account (sign up via GitHub)
- MongoDB Atlas account (free tier)

### Step-by-Step Setup

#### 1. MongoDB Atlas Setup (Free Tier)
- Go to https://www.mongodb.com/cloud/atlas
- Create free account
- Click "Create" → Choose "Shared" (free)
- Create a cluster (AWS, free tier)
- Create a database user with username/password
- Get connection string: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/healthcare_trust?retryWrites=true&w=majority`

#### 2. Railway.app Setup
- Go to https://railway.app
- Click "New Project"
- Select "Deploy from GitHub repo"
- Select: `tamanna876/healthcare-blockchain`
- Choose "Monorepo" or "Custom"
- Set root directory or configure Procfile

#### 3. Configure Environment Variables in Railway
Dashboard → Variables section, set these:

```
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/healthcare_trust?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-random-string-min-32-chars
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-frontend.vercel.app
```

#### 4. Deploy
- Railway auto-detects Node.js and builds
- Should deploy in 2-3 minutes
- Get public URL from Railway dashboard (e.g., `https://healthcare-be.up.railway.app`)

#### 5. Update Frontend in Vercel
- Vercel dashboard → Settings → Environment Variables
- Update `VITE_API_URL=https://healthcare-be.up.railway.app`
- Trigger redeploy

#### 6. Test
- Go to frontend URL (Vercel)
- Try register/login
- Should work if API can reach MongoDB

### Health Check
- `https://healthcare-be.up.railway.app/health` should return `{"status":"ok","service":"Healthcare Blockchain Backend"}`

### Troubleshooting
- Check Railway logs if deployment fails
- Verify MongoDB connection string in Railway variables
- Ensure FRONTEND_URL is correct for CORS
