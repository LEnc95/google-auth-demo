import express from "express";
import Stripe from "stripe";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { readFileSync } from "fs";

dotenv.config();
const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// --- Firebase Admin Setup ---
// Initialize Firebase Admin with environment variables
let db;
try {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  console.log("🔧 Firebase config check:");
  console.log("- Project ID:", process.env.FIREBASE_PROJECT_ID ? "✅ Set" : "❌ Missing");
  console.log("- Client Email:", process.env.FIREBASE_CLIENT_EMAIL ? "✅ Set" : "❌ Missing");
  console.log("- Private Key:", privateKey ? "✅ Set" : "❌ Missing");
  
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
    throw new Error("Missing required Firebase environment variables");
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: privateKey,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
  db = admin.firestore();
  console.log("✅ Firebase Admin initialized successfully");
} catch (error) {
  console.log("⚠️ Firebase Admin initialization failed:", error.message);
  console.log("⚠️ App will run with in-memory store only");
}

// --- Middleware ---
// Stripe requires raw body for webhook signature verification
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://google-auth-demo-pi.vercel.app',
    'https://google-auth-demo-lq6ld3kun-lenc95s-projects.vercel.app',
    'https://google-auth-demo-5wrvx54r2-lenc95s-projects.vercel.app',
    'https://google-auth-demo-i3mwsshrb-lenc95s-projects.vercel.app',
    'https://saasapp.aiandsons.io'
  ],
  credentials: true
}));
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf } }));

