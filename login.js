document.addEventListener("DOMContentLoaded", () => {
    // Check if user is already logged in
    const currentUser = localStorage.getItem("username");
    if (currentUser) {
        window.location.href = "index.html"; // Redirect to dashboard
    }

    const loginForm = document.getElementById("login-form");

    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const usernameInput = document.getElementById("username").value.trim();
        
        if (usernameInput) {
            // Save username to localStorage to establish a "session"
            localStorage.setItem("username", usernameInput);
            
            // Add a visual flair before redirecting
            const btn = document.querySelector(".login-btn");
            btn.innerHTML = "Logging in... <span class='spinner'></span>";
            btn.style.boxShadow = "0 0 30px var(--success)";
            
            setTimeout(() => {
                window.location.href = "index.html";
            }, 800); // Slight delay for the animation
        }
    });
});
