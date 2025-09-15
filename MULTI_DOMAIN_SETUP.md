# 🌐 Multi-Domain Setup Guide

This guide shows you how to run your SaaS app on multiple domains with a single backend.

## 🚀 Quick Setup

### **1. Set Environment Variables in Railway**

**Option A: Railway Dashboard**
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your project
3. Go to "Variables" tab
4. Add these variables:

```
FRONTEND_URL=https://saasapp.aiandsons.io
FRONTEND_URL_2=https://myapp.vercel.app
FRONTEND_URL_3=https://staging.myapp.com
FRONTEND_URL_4=https://dev.myapp.com
```

**Option B: Railway CLI**
```bash
# Primary domain
railway variables set FRONTEND_URL=https://saasapp.aiandsons.io

# Additional domains
railway variables set FRONTEND_URL_2=https://myapp.vercel.app
railway variables set FRONTEND_URL_3=https://staging.myapp.com
railway variables set FRONTEND_URL_4=https://dev.myapp.com
```

### **2. Deploy the Updated Backend**

```bash
git add .
git commit -m "Add multi-domain CORS support"
git push
```

## 🔧 How It Works

### **CORS Configuration**
The backend automatically includes all `FRONTEND_URL_*` variables in the CORS origins:

```javascript
// Automatically builds CORS origins from environment variables
const corsOrigins = [
  process.env.FRONTEND_URL,           // Primary domain
  process.env.FRONTEND_URL_2,         // Additional domain 1
  process.env.FRONTEND_URL_3,         // Additional domain 2
  // ... up to FRONTEND_URL_10
];
```

### **Success/Cancel URLs**
- Always uses the primary `FRONTEND_URL` for Stripe redirects
- This ensures consistent user experience across domains

## 📋 Domain Management

### **Adding New Domains**

1. **Add to Railway:**
   ```bash
   railway variables set FRONTEND_URL_5=https://newdomain.com
   ```

2. **Deploy:**
   ```bash
   git push
   ```

3. **No code changes needed!** The backend automatically picks up new domains.

### **Removing Domains**

1. **Remove from Railway:**
   - Go to Railway Dashboard → Variables
   - Delete the unwanted `FRONTEND_URL_*` variable

2. **Deploy:**
   ```bash
   git push
   ```

## 🎯 Use Cases

### **Multiple Environments**
```
FRONTEND_URL=https://myapp.com          # Production
FRONTEND_URL_2=https://staging.myapp.com # Staging
FRONTEND_URL_3=https://dev.myapp.com     # Development
```

### **Multiple Brands**
```
FRONTEND_URL=https://brand1.com         # Brand 1
FRONTEND_URL_2=https://brand2.com       # Brand 2
FRONTEND_URL_3=https://brand3.com       # Brand 3
```

### **A/B Testing**
```
FRONTEND_URL=https://myapp.com          # Control
FRONTEND_URL_2=https://test.myapp.com   # Test variant
```

## 🔒 Security Considerations

### **Domain Validation**
- Only add trusted domains to environment variables
- Use HTTPS for all production domains
- Regularly audit your domain list

### **CORS Best Practices**
- The current setup allows up to 10 additional domains
- Each domain must be explicitly added
- No wildcard domains for security

## 🧪 Testing Multiple Domains

### **1. Test CORS**
```bash
# Test each domain
curl -H "Origin: https://saasapp.aiandsons.io" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://googleauthdemo-production.up.railway.app/create-checkout-session
```

### **2. Test Full Flow**
1. Visit each domain
2. Sign in with Google
3. Create a test subscription
4. Verify success page works

## 📊 Monitoring

### **Check Active Domains**
The backend logs all CORS origins on startup:

```
🔧 CORS Origins configured:
- http://localhost:3000
- https://saasapp.aiandsons.io
- https://myapp.vercel.app
- https://staging.myapp.com
```

### **Debug CORS Issues**
1. Check Railway logs for CORS errors
2. Verify domain is in environment variables
3. Ensure domain uses HTTPS in production

## 🚀 Advanced Configuration

### **Custom CORS Logic**
If you need more complex CORS logic, modify `server/server.js`:

```javascript
// Custom CORS logic
const corsOrigins = (origin, callback) => {
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    // ... other domains
  ];
  
  if (allowedOrigins.includes(origin)) {
    callback(null, true);
  } else {
    callback(new Error('Not allowed by CORS'));
  }
};

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));
```

### **Environment-Specific Domains**
```javascript
// Different domains per environment
const isProduction = process.env.NODE_ENV === 'production';
const corsOrigins = isProduction 
  ? [process.env.FRONTEND_URL, process.env.FRONTEND_URL_2]
  : ['http://localhost:3000', 'http://localhost:3001'];
```

## ✅ Checklist

- [ ] Set `FRONTEND_URL` (primary domain)
- [ ] Set `FRONTEND_URL_2`, `FRONTEND_URL_3`, etc. (additional domains)
- [ ] Deploy backend changes
- [ ] Test each domain
- [ ] Verify CORS works
- [ ] Test full subscription flow
- [ ] Monitor logs for issues

## 🆘 Troubleshooting

### **CORS Error Still Appears**
1. Check if domain is in Railway environment variables
2. Verify backend has been redeployed
3. Clear browser cache
4. Check browser developer tools for exact error

### **Domain Not Working**
1. Ensure domain uses HTTPS
2. Check if domain is properly configured
3. Verify DNS settings
4. Test with curl command above

---

**Your multi-domain setup is now ready! 🎉**