// --- Create Checkout Session ---
app.post("/create-checkout-session", async (req, res) => {
  const { uid, email } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        { price: process.env.STRIPE_PRICE_ID, quantity: 1 }, // Stripe price from .env
      ],
      customer_email: email,
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/success.html`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/cancel.html`,
      metadata: { firebaseUID: uid },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("❌ Error creating session:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- Webhook Endpoint ---
app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("⚠️ Webhook signature verification failed:", err.message);
    return res.sendStatus(400);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const uid = session.metadata.firebaseUID;

        if (uid && session.subscription) {
          // Update the subscription with the Firebase UID metadata
          try {
            await stripe.subscriptions.update(session.subscription, {
              metadata: { firebaseUID: uid }
            });
            console.log(`✅ Updated subscription ${session.subscription} with Firebase UID: ${uid}`);
          } catch (stripeErr) {
            console.error("❌ Failed to update subscription metadata:", stripeErr.message);
          }
        }

        // Store in Firebase (if available)
        if (db) {
          try {
            await db.collection("users").doc(uid).set({
              subscriptionActive: true,
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
            console.log(`✅ Updated Firebase for user ${uid}`);
          } catch (firebaseErr) {
            console.log("⚠️ Firebase update failed:", firebaseErr.message);
          }
        } else {
          console.log("⚠️ Firebase not available, using in-memory store only");
        }
        
        // Store in in-memory store
        subscriptions.set(uid, true);
        console.log(`✅ User ${uid} marked as subscribed`);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        // Only process if this invoice is for a subscription
        if (subscriptionId) {
          try {
            // Look up subscription to retrieve UID from metadata
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const uid = subscription.metadata.firebaseUID;

            if (uid && db) {
              try {
                await db.collection("users").doc(uid).set({
                  subscriptionActive: true,
                  stripeSubscriptionId: subscriptionId,
                  lastPayment: admin.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });
                console.log(`💰 Payment succeeded for user ${uid}`);
              } catch (firebaseErr) {
                console.log("⚠️ Firebase update failed:", firebaseErr.message);
              }
            }
          } catch (err) {
            console.error("Error processing invoice payment:", err.message);
          }
        } else {
          console.log("Invoice payment succeeded but no subscription ID found");
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const uid = sub.metadata?.firebaseUID;

        if (uid) {
          // Update Firebase (if available)
          if (db) {
            try {
              await db.collection("users").doc(uid).set({
                subscriptionActive: false,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              }, { merge: true });
              console.log(`✅ Updated Firebase for user ${uid}`);
            } catch (firebaseErr) {
              console.log("⚠️ Firebase update failed:", firebaseErr.message);
            }
          } else {
            console.log("⚠️ Firebase not available, using in-memory store only");
          }
          
          // Update in-memory store
          subscriptions.set(uid, false);
          console.log(`❌ Subscription canceled for user ${uid}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object;
        const uid = sub.metadata?.firebaseUID;
        const isActive = sub.status === 'active';

        if (uid) {
          // Update Firebase (if available)
          if (db) {
            try {
              await db.collection("users").doc(uid).set({
                subscriptionActive: isActive,
                subscriptionStatus: sub.status,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              }, { merge: true });
              console.log(`✅ Updated Firebase for user ${uid}`);
            } catch (firebaseErr) {
              console.log("⚠️ Firebase update failed:", firebaseErr.message);
            }
          } else {
            console.log("⚠️ Firebase not available, using in-memory store only");
          }
          
          // Update in-memory store
          subscriptions.set(uid, isActive);
          console.log(`🔄 Subscription updated for user ${uid}: ${sub.status}`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        if (subscriptionId) {
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const uid = subscription.metadata.firebaseUID;

            if (uid) {
              // Update Firebase (if available)
              if (db) {
                try {
                  await db.collection("users").doc(uid).set({
                    subscriptionActive: false,
                    lastPaymentFailed: admin.firestore.FieldValue.serverTimestamp(),
                  }, { merge: true });
                  console.log(`✅ Updated Firebase for user ${uid}`);
                } catch (firebaseErr) {
                  console.log("⚠️ Firebase update failed:", firebaseErr.message);
                }
              } else {
                console.log("⚠️ Firebase not available, using in-memory store only");
              }
              
              // Update in-memory store
              subscriptions.set(uid, false);
              console.log(`💳 Payment failed for user ${uid}`);
            }
          } catch (err) {
            console.error("Error processing payment failure:", err.message);
          }
        }
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook handler error:", err);
    res.sendStatus(500);
  }
});

// --- In-memory subscription store (for demo purposes) ---
const subscriptions = new Map();

// --- Check Subscription Endpoint ---
app.get("/check-subscription/:uid", async (req, res) => {
  try {
    const uid = req.params.uid;
    const forceRefresh = req.query.force === 'true';
    console.log(`🔍 Checking subscription status for user: ${uid} (force: ${forceRefresh})`);
    
    // First check in-memory store (unless force refresh)
    if (!forceRefresh && subscriptions.has(uid)) {
      const localStatus = subscriptions.get(uid);
      console.log(`📊 Local store status for ${uid}: ${localStatus}`);
      return res.json({ subscribed: localStatus });
    }
    
    // If not in local store, check Stripe directly
    console.log(`🔍 Checking Stripe for user ${uid}`);
    const stripeSubscriptions = await stripe.subscriptions.list({
      limit: 100,
      status: 'all'
    });
    
    let isSubscribed = false;
    for (const sub of stripeSubscriptions.data) {
      if (sub.metadata.firebaseUID === uid && (sub.status === 'active' || sub.status === 'trialing')) {
        isSubscribed = true;
        console.log(`✅ Found active subscription in Stripe: ${sub.id} (status: ${sub.status})`);
        break;
      }
    }
    
    // Cache the result
    subscriptions.set(uid, isSubscribed);
    console.log(`📊 Stripe status for ${uid}: ${isSubscribed}`);
    
    // Also update Firebase if available
    if (db) {
      try {
        await db.collection("users").doc(uid).set({
          subscriptionActive: isSubscribed,
          lastChecked: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        console.log(`✅ Updated Firebase for user ${uid}`);
      } catch (firebaseErr) {
        console.log("⚠️ Firebase update failed:", firebaseErr.message);
      }
    } else {
      console.log("⚠️ Firebase not available, using in-memory store only");
    }
    
    res.json({ subscribed: isSubscribed });
  } catch (err) {
    console.error("❌ Error checking subscription:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- Test Endpoint: Manually set subscription status ---
app.post("/set-subscription/:uid", (req, res) => {
  const uid = req.params.uid;
  const { subscribed } = req.body;
  
  subscriptions.set(uid, !!subscribed);
  console.log(`📝 Manually set subscription for ${uid}: ${subscribed}`);
  res.json({ success: true, subscribed: !!subscribed });
});

// --- Force refresh subscription status from Stripe ---
app.post("/refresh-subscription/:uid", async (req, res) => {
  try {
    const uid = req.params.uid;
    
    // Try to find the user's subscription in Stripe
    const stripeSubscriptions = await stripe.subscriptions.list({
      limit: 100,
      status: 'all'
    });
    
    let isActive = false;
    for (const sub of stripeSubscriptions.data) {
      if (sub.metadata.firebaseUID === uid) {
        isActive = sub.status === 'active';
        break;
      }
    }
    
    // Update both stores
    subscriptions.set(uid, isActive);
    
    if (db) {
      try {
        await db.collection("users").doc(uid).set({
          subscriptionActive: isActive,
          lastChecked: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        console.log(`✅ Updated Firebase for user ${uid}`);
      } catch (firebaseErr) {
        console.log("⚠️ Firebase update failed:", firebaseErr.message);
      }
    } else {
      console.log("⚠️ Firebase not available, using in-memory store only");
    }
    
    console.log(`🔄 Refreshed subscription status for ${uid}: ${isActive}`);
    res.json({ success: true, subscribed: isActive });
  } catch (err) {
    console.error("Error refreshing subscription:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- Cancel Subscription Endpoint ---
app.post("/cancel-subscription/:uid", async (req, res) => {
  try {
    const uid = req.params.uid;
    console.log(`🔄 Attempting to cancel subscription for user: ${uid}`);
    
    // First check if user has an active subscription in our local store
    const hasActiveSubscription = subscriptions.get(uid) === true;
    console.log(`📊 Local subscription status for ${uid}: ${hasActiveSubscription}`);
    
    if (!hasActiveSubscription) {
      console.log(`❌ No active subscription found in local store for user ${uid}`);
      return res.status(404).json({ 
        success: false, 
        error: "No active subscription found for this user" 
      });
    }
    
    // Find the user's subscription in Stripe (check all statuses)
    const stripeSubscriptions = await stripe.subscriptions.list({
      limit: 100,
      status: 'all' // Check all statuses, not just 'active'
    });
    
    console.log(`📋 Found ${stripeSubscriptions.data.length} total subscriptions`);
    
    let subscriptionToCancel = null;
    for (const sub of stripeSubscriptions.data) {
      console.log(`🔍 Checking subscription ${sub.id}: status=${sub.status}, metadata=`, sub.metadata);
      if (sub.metadata.firebaseUID === uid && (sub.status === 'active' || sub.status === 'trialing')) {
        subscriptionToCancel = sub;
        break;
      }
    }
    
    if (!subscriptionToCancel) {
      console.log(`❌ No active subscription found in Stripe for user ${uid}, but local store says they have one`);
      // Still update local store to false since we can't find it in Stripe
      subscriptions.set(uid, false);
      return res.status(404).json({ 
        success: false, 
        error: "No active subscription found in Stripe for this user" 
      });
    }
    
    console.log(`✅ Found subscription to cancel: ${subscriptionToCancel.id} (status: ${subscriptionToCancel.status})`);
    
    // Cancel the subscription immediately
    let canceledSubscription;
    try {
      canceledSubscription = await stripe.subscriptions.cancel(subscriptionToCancel.id);
      console.log(`✅ Subscription canceled in Stripe: ${canceledSubscription.id} (status: ${canceledSubscription.status})`);
    } catch (stripeError) {
      console.error(`❌ Failed to cancel subscription in Stripe:`, stripeError);
      return res.status(500).json({
        success: false,
        error: `Failed to cancel subscription in Stripe: ${stripeError.message}`
      });
    }
    
    // Only update local stores if Stripe cancellation was successful
    subscriptions.set(uid, false);
    
    if (db) {
      try {
        await db.collection("users").doc(uid).set({
          subscriptionActive: false,
          subscriptionStatus: 'canceled',
          canceledAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        console.log(`✅ Updated Firebase for user ${uid}`);
      } catch (firebaseErr) {
        console.log("⚠️ Firebase update failed:", firebaseErr.message);
      }
    } else {
      console.log("⚠️ Firebase not available, using in-memory store only");
    }
    
    console.log(`❌ Subscription canceled for user ${uid}: ${canceledSubscription.id}`);
    
    // Send success response
    res.json({ 
      success: true, 
      subscriptionId: canceledSubscription.id,
      message: "Subscription canceled successfully"
    });
    
  } catch (err) {
    console.error("❌ Error canceling subscription:", err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// --- Debug Endpoint: List all subscriptions for a user ---
app.get("/debug-subscriptions/:uid", async (req, res) => {
  try {
    const uid = req.params.uid;
    console.log(`🔍 Debug: Looking for subscriptions for user ${uid}`);
    
    const stripeSubscriptions = await stripe.subscriptions.list({
      limit: 100,
      status: 'all'
    });
    
    const userSubscriptions = stripeSubscriptions.data.filter(sub => 
      sub.metadata.firebaseUID === uid
    );
    
    console.log(`📋 Found ${userSubscriptions.length} subscriptions for user ${uid}`);
    userSubscriptions.forEach(sub => {
      console.log(`  - ${sub.id}: status=${sub.status}, created=${new Date(sub.created * 1000)}`);
    });
    
    res.json({
      uid,
      totalSubscriptions: stripeSubscriptions.data.length,
      userSubscriptions: userSubscriptions.length,
      subscriptions: userSubscriptions.map(sub => ({
        id: sub.id,
        status: sub.status,
        created: new Date(sub.created * 1000),
        current_period_end: new Date(sub.current_period_end * 1000),
        metadata: sub.metadata
      }))
    });
  } catch (err) {
    console.error("Debug error:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- Fix Missing Metadata Endpoint ---
app.post("/fix-subscription-metadata/:uid", async (req, res) => {
  try {
    const uid = req.params.uid;
    console.log(`🔧 Fixing metadata for user: ${uid}`);
    
    // Get all active subscriptions
    const stripeSubscriptions = await stripe.subscriptions.list({
      limit: 100,
      status: 'active'
    });
    
    // Find subscriptions without metadata (likely the user's)
    const subscriptionsWithoutMetadata = stripeSubscriptions.data.filter(sub => 
      !sub.metadata.firebaseUID
    );
    
    console.log(`📋 Found ${subscriptionsWithoutMetadata.length} subscriptions without metadata`);
    
    if (subscriptionsWithoutMetadata.length === 0) {
      return res.json({ 
        success: true, 
        message: "No subscriptions found without metadata" 
      });
    }
    
    // Update the most recent subscription (likely the user's)
    const latestSubscription = subscriptionsWithoutMetadata.sort((a, b) => b.created - a.created)[0];
    
    await stripe.subscriptions.update(latestSubscription.id, {
      metadata: { firebaseUID: uid }
    });
    
    console.log(`✅ Updated subscription ${latestSubscription.id} with Firebase UID: ${uid}`);
    
    // Update local store
    subscriptions.set(uid, true);
    
    res.json({ 
      success: true, 
      subscriptionId: latestSubscription.id,
      message: "Subscription metadata updated successfully" 
    });
  } catch (err) {
    console.error("Fix metadata error:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- Start Server ---
const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
