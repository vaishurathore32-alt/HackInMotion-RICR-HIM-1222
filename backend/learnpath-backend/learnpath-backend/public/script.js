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

// Same-origin on Vercel (frontend + API deployed together). Override this
// if you ever host the frontend separately from the API.
const API_BASE = "/api";

let isSignup = false;

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

    // Store the JWT so future requests can authenticate as this user.
    localStorage.setItem("learnpathToken", data.token);
    localStorage.setItem("learnpathUser", JSON.stringify(data.user));

    alert(isSignup ? "Account created successfully! 🎉" : "Login successful! 👋");

    authForm.reset();

    if (isSignup) {
      isSignup = false;
      applyMode();
    }

    // window.location.href = "/dashboard.html";
  } catch (err) {
    console.error("Auth request failed:", err);
    alert("Couldn't reach the server. Please try again.");
  } finally {
    setLoading(false);
  }
});
