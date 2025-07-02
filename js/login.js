// js/login.js

// Ensure API_BASE_URL is defined in js/config.js
// Example: const API_BASE_URL = 'http://localhost:5279';

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const roleSelect = document.getElementById('role');

    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault(); // Prevent default form submission

        const email = emailInput.value;
        const password = passwordInput.value;
        const role = roleSelect.value; // Get the selected role from the dropdown

        if (!email || !password || !role) {
            alert('Please fill in all fields (Email, Password, and Role).');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/authentication/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    role: role // Send the role selected by the user
                })
            });

            const data = await response.json(); // Parse the JSON response from the API

            // Check the 'isSuccessful' flag in the response object
            if (data.isSuccessful) {
                console.log('Login successful:', data);

                const responseObject = data.responseObject;

                if (responseObject && responseObject.jwt) {
                    // Store the JWT token and refresh token
                    localStorage.setItem('jwt_token', responseObject.jwt);
                    localStorage.setItem('jwt_refresh_token', responseObject.jwtRefreshToken);
                    console.log('JWT Token stored:', responseObject.jwt);
                    console.log('Refresh Token stored:', responseObject.jwtRefreshToken);

                    // Get the user's role from the API response
                    const userRoleFromAPI = responseObject.role;

                    // Redirect based on the role received from the API
                    if (userRoleFromAPI === 'admin') {
                        window.location.href = 'admin_dashboard.html';
                    } else if (userRoleFromAPI === 'operator') {
                        window.location.href = 'operator_dashboard.html';
                    } else {
                        // Fallback or error if role from API is unexpected
                        alert(`Login successful, but unexpected user role: ${userRoleFromAPI}. Redirecting to a default page.`);
                        window.location.href = 'default_dashboard.html'; // Or some other default page
                    }
                } else {
                    alert('Login successful, but no token or response object found in the server response.');
                }

            } else {
                // Handle API errors based on 'isSuccessful' being false
                const errorMessage = data.errors && data.errors.length > 0
                                   ? data.errors.join(', ')
                                   : data.message || 'Unknown login error.';
                console.error('Login failed:', errorMessage);
                alert(`Login failed: ${errorMessage}`);
            }

        } catch (error) {
            // Handle network errors (e.g., server not reachable, CORS issues)
            console.error('Network error during login:', error);
            alert('An error occurred during login. Please check your network and try again. If the issue persists, contact support.');
        }
    });
});
