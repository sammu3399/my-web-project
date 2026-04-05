document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("username").value.trim();

        if (username) {
            // Save to localStorage (Traditional simple way)
            localStorage.setItem("username", username);
            
            // Ensure profile exists in Supabase for this username
            try {
                const { data, error } = await _supabase
                    .from('profiles')
                    .select('username')
                    .eq('username', username)
                    .single();

                if (!data || error) {
                    // Create basic profile if it doesn't exist
                    await _supabase.from('profiles').insert([{ 
                        username: username, 
                        streak: 0, 
                        xp: 0, 
                        level: 1 
                    }]);
                }
                
                window.location.href = "index.html";
            } catch (err) {
                console.error("Login Profile Check Error:", err);
                // Still allow login since we have the username local
                window.location.href = "index.html";
            }
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
