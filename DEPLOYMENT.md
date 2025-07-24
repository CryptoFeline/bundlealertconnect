# 🚀 Deployment Guide

## Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and log in to your account
2. Click "New" to create a new repository
3. Set repository name: `bundlealertconnect`
4. Make it **Private** (recommended for security)
5. **Do NOT** initialize with README, .gitignore, or license (we already have them)
6. Click "Create repository"

## Step 2: Push to GitHub

After creating the repository on GitHub, run these commands:

```bash
cd "/Users/DM/Desktop/BundleAlert/BundleAlertStream Backup/bundlealertconnect"
git push -u origin main
```

## Step 3: Deploy to Netlify

### Option A: Connect via GitHub (Recommended)

1. Go to [Netlify](https://netlify.com) and log in
2. Click "New site from Git"
3. Choose "GitHub" as your Git provider
4. Authorize Netlify to access your repositories
5. Select the `bundlealertconnect` repository
6. Configure build settings:
   - **Branch to deploy**: `main`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
7. Click "Deploy site"

### Option B: Manual Deploy

1. Build the project locally:
```bash
npm run build
```

2. Go to [Netlify](https://netlify.com)
3. Drag and drop the `dist` folder to the deployment area

## Step 4: Configure Environment Variables

⚠️ **CRITICAL**: Set these in Netlify Dashboard (Site settings → Environment variables):

```
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
VITE_API_BASE_URL=your_backend_api_url
```

### How to get WalletConnect Project ID:
1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create account or log in
3. Create new project
4. Copy the Project ID

## Step 5: Security Checklist

✅ **Repository Security**:
- [ ] Repository is private
- [ ] `.env` file is in `.gitignore` (✓ Already done)
- [ ] Environment variables are set in Netlify, not in code

✅ **Deployment Security**:
- [ ] HTTPS is enabled (Netlify default)
- [ ] Security headers are configured (✓ Already done in netlify.toml)
- [ ] Domain is configured properly

✅ **Application Security**:
- [ ] WalletConnect Project ID is environment variable
- [ ] API URLs are environment variables
- [ ] No sensitive data in client-side code

## Step 6: Custom Domain (Optional)

1. In Netlify dashboard, go to "Domain settings"
2. Click "Add custom domain"
3. Follow DNS configuration instructions
4. Enable HTTPS (automatic with Netlify)

## Step 7: Telegram Bot Integration

Once deployed, you'll need to:

1. **Get your Netlify URL** (e.g., `https://amazing-app-123.netlify.app`)
2. **Configure in your Telegram bot** using BotFather:
   ```
   /setmenubutton
   @YourBotUsername
   Verify Wallet
   https://your-netlify-url.netlify.app
   ```

## 🔧 Build Optimization

The current build is optimized for:
- **Tree shaking**: Unused code removal
- **Code splitting**: Automatic chunk splitting
- **Asset optimization**: Images and CSS optimization
- **Compression**: Gzip compression enabled

## 📊 Performance Monitoring

Monitor your deployment:
- **Netlify Analytics**: Built-in analytics
- **Performance**: Lighthouse scores
- **Error tracking**: Check Netlify logs for issues

## 🆘 Troubleshooting

**Common Issues**:

1. **Build fails**: Check Node.js version (should be 18+)
2. **Environment variables not working**: Ensure they start with `VITE_`
3. **Wallet connection issues**: Verify WalletConnect Project ID
4. **API errors**: Check CORS settings on your backend

**Useful Commands**:
```bash
# Test build locally
npm run build
npm run preview

# Check for errors
npm run build 2>&1 | grep -i error

# Force clean install
rm -rf node_modules package-lock.json
npm install
```

---

**🔒 Security Reminder**: Never commit `.env` files or expose sensitive credentials in your code!
