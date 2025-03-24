document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault(); 

            let email = document.getElementById('email').value;
            let password = document.getElementById('password').value;
            let role = document.getElementById('role').value;

            if (email && password) {
                // Simulate login by storing role in localStorage
                localStorage.setItem("userRole", role);
                window.location.href = "dashboard.html";
            } else {
                alert("Please enter both email and password.");
            }
        });
    }
    document.addEventListener("DOMContentLoaded", () => {
        const apiBaseUrl = "https://api.example.com"; // Replace with actual API endpoint
    
        // Elements for Dashboard Cards
        const totalLoans = document.getElementById("total-loans");
        const pendingLoans = document.getElementById("pending-loans");
        const activeLoans = document.getElementById("active-loans");
        const overdueLoans = document.getElementById("overdue-loans");
        const totalCustomers = document.getElementById("total-customers");
        const duePayments = document.getElementById("due-payments");
        const dueLoans = document.getElementById("due-loans");
        const totalPrincipal = document.getElementById("total-principal");
        const totalInterest = document.getElementById("total-interest");
    
        // Fetch Dashboard Data
        async function fetchDashboardData() {
            try {
                const response = await fetch(`${apiBaseUrl}/dashboard`);
                const data = await response.json();
    
                // Populate Dashboard Cards
                totalLoans.textContent = `₦${data.totalLoans}`;
                pendingLoans.textContent = data.pendingApprovals;
                activeLoans.textContent = data.activeLoans;
                overdueLoans.textContent = data.overdueLoans;
                totalCustomers.textContent = data.totalCustomers;
                duePayments.textContent = `₦${data.duePayments}`;
                dueLoans.textContent = data.dueLoans;
                totalPrincipal.textContent = `₦${data.totalPrincipal}`;
                totalInterest.textContent = `₦${data.totalInterest}`;
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            }
        }
    
        // Fetch Recent Transactions
        async function fetchTransactions() {
            try {
                const response = await fetch(`${apiBaseUrl}/transactions`);
                const transactions = await response.json();
    
                const transactionsTable = document.querySelector(".transactions table");
                transactionsTable.innerHTML = `
                    <tr>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>Status</th>
                    </tr>
                `;
    
                transactions.forEach(transaction => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${transaction.customer}</td>
                        <td>₦${transaction.amount}</td>
                        <td class="${transaction.status.toLowerCase()}">${transaction.status}</td>
                    `;
                    transactionsTable.appendChild(row);
                });
            } catch (error) {
                console.error("Error fetching transactions:", error);
            }
        }
    
        // Fetch Loan Analytics Data and Render Chart
        async function fetchAnalytics() {
            try {
                const response = await fetch(`${apiBaseUrl}/analytics`);
                const data = await response.json();
    
                const ctx = document.getElementById("loanChart").getContext("2d");
                new Chart(ctx, {
                    type: "bar",
                    data: {
                        labels: ["Total Loans", "Pending", "Active", "Overdue"],
                        datasets: [{
                            label: "Loan Statistics",
                            data: [data.totalLoans, data.pendingApprovals, data.activeLoans, data.overdueLoans],
                            backgroundColor: ["#3498db", "#f1c40f", "#2ecc71", "#e74c3c"]
                        }]
                    },
                    options: {
                        responsive: true
                    }
                });
            } catch (error) {
                console.error("Error fetching analytics data:", error);
            }
        }
    
        // Search Functionality
        document.querySelector(".search-bar button").addEventListener("click", () => {
            const query = document.querySelector(".search-bar input").value;
            window.location.href = `${apiBaseUrl}/search?query=${query}`;
        });
    
        // Initialize Fetch Calls
        fetchDashboardData();
        fetchTransactions();
        fetchAnalytics();
    });
    
    // Redirect users based on their roles when they reach the dashboard
    document.addEventListener("DOMContentLoaded", function() {
        let userRole = localStorage.getItem("userRole");

        if (!userRole) {
            alert("You need to log in first!");
            window.location.href = "index.html"; // Redirect to login if not logged in
        }

        document.getElementById("userRoleDisplay").innerText = userRole.toUpperCase();

        // Hide sections based on user role
        if (userRole === "operator") {
            document.getElementById("customers_section").style.display = "none"; // Hide customer management
            document.getElementById("superadmin_section").style.display = "none"; // Hide Super Admin section
        } else if (userRole === "superadmin") {
            document.getElementById("superadmin_section").style.display = "block"; // Show Super Admin menu
        }
    });

    // Logout functionality
    const logoutBtn = document.getElementById("logout");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function() {
            localStorage.removeItem("userRole"); // Clear session
            window.location.href = "index.html"; // Redirect to login
        });
    }
});
