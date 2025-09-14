# Google Auth + Stripe Subscription Demo

A full-stack web application demonstrating Google authentication with Stripe subscription management. Users can sign in with Google, subscribe to premium features, and manage their subscriptions.

## 🚀 Live Demo

- **Frontend**: https://google-auth-demo-pi.vercel.app/
- **Backend API**: https://googleauthdemo-production.up.railway.app/

## ✨ Features

- **Google Authentication** - Sign in with Google using Firebase Auth
- **Stripe Subscriptions** - Create and manage recurring subscriptions
- **Real-time Status** - Check subscription status with webhook integration
- **Subscription Management** - Cancel subscriptions directly from the app
- **Members-only Content** - Protected content based on subscription status
- **Responsive Design** - Works on desktop and mobile devices

## 🏗️ Architecture

### Frontend (Vercel)
- **Static HTML/CSS/JavaScript**
- **Firebase Auth** for Google Sign-In
- **Stripe Checkout** for subscription creation
- **Dynamic UI** based on authentication and subscription status

### Backend (Railway)
- **Node.js/Express** server
- **Stripe API** integration for subscription management
- **Firebase Admin SDK** for user data storage
- **Webhook handling** for real-time updates
- **CORS** configured for production deployment

## 🛠️ Tech Stack

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Firebase Auth
- Stripe.js
- Vercel (deployment)

### Backend
- Node.js
- Express.js
- Stripe API
- Firebase Admin SDK
- Railway (deployment)

### Database
- Firestore (Firebase)
- In-memory store (fallback)

## 📋 Prerequisites

- Node.js 20+
- Stripe account
- Firebase project
- Vercel account (for frontend deployment)
- Railway account (for backend deployment)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/LEnc95/google-auth-demo.git
cd google-auth-demo
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

**For Local Development:**
Create a `.env` file in the root directory (only for local testing):

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_PRICE_ID=price_your_stripe_price_id
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Firebase Configuration
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"

# Frontend URL (for production)
FRONTEND_URL=https://your-frontend-url.vercel.app
```

**For Production (Railway):**
Environment variables are managed through Railway's dashboard or CLI (see Deployment section below).

### 4. Run Locally

```bash
# Start the backend server
npm start

# The frontend can be served with any static file server
# For example, using Python:
python -m http.server 3000
```

## 🔧 Configuration

### Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Authentication and Firestore
3. Add your domain to authorized domains
4. Generate a service account key
5. Update environment variables

### Stripe Setup

1. Create a Stripe account at https://dashboard.stripe.com/
2. Get your API keys from the dashboard
3. Create a product and price for subscriptions
4. Set up webhooks pointing to your backend URL
5. Update environment variables

### Webhook Events

Configure these events in Stripe Dashboard:
- `checkout.session.completed`
- `invoice.payment_succeeded`
- `customer.subscription.deleted`
- `customer.subscription.updated`
- `invoice.payment_failed`

## 📁 Project Structure

```
google-auth-demo/
├── app.js                 # Frontend JavaScript
├── index.html            # Main HTML file
├── success.html          # Success page
├── cancel.html           # Cancel page
├── server/
│   └── server.js         # Backend Express server
├── package.json          # Dependencies and scripts
├── vercel.json           # Vercel deployment config
├── railway.json          # Railway deployment config
├── .nvmrc                # Node.js version
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

## 🚀 Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Deploy automatically on push to main branch
3. No additional configuration needed

### Backend (Railway)

1. Connect your GitHub repository to Railway
2. Set environment variables using Railway CLI or dashboard
3. Deploy automatically on push to main branch

#### Setting Environment Variables in Railway

**Option 1: Railway Dashboard**
1. Go to your project in [Railway Dashboard](https://railway.app/dashboard)
2. Click on your service
3. Go to "Variables" tab
4. Add each environment variable

**Option 2: Railway CLI**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Set environment variables
railway variables set STRIPE_SECRET_KEY=sk_test_your_key
railway variables set STRIPE_PUBLISHABLE_KEY=pk_test_your_key
railway variables set STRIPE_PRICE_ID=price_your_price_id
railway variables set STRIPE_WEBHOOK_SECRET=whsec_your_secret
railway variables set FIREBASE_PROJECT_ID=your_project_id
railway variables set FIREBASE_CLIENT_EMAIL=your_client_email
railway variables set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour key\n-----END PRIVATE KEY-----\n"
railway variables set FRONTEND_URL=https://your-frontend-url.vercel.app
```

**Option 3: Railway Configuration File**
Create a `railway.toml` file in your project root for easier environment management:

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[env]
STRIPE_SECRET_KEY = "sk_test_your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY = "pk_test_your_stripe_publishable_key"
STRIPE_PRICE_ID = "price_your_stripe_price_id"
STRIPE_WEBHOOK_SECRET = "whsec_your_webhook_secret"
FIREBASE_PROJECT_ID = "your_firebase_project_id"
FIREBASE_CLIENT_EMAIL = "your_firebase_client_email"
FIREBASE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FRONTEND_URL = "https://your-frontend-url.vercel.app"
```

### Environment Variables for Production

Set these in your deployment platforms:

**Railway (Backend):**
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FRONTEND_URL`

**Vercel (Frontend):**
- No environment variables needed (Firebase config is public)

## 🔒 Security Features

- **Firebase Auth** - Secure Google authentication
- **Stripe Webhooks** - Verified webhook signatures
- **CORS Protection** - Configured for specific origins
- **Environment Variables** - Sensitive data not in code
- **Input Validation** - Server-side validation
- **Error Handling** - Comprehensive error management

## 📊 API Endpoints

### Backend API

- `GET /config` - Get Stripe publishable key
- `POST /create-checkout-session` - Create Stripe checkout session
- `GET /check-subscription/:uid` - Check user subscription status
- `POST /set-subscription/:uid` - Set subscription status
- `POST /refresh-subscription/:uid` - Refresh subscription from Stripe
- `POST /cancel-subscription/:uid` - Cancel user subscription
- `POST /webhook` - Stripe webhook endpoint

## 🧪 Testing

### Test Subscription Flow

1. Sign in with Google
2. Click "Subscribe Now"
3. Complete Stripe checkout
4. Verify success page shows subscription
5. Test subscription cancellation

### Test Webhook

1. Create a test webhook in Stripe Dashboard
2. Send test events
3. Check Railway logs for processing

## 🐛 Troubleshooting

### Common Issues

**Google Sign-In not working:**
- Check Firebase authorized domains
- Verify Firebase configuration

**Stripe checkout failing:**
- Verify Stripe keys are correct
- Check CORS configuration

**Webhook not receiving events:**
- Ensure webhook URL is correct
- Check webhook secret in environment variables
- Verify webhook is in correct mode (test/live)

**Subscription status not updating:**
- Check Firebase connection
- Verify webhook events are being processed
- Check Railway logs for errors

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section
2. Review the logs in Railway/Vercel
3. Open an issue on GitHub

## 🙏 Acknowledgments

- [Firebase](https://firebase.google.com/) for authentication
- [Stripe](https://stripe.com/) for payment processing
- [Vercel](https://vercel.com/) for frontend hosting
- [Railway](https://railway.app/) for backend hosting

---

**Note**: This is a demo application. For production use, ensure proper security measures, error handling, and compliance with relevant regulations.
