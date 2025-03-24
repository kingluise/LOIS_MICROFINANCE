document.addEventListener("DOMContentLoaded", function () {
    // Select the login form
    const loginForm = document.getElementById("login-form");

    if (loginForm) {
        loginForm.addEventListener("submit", function (event) {
            event.preventDefault(); // Prevent page refresh

            // Get user input
            let email = document.getElementById("email").value;
            let password = document.getElementById("password").value;

            // Debugging
            console.log("Email Entered:", email);
            console.log("Password Entered:", password);

            // Dummy login check (replace with real authentication later)
            if (email === "admin@example.com" && password === "password123") {
                console.log("Login successful!");

                // Store user role (for role-based access later)
                localStorage.setItem("userRole", "admin");

                // Redirect to dashboard
                window.location.href = "dashboard.html";
            } else {
                alert("Invalid email or password. Try again.");
            }
        });
    } else {
        console.log("ERROR: Login form not found!");
    }
});
