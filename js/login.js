// js/login.js
document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent default form submission

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    // Dummy login logic (replace with actual authentication later)
    if (role === 'admin') {
        if (email === 'admin@example.com' && password === 'admin123') {
            window.location.href = 'admin_dashboard.html';
        } else {
            alert('Invalid admin credentials.');
        }
    } else if (role === 'operator') {
        if (email === 'operator@example.com' && password === 'operator123') {
            window.location.href = 'operator_dashboard.html';
        } else {
            alert('Invalid operator credentials.');
        }
    } else {
        alert('Please select a role.');
    }
});
