# 🚀 Deployment Guide: Vercel + Railway

This guide will help you deploy your Google Auth + Stripe subscription app to production.

## 📋 Prerequisites

1. **Vercel Account** - [Sign up here](https://vercel.com)
2. **Railway Account** - [Sign up here](https://railway.app)
3. **Stripe Account** - [Sign up here](https://stripe.com)
4. **Firebase Project** - [Console here](https://console.firebase.google.com)

## 🎯 Step 1: Deploy Backend to Railway

### 1.1 Install Railway CLI
```bash
npm install -g @railway/cli
```

### 1.2 Login and Deploy
```bash
# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

### 1.3 Set Environment Variables in Railway
Go to your Railway project dashboard and add these environment variables:

```
STRIPE_SECRET_KEY=sk_live_your_live_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_stripe_publishable_key
STRIPE_PRICE_ID=price_your_stripe_price_id
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
FRONTEND_URL=https://your-vercel-app.vercel.app
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_service_account_email@your_project.iam.gserviceaccount.com
```

### 1.4 Get Railway URL
After deployment, copy your Railway backend URL (e.g., `https://your-app.railway.app`)

## 🎯 Step 2: Deploy Frontend to Vercel

### 2.1 Install Vercel CLI
```bash
npm install -g vercel
```

### 2.2 Update API URL
In `app.js`, replace `https://your-railway-backend-url.railway.app` with your actual Railway URL.

### 2.3 Deploy
```bash
# Deploy to Vercel
vercel --prod
```

### 2.4 Get Vercel URL
After deployment, copy your Vercel frontend URL (e.g., `https://your-app.vercel.app`)

## 🎯 Step 3: Update Configuration

### 3.1 Update Railway Environment Variables
Go back to Railway and update:
```
FRONTEND_URL=https://your-vercel-app.vercel.app
```

### 3.2 Update Firebase Auth Domain
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Authentication > Settings > Authorized domains
4. Add your Vercel domain: `your-app.vercel.app`

### 3.3 Update Stripe Webhook
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to Developers > Webhooks
3. Add endpoint: `https://your-railway-backend-url.railway.app/webhook`
4. Select events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
   - `invoice.payment_failed`
5. Copy the webhook secret and update in Railway

## 🎯 Step 4: Test Your Deployment

1. Visit your Vercel URL
2. Sign in with Google
3. Test subscription flow
4. Test cancellation flow

## 🔧 Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure `FRONTEND_URL` is set correctly in Railway
2. **Firebase Auth Errors**: Check authorized domains in Firebase Console
3. **Stripe Webhook Errors**: Verify webhook URL and secret in Stripe Dashboard
4. **Subscription Not Found**: Check if `firebaseUID` metadata is set on Stripe subscriptions

### Debug Endpoints:
- `GET /debug-subscriptions/:uid` - Check user's Stripe subscriptions
- `POST /fix-subscription-metadata/:uid` - Fix missing metadata

## 💰 Cost Estimate

- **Vercel**: Free tier (100GB bandwidth)
- **Railway**: Free tier (500 hours/month)
- **Stripe**: 2.9% + 30¢ per transaction
- **Firebase**: Free tier (generous limits)

## 🚀 Next Steps

1. Set up custom domain (optional)
2. Add monitoring (Sentry, LogRocket)
3. Set up CI/CD with GitHub
4. Add database for production (PostgreSQL, MongoDB)

## 📞 Support

If you run into issues:
1. Check Railway logs: `railway logs`
2. Check Vercel logs in dashboard
3. Check browser console for errors
4. Verify all environment variables are set
