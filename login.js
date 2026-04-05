document.addEventListener("DOMContentLoaded", () => {
    // Check if user is already logged in
    checkSession();

    const loginForm = document.getElementById("login-form");
    const toggleAuthLink = document.getElementById("toggle-auth");
    const forgotPasswordLink = document.getElementById("forgot-password");
    const authTitle = document.getElementById("auth-title");
    const authSubtitle = document.getElementById("auth-subtitle");
    const submitBtn = document.getElementById("submit-btn");
    const usernameGroup = document.getElementById("username-group");

    let isSignUp = false;

    // Toggle between Login and Sign Up
    toggleAuthLink.addEventListener("click", (e) => {
        e.preventDefault();
        isSignUp = !isSignUp;
        
        if (isSignUp) {
            authTitle.textContent = "Create Account";
            authSubtitle.textContent = "Start your journey today ✨";
            submitBtn.textContent = "Sign Up";
            toggleAuthLink.textContent = "Back to Login";
            usernameGroup.style.display = "block";
        } else {
            authTitle.textContent = "Welcome Back";
            authSubtitle.textContent = "Login to continue your streak 🔥";
            submitBtn.textContent = "Start Winning";
            toggleAuthLink.textContent = "Create Account";
            usernameGroup.style.display = "none";
        }
    });

    // Handle Login/Sign Up Form
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();
        const username = document.getElementById("username").value.trim();
        
        submitBtn.disabled = true;
        const originalText = submitBtn.textContent;
        submitBtn.innerHTML = isSignUp ? "Creating... <span class='spinner'></span>" : "Authenticating... <span class='spinner'></span>";

        try {
            if (isSignUp) {
                // SIGN UP
                const { data, error } = await _supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { display_name: username }
                    }
                });
                
                if (error) throw error;
                
                // Create profile row
                await _supabase.from('profiles').insert([{
                    user_id: data.user.id,
                    username: username,
                    streak: 0,
                    xp: 0,
                    level: 1
                }]);

                showToast("🎉 Account created! Please check your email.");
            } else {
                // SIGN IN
                const { error } = await _supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                
                window.location.href = "index.html";
            }
        } catch (err) {
            console.error("Auth Error:", err);
            showToast(`❌ Error: ${err.message}`);
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });

    // Forgot Password
    forgotPasswordLink.addEventListener("click", async (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value.trim();
        if (!email) return showToast("⚠️ Enter your email first!");

        const { error } = await _supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password.html',
        });

        if (error) {
            showToast(`❌ Error: ${error.message}`);
        } else {
            showToast("📧 Reset link sent to your email!");
        }
    });
});

async function checkSession() {
    const { data } = await _supabase.auth.getSession();
    if (data.session) {
        window.location.href = "index.html";
    }
}

function showToast(msg) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}
