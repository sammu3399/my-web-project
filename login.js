document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const usernameInput = document.getElementById("username");
        const username = usernameInput.value.trim();
        const loginBtn = loginForm.querySelector(".login-btn");

        if (!username) return;

        // Visual feedback
        loginBtn.disabled = true;
        loginBtn.textContent = "Authenticating...";

        try {
            // Save to localStorage
            localStorage.setItem("username", username);
            
            // Check if profile exists
            let { data: profile, error } = await _supabase
                .from('profiles')
                .select('*')
                .eq('username', username)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (!profile) {
                // Create profile if missing
                const { error: insertError } = await _supabase
                    .from('profiles')
                    .insert([{ 
                        username: username, 
                        streak: 0, 
                        xp: 0, 
                        level: 1,
                        pink_mode: false
                    }]);
                
                if (insertError) throw insertError;
            }
            
            showToast("🔥 Welcome back, " + username + "!");
            setTimeout(() => {
                window.location.href = "index.html";
            }, 1000);

        } catch (err) {
            console.error("Login Error:", err);
            showToast("❌ Connection error. Check your database columns!");
            loginBtn.disabled = false;
            loginBtn.textContent = "Start Winning";
        }
    });

    // Check if already logged in
    if (localStorage.getItem("username")) {
        window.location.href = "index.html";
    }
});

function showToast(msg) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
