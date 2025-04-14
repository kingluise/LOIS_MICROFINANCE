// js/dashboard.js

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

    // Example: Populate dashboard cards (replace with your actual data fetching)
    document.getElementById('total-loans').textContent = '₦150,000';
    document.getElementById('pending-loans').textContent = '5';
    document.getElementById('active-loans').textContent = '10';
    document.getElementById('overdue-loans').textContent = '2';
    document.getElementById('total-customers').textContent = '50';
    document.getElementById('due-payments').textContent = '₦25,000';
    document.getElementById('total-principal').textContent = '₦120,000';
    document.getElementById('total-interest').textContent = '₦30,000';

    // Example: Populate transaction table (replace with your actual data fetching)
    const transactionsTable = document.querySelector('.transactions table');
    const transactions = [
        { customer: 'John Doe', amount: '₦10,000', status: 'Completed' },
        { customer: 'Jane Smith', amount: '₦5,000', status: 'Pending' },
        { customer: 'Alice Johnson', amount: '₦20,000', status: 'Approved' }
    ];

    transactions.forEach(transaction => {
        const row = transactionsTable.insertRow();
        const customerCell = row.insertCell();
        const amountCell = row.insertCell();
        const statusCell = row.insertCell();

        customerCell.textContent = transaction.customer;
        amountCell.textContent = transaction.amount;
        statusCell.textContent = transaction.status;
    });

    // Example: Chart.js (replace with your actual chart data)
    const loanChartCanvas = document.getElementById('loanChart').getContext('2d');
    new Chart(loanChartCanvas, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
            datasets: [{
                label: 'Loan Applications',
                data: [12, 19, 3, 5, 2],
                backgroundColor: 'blue', // Changed to blue
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
});
