# ⚡ Quick Start Guide

Get your SaaS up and running in 10 minutes!

## 🚀 Step 1: Clone & Setup

```bash
# Clone this template
git clone https://github.com/LEnc95/google-auth-demo.git my-awesome-saas
cd my-awesome-saas

# Run the setup script
npm run setup
```

## 🔧 Step 2: Configure Services

### **Firebase Setup**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project
3. Enable Authentication → Google
4. Enable Firestore Database
5. Go to Project Settings → Service Accounts
6. Generate new private key
7. Update `.env` with your credentials

### **Stripe Setup**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Get your API keys from Developers → API keys
3. Create a product and price
4. Set up webhook: `https://your-backend-url.railway.app/webhook`
5. Update `.env` with your credentials

## 🚀 Step 3: Deploy

### **Frontend (Vercel)**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy frontend
vercel --prod
```

### **Backend (Railway)**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway up
```

## ✅ Step 4: Test

1. Visit your Vercel URL
2. Sign in with Google
3. Create a test subscription
4. Verify everything works!

## 🎉 You're Done!

Your SaaS is now live and ready for customers!

## 📚 Next Steps

- Customize the design and branding
- Add more features
- Set up monitoring
- Scale as needed

## 🆘 Need Help?

- Check `TEMPLATE.md` for detailed documentation
- Review `README.md` for troubleshooting
- Open an issue on GitHub

---

**Happy building! 🚀**
