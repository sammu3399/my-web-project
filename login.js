document.addEventListener("DOMContentLoaded", () => {
    // Check if user is already logged in
    const currentUser = localStorage.getItem("username");
    if (currentUser) {
        window.location.href = "index.html"; // Redirect to dashboard
    }

    const loginForm = document.getElementById("login-form");

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const usernameInput = document.getElementById("username").value.trim();
        
        if (usernameInput) {
            // Visual flair
            const btn = document.querySelector(".login-btn");
            const originalText = btn.innerHTML;
            btn.innerHTML = "Authenticating... <span class='spinner'></span>";
            btn.disabled = true;

            try {
                // Check if user profile exists in Supabase
                let { data: profile, error } = await _supabase
                    .from('profiles')
                    .select('*')
                    .eq('username', usernameInput)
                    .single();

                // If no profile was found (PGRST116 error or null data), create a new one
                if (!profile) {
                    const { error: insertError } = await _supabase
                        .from('profiles')
                        .insert([{ 
                            username: usernameInput,
                            streak: 0,
                            xp: 0,
                            level: 1,
                            mood: '',
                            pink_mode: false
                        }]);
                    
                    if (insertError) throw insertError;
                } else if (error && error.code !== 'PGRST116') {
                    // Only throw if it's an actual database error, not just a "not found"
                    throw error;
                }

                // Save username to localStorage to establish a "session"
                localStorage.setItem("username", usernameInput);
                
                btn.innerHTML = "Success! Redirecting...";
                btn.style.boxShadow = "0 0 30px var(--success)";
                
                setTimeout(() => {
                    window.location.href = "index.html";
                }, 800);
            } catch (err) {
                console.error("Login Error:", err);
                btn.innerHTML = "Connection Error";
                btn.style.boxShadow = "0 0 30px var(--warning)";
                btn.disabled = false;
                setTimeout(() => { btn.innerHTML = originalText; }, 2000);
            }
        }
    });
});
