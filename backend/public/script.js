const authForm = document.getElementById("authForm");
const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");
const authButton = document.getElementById("authButton");
const switchAuth = document.getElementById("switchAuth");
const switchText = document.getElementById("switchText");
const nameGroup = document.getElementById("nameGroup");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const loginSignupStep = document.getElementById("loginSignupStep");
const otpStep = document.getElementById("otpStep");
const otpMessage = document.getElementById("otpMessage");
const otpForm = document.getElementById("otpForm");
const otpInput = document.getElementById("otp");
const otpButton = document.getElementById("otpButton");
const otpTimer = document.getElementById("otpTimer");
const otpBack = document.getElementById("otpBack");

// Same-origin on localhost (frontend + API served by the same Express
// app). Override this if you ever host the frontend separately.
const API_BASE = "/api";

let isSignup = false;
let pendingSignupEmail = null;
let otpCountdownInterval = null;
const OTP_WINDOW_SECONDS = 10 * 60; // must match OTP_EXPIRY_MINUTES in the backend .env

switchAuth.addEventListener("click", function () {
  isSignup = !isSignup;
  applyMode();
});

function applyMode() {
  if (isSignup) {
    authTitle.textContent = "Create your account ✨";
    authSubtitle.textContent = "Start your personalized learning journey today.";
    authButton.textContent = "Create Account";
    switchText.textContent = "Already have an account?";
    switchAuth.textContent = "Login";
    nameGroup.style.display = "block";
    nameInput.required = true;
  } else {
    authTitle.textContent = "Welcome back 👋";
    authSubtitle.textContent = "Login to continue your personalized learning journey.";
    authButton.textContent = "Login";
    switchText.textContent = "Don't have an account?";
    switchAuth.textContent = "Create account";
    nameGroup.style.display = "none";
    nameInput.required = false;
  }
}

function setLoading(isLoading) {
  authButton.disabled = isLoading;
  authButton.textContent = isLoading
    ? "Please wait…"
    : isSignup
    ? "Create Account"
    : "Login";
}

authForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (isSignup) {
    if (!name || !email || !password) {
      alert("Please fill all fields.");
      return;
    }
  } else if (!email || !password) {
    alert("Please enter your email and password.");
    return;
  }

  const endpoint = isSignup ? "/auth/signup" : "/auth/login";
  const payload = isSignup ? { name, email, password } : { email, password };

  setLoading(true);
  try {
    const response = await fetch(API_BASE + endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Something went wrong. Please try again.");
      return;
    }

    if (isSignup) {
      // Account isn't created yet - the backend confirmed the email is
      // real and emailed a one-time code. Switch to the OTP step.
      pendingSignupEmail = email;
      otpMessage.textContent = data.message || `We sent a 6-digit code to ${email}.`;
      authForm.reset();
      showOtpStep();
      return;
    }

    // Login: the token is issued immediately, no OTP step involved.
    localStorage.setItem("learnpathToken", data.token);
    localStorage.setItem("learnpathUser", JSON.stringify(data.user));

    alert("Login successful! 👋");
    authForm.reset();

    // window.location.href = "/dashboard.html";
  } catch (err) {
    console.error("Auth request failed:", err);
    alert("Couldn't reach the server. Please try again.");
  } finally {
    setLoading(false);
  }
});

function showOtpStep() {
  loginSignupStep.style.display = "none";
  otpStep.style.display = "block";
  otpInput.value = "";
  startOtpCountdown();
}

function hideOtpStep() {
  clearInterval(otpCountdownInterval);
  otpStep.style.display = "none";
  loginSignupStep.style.display = "block";
  pendingSignupEmail = null;
}

function startOtpCountdown() {
  clearInterval(otpCountdownInterval);
  let secondsLeft = OTP_WINDOW_SECONDS;

  const render = () => {
    const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
    const seconds = String(secondsLeft % 60).padStart(2, "0");
    otpTimer.textContent = `Code expires in ${minutes}:${seconds}`;
  };

  render();
  otpCountdownInterval = setInterval(function () {
    secondsLeft -= 1;
    if (secondsLeft <= 0) {
      clearInterval(otpCountdownInterval);
      otpTimer.textContent = "Code expired. Please sign up again.";
      return;
    }
    render();
  }, 1000);
}

otpBack.addEventListener("click", function () {
  hideOtpStep();
  isSignup = true;
  applyMode();
});

otpForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const otp = otpInput.value.trim();

  if (!otp) {
    alert("Please enter the code we emailed you.");
    return;
  }

  otpButton.disabled = true;
  otpButton.textContent = "Verifying…";

  try {
    const response = await fetch(API_BASE + "/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: pendingSignupEmail, otp }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Something went wrong. Please try again.");
      return;
    }

    localStorage.setItem("learnpathToken", data.token);
    localStorage.setItem("learnpathUser", JSON.stringify(data.user));

    alert("Account created successfully! 🎉");

    hideOtpStep();
    isSignup = false;
    applyMode();

    // window.location.href = "/dashboard.html";
  } catch (err) {
    console.error("OTP verification failed:", err);
    alert("Couldn't reach the server. Please try again.");
  } finally {
    otpButton.disabled = false;
    otpButton.textContent = "Verify Code";
  }
});
