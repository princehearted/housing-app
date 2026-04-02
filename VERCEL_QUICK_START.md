# Quick Vercel Deployment Steps

## Prerequisites
- Your code pushed to GitHub
- Vercel account (free at [vercel.com](https://vercel.com))

## Method 1: Via Web Dashboard (Easiest)

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Select your GitHub repository
4. Click "Import"
5. In "Configure Project":
   - **Framework Preset**: Other
   - **Root Directory**: `frontend` (click "Edit" and select)
   - **Build Command**: Leave empty
   - **Install Command**: Leave empty
   - **Output Directory**: Leave empty
6. Click "Deploy"
7. Wait for deployment to complete
8. Your URL will be shown (e.g., `https://your-project.vercel.app`)

## Method 2: Via Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Navigate to your project
cd c:\Users\princ\OneDrive\Desktop\housing-app

# Deploy
vercel

# When prompted:
# - Create new project or link to existing? → New project
# - Project name? → housing-app-frontend
# - Project path? → ./
# - Output directory? → frontend
```

## Environment Variables (if needed)

The frontend doesn't need environment variables—it automatically detects:
- **Development**: Uses localhost:3000 or :5000
- **Production**: Uses Railway URL hardcoded in `frontend/js/api.js`

If you want to change the production backend URL later:
1. Edit `frontend/js/api.js` line: `return 'https://housing-app-production-0537.up.railway.app/api';`
2. Commit and push to GitHub
3. Vercel will auto-redeploy

## After Deployment

1. **Test Frontend URL**: Click the Vercel URL in dashboard
2. **Test on Phone**: Open Vercel URL on your phone's browser
3. **Verify API Calls**: Open DevTools (F12) → Network tab
   - All API calls should go to `housing-app-production-0537.up.railway.app`
   - No CORS errors should appear

## Troubleshooting

**Error: "frontend not found"**
- Make sure root directory is set to `frontend`

**Blank page**
- Check browser console for JavaScript errors
- Verify CORS isn't blocking API calls

**Login fails**
- Verify Railway backend is running
- Check JWT_SECRET is set on Railway

## Redeploy After Changes

The frontend auto-redeploys when you push to GitHub:

```bash
# Make changes to frontend files
git add frontend/
git commit -m "Update frontend"
git push origin main
# Vercel automatically redeploys!
```

---

**Your Vercel Frontend URL**: Will appear in Vercel dashboard after first deploy
**Your Railway Backend URL**: https://housing-app-production-0537.up.railway.app
