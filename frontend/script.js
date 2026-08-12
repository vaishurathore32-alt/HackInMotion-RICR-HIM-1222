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

let isSignup = false;

switchAuth.addEventListener("click", function(){
isSignup = !isSignup;

if(isSignup){
authTitle.textContent = "Create your account ✨";
authSubtitle.textContent = "Start your personalized learning journey today.";
authButton.textContent = "Create Account";
switchText.textContent = "Already have an account?";
switchAuth.textContent = "Login";
nameGroup.style.display = "block";
nameInput.required = true;
}else{
authTitle.textContent = "Welcome back 👋";
authSubtitle.textContent = "Login to continue your personalized learning journey.";
authButton.textContent = "Login";
switchText.textContent = "Don't have an account?";
switchAuth.textContent = "Create account";
nameGroup.style.display = "none";
nameInput.required = false;
}
});

authForm.addEventListener("submit", function(event){
event.preventDefault();

const name = nameInput.value.trim();
const email = emailInput.value.trim();
const password = passwordInput.value.trim();

if(isSignup){

if(!name || !email || !password){
alert("Please fill all fields.");
return;
}

const user = {
name:name,
email:email
};

localStorage.setItem("learnpathUser", JSON.stringify(user));

alert("Account created successfully! 🎉");

}else{

if(!email || !password){
alert("Please enter your email and password.");
return;
}

const savedUser = JSON.parse(localStorage.getItem("learnpathUser"));

if(savedUser && savedUser.email === email){

alert("Login successful! 👋");

}else{

alert("No account found. Please create an account first.");

return;
}
}

authForm.reset();

if(isSignup){
isSignup = false;
authTitle.textContent = "Welcome back 👋";
authSubtitle.textContent = "Login to continue your personalized learning journey.";
authButton.textContent = "Login";
switchText.textContent = "Don't have an account?";
switchAuth.textContent = "Create account";
nameGroup.style.display = "none";
nameInput.required = false;
}
});