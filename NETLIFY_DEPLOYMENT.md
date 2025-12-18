# Deploy to Netlify - Step by Step Guide

## 🚀 Method 1: Deploy via Netlify Website (Easiest - No CLI Required)

### Step 1: Build Your Project Locally

```bash
cd Crowd-management-ui
npm install
npm run build
```

This creates production files in `dist/crowd-management-ui/browser/`

### Step 2: Deploy on Netlify

1. Go to [https://app.netlify.com](https://app.netlify.com)
2. Sign up/Login (free account works)
3. Click **"Add new site"** → **"Deploy manually"**
4. Drag and drop the **`dist/crowd-management-ui/browser`** folder
5. Wait for deployment to complete
6. Your site will be live! (Netlify gives you a URL like `your-site.netlify.app`)

---

## 🛠️ Method 2: Deploy via Netlify CLI

### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

### Step 2: Build Your Project

```bash
cd Crowd-management-ui
npm install
npm run build
```

### Step 3: Login to Netlify

```bash
netlify login
```

This opens your browser to authorize Netlify CLI.

### Step 4: Deploy

```bash
# First time - Initialize and deploy
netlify init

# Or deploy directly
netlify deploy --prod --dir=dist/crowd-management-ui/browser
```

Follow the prompts:
- Create & configure a new site
- Choose your team
- Set publish directory: `dist/crowd-management-ui/browser`
- Build command: `npm run build`

---

## 🔗 Method 3: Deploy via Git Integration (Recommended for Updates)

### Step 1: Push Your Code to GitHub

(You already did this! ✅)

### Step 2: Connect GitHub to Netlify

1. Go to [https://app.netlify.com](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Click **"GitHub"** and authorize Netlify
4. Select your repository: `Crowd-management-ui-angular`
5. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist/crowd-management-ui/browser`
6. Click **"Deploy site"**

### Step 3: Automatic Deployments

Every time you push to GitHub, Netlify will automatically rebuild and deploy!

---

## ⚙️ Build Settings Summary

- **Base directory:** (leave empty)
- **Build command:** `npm run build`
- **Publish directory:** `dist/crowd-management-ui/browser`
- **Node version:** (Netlify auto-detects from package.json, or set to 18)

---

## ✅ Verify Deployment

After deployment:

1. Visit your Netlify URL (e.g., `your-site.netlify.app`)
2. You should see the login page
3. Test navigation and routes
4. Check browser console for any errors

---

## 🔧 Important Notes

- The `netlify.toml` file is already included in your project for proper routing
- All routes will redirect to `index.html` for Angular client-side routing
- Environment variables are set in `environment.prod.ts`
- Make sure the API URL in production environment is accessible from Netlify

---

## 🆓 Netlify Free Tier Includes

- 100GB bandwidth per month
- 300 build minutes per month
- HTTPS/SSL certificates (automatic)
- Custom domains
- Automatic deployments from Git

---

## 📝 Next Steps

1. **Set Custom Domain** (Optional)
   - Go to Site settings → Domain management
   - Add your custom domain

2. **Environment Variables** (If needed)
   - Site settings → Environment variables
   - Add any secrets or API keys

3. **Enable Deploy Previews**
   - Automatically creates preview URLs for pull requests
   - Already enabled by default when using Git integration

---

**Need help?** Netlify Docs: https://docs.netlify.com/

