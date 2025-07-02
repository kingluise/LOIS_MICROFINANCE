// notification.js - Updated for Due Repayments Query
// This script handles fetching and displaying loan repayment entries due within a specific date range.

// Ensure API_BASE_URL is defined in apiconfig.js and loaded before this script.
// Example: const API_BASE_URL = 'http://localhost:5279/api';

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const queryDuePaymentsForm = document.getElementById('queryDuePaymentsForm');
    const fromDateInput = document.getElementById('fromDate');
    const toDateInput = document.getElementById('toDate');
    const queryPaymentsButton = document.getElementById('queryPaymentsButton');
    const clearQueryButton = document.getElementById('clearQueryButton');
    const loanNotificationsTableBody = document.querySelector('#loanNotificationsTable tbody');
    const customAlertContainer = document.getElementById('customAlertContainer'); // For custom alerts
    const logoutButton = document.getElementById('logout'); // Logout button reference

    // --- Global Variables (if needed, e.g., for pagination) ---
    // The previous 'allLoans' array and pageSize/page variables for client-side filtering are no longer needed
    // as filtering is now handled by the backend through date parameters.

    // --- Authentication and Error Handling Helpers ---
    function getAuthToken() {
        return localStorage.getItem('jwt_token');
    }

    function handleUnauthorized() {
        showCustomAlert('Your session has expired or you are not authorized. Please log in again.', 'error');
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('jwt_refresh_token');
        setTimeout(() => { window.location.href = 'index.html'; }, 2000);
    }

    function showCustomAlert(message, type = 'info') {
        if (!customAlertContainer) {
            console.log(`Alert (${type}): ${message}`);
            alert(message); // Fallback
            return;
        }

        const alertDiv = document.createElement('div');
        alertDiv.classList.add('custom-alert', `custom-alert-${type}`);
        alertDiv.textContent = message;

        // Basic styling for custom alerts (can be moved to CSS)
        alertDiv.style.padding = '12px 25px';
        alertDiv.style.margin = '20px auto';
        alertDiv.style.borderRadius = '8px';
        alertDiv.style.color = '#fff';
        alertDiv.style.fontWeight = 'bold';
        alertDiv.style.textAlign = 'center';
        alertDiv.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
        alertDiv.style.opacity = '0.95';
        alertDiv.style.position = 'fixed';
        alertDiv.style.top = '0';
        alertDiv.style.left = '50%';
        alertDiv.style.transform = 'translateX(-50%)';
        alertDiv.style.zIndex = '1000';
        alertDiv.style.width = 'fit-content';
        alertDiv.style.minWidth = '300px';
        alertDiv.style.display = 'block';

        switch (type) {
            case 'success': alertDiv.style.backgroundColor = '#4CAF50'; break;
            case 'error': alertDiv.style.backgroundColor = '#f44336'; break;
            case 'warning': alertDiv.style.backgroundColor = '#ff9800'; break;
            case 'info': default: alertDiv.style.backgroundColor = '#2196F3'; break;
        }

        customAlertContainer.appendChild(alertDiv);
        setTimeout(() => { alertDiv.remove(); }, 5000);
    }

    async function handleApiResponse(response) {
        if (response.status === 401) {
            handleUnauthorized();
            throw new Error('Unauthorized');
        }
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.message || (errorData.errors && errorData.errors.join(', ')) || `HTTP error! status: ${response.status}`;
            throw new Error(errorMessage);
        }
        return response.json();
    }

    // --- Core Data Fetching Function ---
    async function fetchDueRepayments() {
        const fromDate = fromDateInput.value;
        const toDate = toDateInput.value;

        if (!fromDate || !toDate) {
            showCustomAlert('Please select both From Date and To Date.', 'warning');
            displayLoans([]); // Clear table and show no results message
            return;
        }

        if (new Date(fromDate) > new Date(toDate)) {
            showCustomAlert('From Date cannot be after To Date.', 'warning');
            displayLoans([]); // Clear table and show no results message
            return;
        }

        const authToken = getAuthToken();
        if (!authToken) {
            handleUnauthorized();
            return;
        }

        loanNotificationsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Loading due repayments...</td></tr>';

        try {
            // Construct URL with from and to query parameters
            const url = `${API_BASE_URL}/customer/loan/paymentplan?from=${fromDate}&to=${toDate}`;
            console.log("Fetching due repayments (GET) from URL:", url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            const data = await handleApiResponse(response);

            // Access responseObject directly as it's an array based on your Swagger response
            if (data.isSuccessful && Array.isArray(data.responseObject)) {
                const duePayments = data.responseObject;
                displayLoans(duePayments); // Display the fetched loans
                if (duePayments.length > 0) {
                    showCustomAlert('Due repayments loaded successfully.', 'success');
                } else {
                    showCustomAlert('No due repayments found for the selected date range.', 'info');
                }
            } else {
                const errorMessage = data.message || 'Failed to retrieve due payments.';
                displayLoans([]); // Show empty results
                showCustomAlert(`Error loading due payments: ${errorMessage}`, 'error');
            }

        } catch (error) {
            console.error('Error fetching due repayments:', error);
            if (error.message !== 'Unauthorized') {
                displayLoans([]); // Show empty results
                showCustomAlert(`Error fetching due repayments: ${error.message || 'Network error'}`, 'error');
            }
        }
    }

    // --- Display Logic ---
    function displayLoans(loans) {
        loanNotificationsTableBody.innerHTML = ''; // Clear existing rows
        if (loans.length === 0) {
            loanNotificationsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No due repayments found for this date range.</td></tr>';
            return;
        }

        loans.forEach(loan => {
            const row = document.createElement('tr');
            const dueDate = loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : 'N/A';
            // Assuming amountPerInstallment exists in the response and is the amount due
            const amountDue = (typeof loan.amountPerInstallment === 'number') ? loan.amountPerInstallment.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' }) : 'N/A';
            const status = loan.isPaid ? 'Paid' : 'Due';

            row.innerHTML = `
                <td>${loan.loanId || 'N/A'}</td>
                <td>${loan.fullname || 'N/A'}</td>
                <td>${amountDue}</td>
                <td>${dueDate}</td>
                <td>${status}</td>
            `;
            if (status === 'Paid') {
                row.classList.add('paid-installment'); // Apply styling for paid installments
            }
            loanNotificationsTableBody.appendChild(row);
        });
    }

    // --- Event Listeners ---
    if (queryDuePaymentsForm) {
        queryDuePaymentsForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Prevent page reload
            fetchDueRepayments(); // Trigger fetch on form submission
        });
    }

    if (clearQueryButton) {
        clearQueryButton.addEventListener('click', () => {
            queryDuePaymentsForm.reset(); // Clear form inputs
            displayLoans([]); // Clear the table display and show initial message
            showCustomAlert('Search fields cleared.', 'info');
        });
    }

    // Logout functionality
    if (logoutButton) {
        logoutButton.addEventListener('click', (event) => {
            event.preventDefault();
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('jwt_refresh_token');
            showCustomAlert('You have been logged out successfully.', 'info');
            setTimeout(() => { window.location.href = 'index.html'; }, 1000);
        });
    }

    // --- Initial Load ---
    // On initial page load, clear the form and table, await user input
    displayLoans([]); // Ensures the table starts with the "Select a date range" message
});
