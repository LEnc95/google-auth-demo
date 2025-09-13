// Import Firebase from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBB7GxfWbFidoIbEt3KMA95XgtOGq2KaUI",
  authDomain: "auth-subscription-demo.firebaseapp.com",
  projectId: "auth-subscription-demo",
  storageBucket: "auth-subscription-demo.appspot.com",
  messagingSenderId: "957915230155",
  appId: "1:957915230155:web:fee6dd75f4d8cd5dd6904e"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Elements
const loginBtn = document.getElementById("googleLogin");
const logoutBtn = document.getElementById("googleLogout");
const userInfo = document.getElementById("userInfo");
const protectedContent = document.getElementById("protectedContent");
const subscriptionSection = document.getElementById("subscriptionSection");
const checkoutBtn = document.getElementById("goToCheckout");
const refreshBtn = document.getElementById("refreshSubscription");
const cancelBtn = document.getElementById("cancelSubscription");
const cancelModal = document.getElementById("cancelModal");
const cancelConfirmYes = document.getElementById("cancelConfirmYes");
const cancelConfirmNo = document.getElementById("cancelConfirmNo");

// --- Sign In ---
loginBtn.addEventListener("click", async () => {
  try {
    console.log("Google login button clicked!");
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    userInfo.textContent = JSON.stringify(user, null, 2);
  } catch (err) {
    console.warn("Popup failed, using redirect...", err);
    await signInWithRedirect(auth, provider);
  }
});

// --- Handle Redirect Login ---
getRedirectResult(auth)
  .then((result) => {
    if (result?.user) {
      userInfo.textContent = JSON.stringify(result.user, null, 2);
    }
  })
  .catch((err) => {
    if (err) console.error("Redirect sign-in error:", err);
  });

// --- Check if we should refresh subscription status ---
if (localStorage.getItem('shouldRefreshSubscription') === 'true') {
  localStorage.removeItem('shouldRefreshSubscription');
  // Wait a moment for any webhook processing to complete
  setTimeout(refreshSubscriptionStatus, 2000);
}

// --- Periodic subscription status check (every 5 minutes) ---
setInterval(() => {
  const user = auth.currentUser;
  if (user) {
    refreshSubscriptionStatus();
  }
}, 5 * 60 * 1000); // 5 minutes

// --- Auth State Observer ---
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Logged in - check subscription status
    userInfo.textContent = JSON.stringify(user, null, 2);
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    
    // Check if user has active subscription
    try {
      const res = await fetch(`http://localhost:4242/check-subscription/${user.uid}`);
      const data = await res.json();
      
      if (data.subscribed) {
        // User is subscribed - show protected content, hide subscription section
        protectedContent.style.display = "block";
        subscriptionSection.style.display = "none";
        console.log("User has active subscription");
      } else {
        // User is signed in but not subscribed - show subscription section, hide protected content
        protectedContent.style.display = "none";
        subscriptionSection.style.display = "block";
        console.log("User does not have active subscription");
      }
    } catch (err) {
      console.error("Error checking subscription:", err);
      // If we can't check subscription, show subscription section for security
      protectedContent.style.display = "none";
      subscriptionSection.style.display = "block";
    }
  } else {
    // Logged out
    userInfo.textContent = "Not signed in";
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    protectedContent.style.display = "none";
    subscriptionSection.style.display = "none";
  }
});

// --- Sign Out ---
logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    console.log("User signed out.");
  } catch (err) {
    console.error("Sign-out error:", err);
  }
});

// --- Subscription Status Functions ---
async function checkSubscriptionStatus() {
  const user = auth.currentUser;
  if (!user) return false;
  
  try {
    const res = await fetch(`http://localhost:4242/check-subscription/${user.uid}`);
    const data = await res.json();
    return data.subscribed;
  } catch (err) {
    console.error("Error checking subscription:", err);
    return false;
  }
}

async function refreshSubscriptionStatus() {
  const user = auth.currentUser;
  if (!user) return;
  
  try {
    // Use force refresh to bypass cache and check Stripe directly
    const res = await fetch(`http://localhost:4242/check-subscription/${user.uid}?force=true`);
    const data = await res.json();
    
    if (data.subscribed) {
      // User is subscribed - show protected content, hide subscription section
      protectedContent.style.display = "block";
      subscriptionSection.style.display = "none";
      console.log("Subscription status updated: Active");
    } else {
      // User is not subscribed - show subscription section, hide protected content
      protectedContent.style.display = "none";
      subscriptionSection.style.display = "block";
      console.log("Subscription status updated: Inactive");
    }
  } catch (err) {
    console.error("Error refreshing subscription:", err);
    protectedContent.style.display = "none";
    subscriptionSection.style.display = "block";
  }
}

// --- Stripe Checkout Button ---

// --- Checkout button ---
checkoutBtn?.addEventListener("click", async () => {
  const user = auth.currentUser;

  if (!user) {
    alert("Please sign in first!");
    return;
  }

  try {
    const res = await fetch("http://localhost:4242/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: user.uid,        // Firebase UID
        email: user.email     // Optional: also send email
      }),
    });

    const data = await res.json();
    if (data.url) {
      // Store a flag to refresh subscription status when user returns
      localStorage.setItem('shouldRefreshSubscription', 'true');
      window.location.href = data.url; // Redirect to Stripe Checkout
    } else {
      alert("Failed to create checkout session");
    }
  } catch (err) {
    console.error("Checkout error:", err);
  }
});

// --- Refresh Subscription Button ---
refreshBtn?.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) {
    alert("Please sign in first!");
    return;
  }

  try {
    const res = await fetch(`http://localhost:4242/refresh-subscription/${user.uid}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    const data = await res.json();
    if (data.success) {
      // Refresh the UI based on the updated subscription status
      await refreshSubscriptionStatus();
      alert(`Subscription status refreshed: ${data.subscribed ? 'Active' : 'Inactive'}`);
    } else {
      alert("Failed to refresh subscription status");
    }
  } catch (err) {
    console.error("Refresh error:", err);
    alert("Error refreshing subscription status");
  }
});

// --- Cancel Subscription Button ---
cancelBtn?.addEventListener("click", () => {
  const user = auth.currentUser;
  if (!user) {
    alert("Please sign in first!");
    return;
  }

  // Show confirmation modal
  cancelModal.style.display = "block";
});

// --- Modal Event Handlers ---
cancelConfirmNo?.addEventListener("click", () => {
  cancelModal.style.display = "none";
});

cancelConfirmYes?.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return;

  // Hide modal and show loading
  cancelModal.style.display = "none";
  cancelBtn.disabled = true;
  cancelBtn.textContent = "Canceling...";

  try {
    const res = await fetch(`http://localhost:4242/cancel-subscription/${user.uid}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    const data = await res.json();
    if (data.success) {
      alert("Your subscription has been canceled successfully.");
      // Refresh the UI to show the subscription section
      await refreshSubscriptionStatus();
    } else {
      console.error("Cancel subscription failed:", data);
      alert(`Failed to cancel subscription: ${data.error || 'Unknown error'}`);
    }
  } catch (err) {
    console.error("Cancel subscription error:", err);
    if (err.message) {
      alert(`Error canceling subscription: ${err.message}`);
    } else {
      alert("Error canceling subscription. Please check the console for details and try again.");
    }
  } finally {
    // Reset button
    cancelBtn.disabled = false;
    cancelBtn.textContent = "Cancel Subscription";
  }
});

// --- Close modal when clicking outside ---
cancelModal?.addEventListener("click", (e) => {
  if (e.target === cancelModal) {
    cancelModal.style.display = "none";
  }
});
  