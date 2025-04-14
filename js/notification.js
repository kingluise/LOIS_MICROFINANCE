document.addEventListener('DOMContentLoaded', () => {
    const filterDropdown = document.getElementById('filterDropdown');
    const searchBar = document.getElementById('searchBar');
    const loanNotificationsTableBody = document.querySelector('#loanNotificationsTable tbody');

    let allLoans = []; // Store all loans fetched from the API

    // Function to fetch loan notifications from the API
    async function fetchLoanNotifications() {
        try {
            const response = await fetch('/api/loan-notifications');
            if (!response.ok) {
                throw new Error('Failed to fetch loan notifications.');
            }
            allLoans = await response.json();
            displayLoans(allLoans);
        } catch (error) {
            console.error('Error fetching loan notifications:', error);
            alert(error.message);
        }
    }

    // Function to display loans based on filter and search
    function displayLoans(loans) {
        loanNotificationsTableBody.innerHTML = ''; // Clear the table

        loans.forEach(loan => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${loan.loanId}</td>
                <td>${loan.customerId}</td>
                <td>${loan.customerName}</td>
                <td>${loan.loanType}</td>
                <td>${loan.dueDate}</td>
                <td>${loan.amountDue}</td>
            `;
            loanNotificationsTableBody.appendChild(row);
        });
    }

    // Function to filter loans based on dropdown selection
    function filterLoans(filterValue) {
        let filteredLoans = allLoans;

        if (filterValue !== 'all') {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            const twoDaysLater = new Date(today);
            twoDaysLater.setDate(today.getDate() + 2);

            filteredLoans = allLoans.filter(loan => {
                const dueDate = new Date(loan.dueDate);

                if (filterValue === 'dueToday') {
                    return dueDate.toDateString() === today.toDateString();
                } else if (filterValue === 'dueTomorrow') {
                    return dueDate.toDateString() === tomorrow.toDateString();
                } else if (filterValue === 'dueInTwoDays') {
                    return dueDate.toDateString() === twoDaysLater.toDateString();
                }
            });
        }
        displayLoans(filteredLoans);
    }

    // Function to search loans based on customer or loan ID
    function searchLoans(searchTerm) {
        const searchedLoans = allLoans.filter(loan => {
            return loan.customerId.toString().includes(searchTerm) || loan.loanId.toString().includes(searchTerm);
        });
        displayLoans(searchedLoans);
    }

    // Event listeners
    filterDropdown.addEventListener('change', () => {
        filterLoans(filterDropdown.value);
    });

    searchBar.addEventListener('input', () => {
        searchLoans(searchBar.value);
    });

    // Initial load
    fetchLoanNotifications();
});
