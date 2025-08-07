document.addEventListener("DOMContentLoaded", function () {
    // Fetch dashboard summary
    fetch(`${API_BASE_URL}/dashboard/summary`)
        .then(response => {
            if (!response.ok) throw new Error("Failed to fetch dashboard data.");
            return response.json();
        })
        .then(data => {
            if (!data.isSuccessful || !data.responseObject) {
                console.error("Dashboard API Error:", data.message);
                return;
            }

            const summary = data.responseObject;

            // Set dashboard card values
            document.getElementById("total-loans").textContent = summary.totalLoans;
            document.getElementById("pending-loans").textContent = summary.pendingLoans;
            document.getElementById("active-loans").textContent = summary.activeLoans;
            document.getElementById("overdue-loans").textContent = summary.overdueLoans;
            document.getElementById("total-customers").textContent = summary.totalCustomers;
            document.getElementById("due-payments").textContent = `₦${formatCurrency(summary.duePaymentsToday)}`;
            document.getElementById("total-principal").textContent = `₦${formatCurrency(summary.totalPrincipal)}`;
            document.getElementById("total-interest").textContent = `₦${formatCurrency(summary.totalInterest)}`;

            // Populate recent approved transactions
            populateTransactions(summary.recentTransactions);

            // Render loan chart
            renderLoanChart(summary.loanAnalytics.labels, summary.loanAnalytics.values);
        })
        .catch(error => {
            console.error("Error loading dashboard:", error);
        });

    // Only run typewriter greeting ONCE
    const greeting = getGreeting();
    const message = `${greeting}, Welcome to Lois Microfinance Loan Management System`;
    typeGreetingOnce(message);

    // Start clock updates
    updateTimeDisplay();
    setInterval(updateTimeDisplay, 1000); // Update every second
});

// Format currency to NGN
function formatCurrency(amount) {
    return Number(amount).toLocaleString("en-NG", { minimumFractionDigits: 2 });
}

// Populate Recent Transactions Table
function populateTransactions(transactions) {
    const table = document.querySelector(".transactions table");
    transactions.forEach(tx => {
        const row = document.createElement("tr");

        const customer = document.createElement("td");
        customer.textContent = tx.customer;

        const amount = document.createElement("td");
        amount.textContent = `₦${formatCurrency(tx.amount)}`;

        const status = document.createElement("td");
        status.textContent = tx.status;

        row.appendChild(customer);
        row.appendChild(amount);
        row.appendChild(status);

        table.appendChild(row);
    });
}

// Render Loan Chart
function renderLoanChart(labels, values) {
    const ctx = document.getElementById("loanChart").getContext("2d");
    new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Loans Applied Per Month",
                data: values,
                backgroundColor: "rgba(54, 162, 235, 0.6)",
                borderColor: "rgba(54, 162, 235, 1)",
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0 }
                }
            }
        }
    });
}

// Time clock updater (runs every second)
function updateTimeDisplay() {
    const now = new Date();
    const formattedTime = now.toLocaleString('en-NG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    const dateTimeElement = document.getElementById("dateTimeDisplay");
    if (dateTimeElement) dateTimeElement.textContent = formattedTime;
}

// Dynamic greeting based on hour
function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}

// Typewriter effect that runs only once
function typeGreetingOnce(message) {
    const element = document.getElementById("greetingText");
    if (!element) return;

    element.textContent = '';
    element.classList.add('typing');

    let index = 0;

    const typeChar = () => {
        if (index < message.length) {
            element.textContent += message.charAt(index);
            index++;
            setTimeout(typeChar, 80); // control speed here
        } else {
            element.classList.remove('typing'); // stop blinking cursor
        }
    };

    typeChar();
}
