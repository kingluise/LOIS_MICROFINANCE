

document.addEventListener('DOMContentLoaded', function() {
    // Function to get the current time and format it
    function updateDateTime() {
        const now = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        const dayName = days[now.getDay()];
        const month = months[now.getMonth()];
        const day = now.getDate();
        const year = now.getFullYear();
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';

        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'

        const dateTimeString = `${dayName}, ${month} ${day}, ${year} ${hours}:${minutes}:${seconds} ${ampm}`;
        return dateTimeString;
    }

    // Function to set the greeting based on the time of day
    function getGreeting() {
        const now = new Date();
        const hours = now.getHours();

        if (hours < 12) {
            return 'Good Morning';
        } else if (hours < 18) {
            return 'Good Afternoon';
        } else {
            return 'Good Evening';
        }
    }

    // Function to update the greeting and time in the dashboard header
    function updateHeader() {
        const greeting = getGreeting();
        const dateTime = updateDateTime();
        const headerElement = document.querySelector('.welcome-message h2');

        // Check login role (using dummy role from localStorage, replace with actual logic)
        const userRole = localStorage.getItem('userRole'); // Replace with actual logic
        const welcomeMessage = userRole === 'admin' ? 'Welcome Admin' : 'Welcome Operator';

        headerElement.innerHTML = `${greeting}, ${welcomeMessage} <br> ${dateTime}`;
    }

    // Update the header immediately and then every second
    updateHeader();
    setInterval(updateHeader, 1000);

    // Remove search bar from the DOM
    const searchBar = document.querySelector('.search-bar');
    if (searchBar) {
        searchBar.remove();
    }

    // Function to fetch and populate dashboard summary cards
    function fetchDashboardSummary() {
        fetch('/api/dashboard/summary') // Replace with your actual endpoint
            .then(response => response.json())
            .then(data => {
                document.getElementById('total-loans').textContent = `₦${data.totalLoans.toLocaleString()}`;
                document.getElementById('pending-loans').textContent = data.pendingLoans;
                document.getElementById('active-loans').textContent = data.activeLoans;
                document.getElementById('overdue-loans').textContent = data.overdueLoans;
                document.getElementById('total-customers').textContent = data.totalCustomers;
                document.getElementById('due-payments').textContent = `₦${data.duePayments.toLocaleString()}`;
                document.getElementById('total-principal').textContent = `₦${data.totalPrincipal.toLocaleString()}`;
                document.getElementById('total-interest').textContent = `₦${data.totalInterest.toLocaleString()}`;
            })
            .catch(error => console.error('Error fetching dashboard summary:', error));
    }

    // Function to fetch and populate transaction table
    function fetchTransactions() {
        const transactionsTable = document.querySelector('.transactions table tbody'); // Target the tbody
        transactionsTable.innerHTML = ''; // Clear existing rows

        fetch('/api/dashboard/transactions?limit=5') // Replace with your actual endpoint and parameters
            .then(response => response.json())
            .then(transactions => {
                transactions.forEach(transaction => {
                    const row = transactionsTable.insertRow();
                    const customerCell = row.insertCell();
                    const amountCell = row.insertCell();
                    const statusCell = row.insertCell();

                    customerCell.textContent = transaction.customerName; // Adjust property name
                    amountCell.textContent = `₦${transaction.amount.toLocaleString()}`; // Adjust property name
                    statusCell.textContent = transaction.status; // Adjust property name
                });
            })
            .catch(error => console.error('Error fetching transactions:', error));
    }

    // Function to fetch and populate loan application chart
    function fetchLoanApplicationsChart() {
        const loanChartCanvas = document.getElementById('loanChart').getContext('2d');
        fetch('/api/dashboard/loan-applications?period=monthly') // Replace with your actual endpoint and parameters
            .then(response => response.json())
            .then(data => {
                new Chart(loanChartCanvas, {
                    type: 'bar',
                    data: {
                        labels: data.labels, // Assuming your backend returns labels (e.g., ['Jan', 'Feb', ...])
                        datasets: [{
                            label: 'Loan Applications',
                            data: data.values, // Assuming your backend returns values ([12, 19, ...])
                            backgroundColor: 'blue',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            })
            .catch(error => console.error('Error fetching loan applications chart data:', error));
    }

    // Fetch data on page load
    fetchDashboardSummary();
    fetchTransactions();
    fetchLoanApplicationsChart();
});
