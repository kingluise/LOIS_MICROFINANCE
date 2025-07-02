// payment.js - Updated Code for Payment Management
// Now accepts Loan ID directly for fetching loan details and payment plan.
// Includes integration for fetching specific loan payment plans and preparing for payment logging with paymentPlanId.
// Replaced native alerts with a custom simple alert/toast system.
// Removed display of total balance and new loan balance.
// Adjusted payment payload to match backend's expected structure (loanId, amount, currencyCode, repaymentId).
// FIX: Improved error handling in handleApiResponse to safely process backend error responses.
// FIX: Corrected property access from paymentLog.id to paymentLog.paymentLogId to match backend DTO.
// NEW: Added functionality to display customer names with loan IDs from /api/customer/search endpoint.
// FIX: Corrected displaying of full Loan IDs in customer summaries.

// Ensure API_BASE_URL is defined in apiconfig.js and loaded before this script.
// Example: const API_BASE_URL = 'http://localhost:5279/api';

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const logPaymentBtn = document.getElementById('logPaymentBtn');
    const paymentConfirmationBtn = document.getElementById('paymentConfirmationBtn');
    // NEW: Customer Summaries button
    const viewCustomersBtn = document.getElementById('viewCustomersBtn');

    const logPaymentForm = document.getElementById('logPaymentForm');
    const confirmationTableContainer = document.getElementById('confirmationTableContainer');
    // NEW: Customer Summaries Section
    const customerSummariesSection = document.getElementById('customerSummariesSection');

    const paymentForm = document.getElementById('paymentForm');
    const cancelLogPayment = document.getElementById('cancelLogPayment');
    const goBackBtn = document.getElementById('goBackBtn');
    // NEW: Go back button for customer summaries
    const customerSummariesGoBackBtn = document.getElementById('customerSummariesGoBackBtn');

    const confirmationTableBody = document.querySelector('#confirmationTable tbody');

    // Custom Alert/Toast Elements (assuming these exist in your HTML)
    const customAlertContainer = document.getElementById('customAlertContainer');
    if (!customAlertContainer) {
        console.warn('Element with ID "customAlertContainer" not found. Alerts will default to console.');
    }

    // Form fields specific to Log Payment - LoanIdInput is now primary
    const loanIdInput = document.getElementById('loanIdInput'); // Changed from customerIdInput
    const fullNameInput = document.getElementById('fullName');
    const loanTypeInput = document.getElementById('loanType');
    const loanAmountInput = document.getElementById('loanAmount');
    const amountPaidInput = document.getElementById('amountPaid');
    const modeOfPaymentInput = document.getElementById('modeOfPayment');
    const paymentDateInput = document.getElementById('paymentDate');

    // New DOM elements for Payment Plan display and selection
    const paymentPlanContainer = document.getElementById('paymentPlanContainer');
    const paymentPlanTableBody = document.querySelector('#paymentPlanTable tbody');
    const selectedPaymentPlanItemIdInput = document.getElementById('selectedPaymentPlanItemId');

    // NEW: Customer Summaries Section Elements
    const customerSearchInput = document.getElementById('customerSearchInput');
    const customerSearchBtn = document.getElementById('customerSearchBtn');
    const customerSummariesTableBody = document.getElementById('customerSummariesTableBody');
    const customerSummariesPagination = document.getElementById('customerSummariesPagination');


    // --- Global Variables ---
    let currentPaymentData = null;
    let currentActiveLoan = null; // Variable to store the fetched active loan object (entire loan details)
    let currentPaymentPlan = []; // Variable to store the fetched payment plan items
    let currentPage = 1; // For Payment Confirmation pagination
    const pageSize = 10;

    // NEW: Global variables for Customer Summaries pagination
    let currentCustomerSummaryPage = 1;
    const customerSummaryPageSize = 10;

    // --- Get loanId from URL (if navigating from loan-details) ---
    const urlParams = new URLSearchParams(window.location.search);
    const initialLoanIdFromURL = urlParams.get('loanId');

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

        alertDiv.style.padding = '10px';
        alertDiv.style.margin = '10px 0';
        alertDiv.style.borderRadius = '5px';
        alertDiv.style.color = 'white';
        alertDiv.style.textAlign = 'center';
        alertDiv.style.position = 'fixed';
        alertDiv.style.top = '20px';
        alertDiv.style.left = '50%';
        alertDiv.style.transform = 'translateX(-50%)';
        alertDiv.style.zIndex = '1000';
        alertDiv.style.width = 'fit-content';
        alertDiv.style.minWidth = '300px';
        alertDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
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
            // Improved error message extraction
            let errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
            if (errorData.errors) {
                // Check if errorData.errors is an array before joining
                if (Array.isArray(errorData.errors)) {
                    errorMessage = errorData.errors.join(', ');
                } else if (typeof errorData.errors === 'string') {
                    errorMessage = errorData.errors;
                } else if (typeof errorData.errors === 'object' && errorData.errors !== null) {
                    // Handle common validation error structures where errors might be an object
                    // e.g., { "fieldName": ["Error message 1", "Error message 2"] }
                    const detailedErrors = Object.values(errorData.errors)
                        .flat() // Flatten any nested arrays of error messages
                        .filter(msg => typeof msg === 'string') // Ensure only strings are processed
                        .join('; ');
                    if (detailedErrors) {
                        errorMessage = detailedErrors;
                    }
                }
            }
            throw new Error(errorMessage);
        }
        return response.json();
    }

    /**
     * Hides all main content sections.
     */
    function hideAllSections() {
        logPaymentForm.classList.add('hidden');
        confirmationTableContainer.classList.add('hidden');
        customerSummariesSection.classList.add('hidden'); // NEW: Hide customer summaries section
    }

    // --- Form Logic Helpers ---

    /**
     * Clears all auto-populated loan-related fields in the form and the payment plan.
     */
    function clearLoanFields() {
        fullNameInput.value = '';
        loanTypeInput.value = '';
        loanAmountInput.value = '';
        amountPaidInput.value = '';
        paymentDateInput.value = '';
        modeOfPaymentInput.value = 'Cash';
        currentActiveLoan = null;
        currentPaymentPlan = [];
        if (paymentPlanTableBody) paymentPlanTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Enter Loan ID to load payment plan.</td></tr>'; // Reset initial message
        if (selectedPaymentPlanItemIdInput) selectedPaymentPlanItemIdInput.value = '';
    }

    /**
     * Shows a confirmation modal/dialog before submitting payment.
     * Uses custom alert/confirm for better UX.
     * @param {object} data - The payment data to confirm.
     * @param {function} callback - Callback function (confirmed: boolean, data: object).
     */
    function showPreSubmitConfirmationModal(data, callback) {
        const currencyDisplay = data.currencyCode ? ` (${data.currencyCode})` : '';
        const confirmationMessage = `Please confirm the payment details:\n\n` +
            `Loan ID: ${data.loanId}\n` +
            `Amount: ${data.amount.toFixed(2)}${currencyDisplay}\n` +
            `Repayment ID: ${data.repaymentId || 'N/A'}\n\n` +
            `Do you want to proceed?`;

        if (confirm(confirmationMessage)) {
            callback(true, data);
        } else {
            callback(false, null);
        }
    }

    /**
     * Shows the payment plan container. (No longer explicitly needed for 'hidden' class removal, but can be used for other visual states)
     */
    function showPaymentPlanSection() {
        if (paymentPlanContainer) {
            // paymentPlanContainer.classList.remove('hidden'); // Removed as per HTML change
        }
    }

    /**
     * Hides the payment plan container. (Use if you need to dynamically hide it)
     */
    function hidePaymentPlanSection() {
        if (paymentPlanContainer) {
            // paymentPlanContainer.classList.add('hidden'); // Removed as per HTML change
        }
    }

    // --- Auto-Population Logic for Log Payment Form ---

    // Event listener for loanIdInput: fetches loan and payment plan details on blur
    loanIdInput.addEventListener('blur', async () => { // Changed from customerIdInput
        const loanId = loanIdInput.value.trim(); // Get Loan ID
        clearLoanFields(); // Clear previous data when loanId changes or is cleared

        if (!loanId) {
            return; // Exit if loan ID is empty
        }

        const authToken = getAuthToken();
        if (!authToken) {
            handleUnauthorized();
            return;
        }

        try {
            showCustomAlert('Fetching loan and customer details...', 'info');

            // 1. Fetch Loan Details for this specific Loan ID
            const loanUrl = `${API_BASE_URL}/customer/loan/${loanId}`; // Endpoint to get single loan by ID
            console.log("Fetching loan details (GET) from URL:", loanUrl);

            const loanResponse = await fetch(loanUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            const loanDataWrapper = await handleApiResponse(loanResponse);
            const activeLoan = loanDataWrapper.responseObject; // Assuming direct loan object if successful

            if (activeLoan && activeLoan.id) { // Check if loan object is valid
                currentActiveLoan = activeLoan; // Store the active loan object

                // Populate loan fields
                loanTypeInput.value = activeLoan.loanGroup || '';
                loanAmountInput.value = activeLoan.amount ? activeLoan.amount.toFixed(2) : '';

                // 2. Fetch Customer Details for Full Name using customerId from the loan
                if (activeLoan.customerId) {
                    const customerResponse = await fetch(`${API_BASE_URL}/customer/${activeLoan.customerId}`, {
                        headers: {
                            'Authorization': `Bearer ${authToken}`
                        }
                    });
                    const customerData = await handleApiResponse(customerResponse);
                    if (customerData.isSuccessful && customerData.responseObject) {
                        fullNameInput.value = customerData.responseObject.fullName || '';
                    } else {
                        fullNameInput.value = 'Customer Not Found'; // Indicate if customer details couldn't be loaded
                        showCustomAlert('Could not find customer details for this loan.', 'warning');
                    }
                } else {
                    fullNameInput.value = 'Customer ID Missing for Loan';
                    showCustomAlert('Loan record is missing customer ID.', 'warning');
                }

                showCustomAlert('Loan and customer details loaded successfully.', 'success');

                // 3. Fetch Payment Plan for the Active Loan
                await fetchAndDisplayPaymentPlan(activeLoan.id);

            } else {
                showCustomAlert('No loan found for this Loan ID, or details are incomplete. Please check the Loan ID.', 'info');
                clearLoanFields();
                fullNameInput.value = ''; // Ensure full name is cleared
                return;
            }

        } catch (error) {
            console.error('Error auto-populating form:', error);
            if (error.message !== 'Unauthorized') {
                showCustomAlert(`Error fetching details: ${error.message || 'An unknown error occurred.'} Please check the Loan ID.`, 'error');
            }
            clearLoanFields();
            fullNameInput.value = '';
            return;
        }
    });

    /**
     * Fetches and displays the payment plan for a given loanId.
     * @param {string} loanId - The ID of the loan to fetch the payment plan for.
     */
    async function fetchAndDisplayPaymentPlan(loanId) {
        if (!paymentPlanTableBody) {
            console.error('Payment plan table body element not found. Cannot display plan.');
            showCustomAlert('UI error: Cannot display payment plan. Missing table element.', 'error');
            return;
        }

        paymentPlanTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Loading payment plan...</td></tr>';
        showPaymentPlanSection(); // Ensure the container is visible (it's no longer hidden by default)

        const authToken = getAuthToken();
        if (!authToken) {
            handleUnauthorized();
            return;
        }

        try {
            const url = `${API_BASE_URL}/customer/loan/${loanId}/paymentplan`;
            console.log("Fetching payment plan (GET) from URL:", url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            const data = await handleApiResponse(response);
            console.log("Payment plan API raw response data:", data);

            paymentPlanTableBody.innerHTML = ''; // Clear loading message

            if (data.isSuccessful && data.responseObject && Array.isArray(data.responseObject)) {
                currentPaymentPlan = data.responseObject;
                console.log("Processed currentPaymentPlan:", currentPaymentPlan);
                console.log("Number of items in payment plan:", currentPaymentPlan.length);

                if (currentPaymentPlan.length > 0) {
                    currentPaymentPlan.forEach((item, index) => {
                        const row = paymentPlanTableBody.insertRow();
                        const dueDate = item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'N/A';
                        const amountDue = (typeof item.amountPerInstallment === 'number') ? item.amountPerInstallment.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' }) : 'N/A';
                        const status = item.isPaid ? 'Paid' : 'Due';
                        const paymentPlanItemId = item.id;

                        row.innerHTML = `
                            <td>${dueDate}</td>
                            <td>${amountDue}</td>
                            <td>${status}</td>
                            <td>
                                <input type="radio" name="selectPaymentItem" class="payment-item-radio"
                                       data-payment-plan-item-id="${paymentPlanItemId}"
                                       data-amount-due="${item.amountPerInstallment}"
                                       id="paymentItem${index}"
                                       ${status === 'Paid' ? 'disabled' : ''}>
                                <label for="paymentItem${index}">Select</label>
                            </td>
                        `;
                        if (status === 'Paid') {
                            row.classList.add('paid-installment');
                        }
                    });

                    document.querySelectorAll('.payment-item-radio').forEach(radio => {
                        radio.addEventListener('change', (event) => {
                            if (event.target.checked) {
                                selectedPaymentPlanItemIdInput.value = event.target.dataset.paymentPlanItemId;
                                amountPaidInput.value = event.target.dataset.amountDue;
                            }
                        });
                    });

                    showCustomAlert('Payment plan loaded successfully.', 'success');

                } else {
                    paymentPlanTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No payment plan found for this loan.</td></tr>';
                    showCustomAlert('No payment plan found for this loan.', 'info');
                    // hidePaymentPlanSection(); // No longer hiding the container completely
                }
            } else {
                const errorMessage = data.message || 'Failed to retrieve payment plan.';
                paymentPlanTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: red;">Error: ${errorMessage}</td></tr>`;
                showCustomAlert(`Error loading payment plan: ${errorMessage}`, 'error');
                // hidePaymentPlanSection(); // No longer hiding the container completely
            }

        } catch (error) {
            console.error('Error fetching payment plan:', error);
            if (error.message !== 'Unauthorized') {
                paymentPlanTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: red;">Error loading payment plan: ${error.message || 'Network error'}</td></tr>`;
                showCustomAlert(`Error loading payment plan: ${error.message || 'Network error'}`, 'error');
            }
            // hidePaymentPlanSection(); // No longer hiding the container completely
        }
    }


    // --- Button Click Handlers (View Toggling) ---
    logPaymentBtn.addEventListener('click', () => {
        hideAllSections(); // Hide all sections first
        logPaymentForm.classList.remove('hidden');
        paymentForm.reset();
        clearLoanFields();
        currentPaymentData = null;
        if (initialLoanIdFromURL) {
            loanIdInput.value = initialLoanIdFromURL.trim();
            loanIdInput.dispatchEvent(new Event('blur')); // Trigger blur to load details
        }
    });

    paymentConfirmationBtn.addEventListener('click', () => {
        hideAllSections(); // Hide all sections first
        confirmationTableContainer.classList.remove('hidden');
        currentPage = 1;
        fetchPendingPayments(currentPage);
    });

    // NEW: Event listener for the "Customers" button
    viewCustomersBtn.addEventListener('click', () => {
        hideAllSections(); // Hide all sections first
        customerSummariesSection.classList.remove('hidden');
        currentCustomerSummaryPage = 1; // Reset to first page
        customerSearchInput.value = ''; // Clear search input
        fetchAndRenderCustomerSummaries(currentCustomerSummaryPage, ''); // Load all customers initially
    });


    // --- Payment Form Submission ---
    paymentForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const authToken = getAuthToken();
        if (!authToken) {
            handleUnauthorized();
            return;
        }

        // Basic client-side validation remains for user input
        if (isNaN(parseFloat(amountPaidInput.value)) || parseFloat(amountPaidInput.value) <= 0) {
            showCustomAlert('Please enter a valid positive amount for payment.', 'warning');
            return;
        }

        // Ensure we have an active loan and a selected payment plan item
        if (!currentActiveLoan || !currentActiveLoan.id || !currentActiveLoan.currencyCode) {
            showCustomAlert('Cannot log payment: Loan details are missing. Please ensure a valid Loan ID is entered and loan details are loaded.', 'error');
            return;
        }

        const selectedPaymentPlanItemId = selectedPaymentPlanItemIdInput.value;
        if (!selectedPaymentPlanItemId) {
            showCustomAlert('Please select a payment installment from the plan to log this payment against.', 'warning');
            return;
        }

        const paymentData = {
            loanId: currentActiveLoan.id,
            amount: parseFloat(amountPaidInput.value),
            currencyCode: currentActiveLoan.currencyCode,
            repaymentId: selectedPaymentPlanItemId
        };

        console.log('Submitting payment data:', paymentData);

        showPreSubmitConfirmationModal(paymentData, async (confirmed, dataToSubmit) => {
            if (confirmed && dataToSubmit) {
                try {
                    const response = await fetch(`${API_BASE_URL}/paymentlog`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authToken}`
                        },
                        body: JSON.stringify(dataToSubmit)
                    });

                    const responseData = await handleApiResponse(response);

                    showCustomAlert(responseData.message || 'Payment log created successfully!', 'success');
                    paymentForm.reset();
                    clearLoanFields();

                    hideAllSections(); // Hide current section
                    confirmationTableContainer.classList.remove('hidden'); // Show confirmation table
                    currentPage = 1;
                    fetchPendingPayments(currentPage);
                    currentPaymentData = null;

                } catch (error) {
                    console.error('Error creating payment log:', error);
                    if (error.message !== 'Unauthorized') {
                        showCustomAlert(`Failed to create payment log: ${error.message || 'Unknown error'}. Please try again.`, 'error');
                    }
                }
            }
        });
    });

    // Handle cancel button on the log payment form: reset form and hide it
    cancelLogPayment.addEventListener('click', () => {
        paymentForm.reset();
        clearLoanFields();
        hideAllSections(); // Hide current section
        // Optionally, return to a default view or previous view
        logPaymentForm.classList.remove('hidden'); // Go back to log payment form
        currentPaymentData = null;
    });

    // Handle "Go Back" button on the confirmation table: show log payment form
    goBackBtn.addEventListener('click', () => {
        hideAllSections(); // Hide current section
        logPaymentForm.classList.remove('hidden'); // Show log payment form
        paymentForm.reset();
        clearLoanFields();
    });

    // NEW: Handle "Go Back" button on the customer summaries table: show log payment form
    customerSummariesGoBackBtn.addEventListener('click', () => {
        hideAllSections(); // Hide current section
        logPaymentForm.classList.remove('hidden'); // Show log payment form
        paymentForm.reset();
        clearLoanFields();
    });

    // --- Functions for Pending Payments Table ---

    /**
     * Fetches and displays pending payment logs in the confirmation table.
     * @param {number} page - The page number to fetch.
     */
    async function fetchPendingPayments(page) {
        confirmationTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Loading pending payments...</td></tr>';
        clearPagination(document.getElementById('pagination')); // Clear pagination for this section

        const authToken = getAuthToken();
        if (!authToken) {
            handleUnauthorized();
            confirmationTableBody.innerHTML = '<tr><td colspan="7" style="color: red;">Authentication required to view payments.</td></tr>';
            return;
        }

        try {
            const url = `${API_BASE_URL}/paymentlog/pagenumber/${page}/pagesize/${pageSize}?status=Pending_Approver_Review`;
            console.log("Fetching pending payment logs (GET) from URL:", url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            const data = await handleApiResponse(response);

            confirmationTableBody.innerHTML = '';

            const paymentLogs = data.responseObject?.items;
            const totalRecords = data.responseObject?.totalCount;

            if (paymentLogs && Array.isArray(paymentLogs) && paymentLogs.length > 0) {
                paymentLogs.forEach(paymentLog => {
                    // --- DIAGNOSIS: Log the ID here to check what the backend is sending ---
                    // Corrected to use paymentLog.paymentLogId
                    console.log(`Processing paymentLog ID: ${paymentLog.paymentLogId}`);

                    const row = confirmationTableBody.insertRow();
                    const amountPaidDisplay = (typeof paymentLog.amountPaid === 'number') ? paymentLog.amountPaid.toFixed(2) : 'N/A';
                    row.innerHTML = `
                        <td>${paymentLog.paymentLogId || 'N/A'}</td>
                        <td>${paymentLog.loanId || 'N/A'}</td>
                        <td>${amountPaidDisplay}</td>
                        <td>${paymentLog.dateLogged ? new Date(paymentLog.dateLogged).toLocaleDateString() : 'N/A'}</td>
                        <td>${paymentLog.loggedBy || 'N/A'}</td>
                        <td>${paymentLog.status || 'N/A'}</td>
                        <td>
                            <button class="acceptPayment" data-payment-log-id="${paymentLog.paymentLogId}">Accept</button>
                            <button class="declinePayment" data-payment-log-id="${paymentLog.paymentLogId}">Decline</button>
                        </td>
                    `;
                });
                displayPagination(totalRecords, page, document.getElementById('pagination'), 'pendingPayments');
            } else {
                confirmationTableBody.innerHTML = '<tr><td colspan="7">No pending payments found.</td></tr>';
                clearPagination(document.getElementById('pagination'));
            }
        } catch (error) {
            console.error('Error fetching pending payments:', error);
            if (error.message !== 'Unauthorized') {
                showCustomAlert(`Failed to fetch pending payments: ${error.message || 'Unknown error'}. Please try again.`, 'error');
            }
            confirmationTableBody.innerHTML = '<tr><td colspan="7" style="color: red;">Error loading payments.</td></tr>';
            clearPagination(document.getElementById('pagination'));
        }
    };

    // Event listener for Accept/Decline buttons on the confirmation table
    confirmationTableBody.addEventListener('click', async (event) => {
        const target = event.target;
        // Corrected to use paymentLog.paymentLogId
        const paymentLogId = target.dataset.paymentLogId;

        // --- IMPORTANT: Check if paymentLogId is valid before proceeding ---
        if (!paymentLogId || paymentLogId === 'N/A' || paymentLogId === 'undefined' || paymentLogId === 'null' || paymentLogId === '00000000-0000-0000-0000-000000000000') {
            console.error('Attempted to accept/decline payment with invalid ID:', paymentLogId);
            showCustomAlert('Cannot process payment: Invalid Payment Log ID. Please refresh and try again.', 'error');
            return; // Stop execution if ID is invalid
        }

        const authToken = getAuthToken();
        if (!authToken) {
            handleUnauthorized();
            return;
        }

        let endpoint = '';
        let successMessage = '';
        let errorMessage = '';

        if (target.classList.contains('acceptPayment')) {
            endpoint = `${API_BASE_URL}/paymentlog/${paymentLogId}/approve`;
            successMessage = 'Payment accepted and system updated.';
            errorMessage = 'Failed to accept payment.';
            if (!confirm('Are you sure you want to accept this payment?')) return;
        } else if (target.classList.contains('declinePayment')) {
            endpoint = `${API_BASE_URL}/paymentlog/${paymentLogId}/decline`;
            successMessage = 'Payment declined.';
            errorMessage = 'Failed to decline payment.';
            if (!confirm('Are you sure you want to decline this payment?')) return;
        } else {
            return;
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            const data = await handleApiResponse(response);

            showCustomAlert(data.message || successMessage, 'success');
            // After successful action, re-fetch the pending payments to update the table
            fetchPendingPayments(currentPage);
        } catch (error) {
            console.error(`Error ${target.classList.contains('acceptPayment') ? 'accepting' : 'declining'} payment:`, error);
            if (error.message !== 'Unauthorized') {
                showCustomAlert(`${errorMessage} ${error.message || ''}. Please try again.`, 'error');
            }
        }
    });

    // --- NEW: Functions for Customer Summaries Table ---

    /**
     * Fetches and displays customer summaries (name and loan IDs).
     * @param {number} page - The page number to fetch.
     * @param {string} searchTerm - Optional search term for customer full name.
     */
    async function fetchAndRenderCustomerSummaries(page, searchTerm = '') {
        customerSummariesTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Loading customers...</td></tr>';
        clearPagination(customerSummariesPagination);

        const authToken = getAuthToken();
        if (!authToken) {
            handleUnauthorized();
            customerSummariesTableBody.innerHTML = '<tr><td colspan="3" style="color: red;">Authentication required to view customers.</td></tr>';
            return;
        }

        try {
            const url = `${API_BASE_URL}/customer/search`; // Using POST /api/customer/search
            console.log("Fetching customer summaries (POST) from URL:", url);

            const requestBody = {
                pageNumber: page,
                pageSize: customerSummaryPageSize,
                // Only include fullName if a search term is provided
                ...(searchTerm && { fullName: searchTerm })
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(requestBody)
            });

            const data = await handleApiResponse(response);

            customerSummariesTableBody.innerHTML = ''; // Clear loading message

            const customers = data.responseObject?.items;
            const totalRecords = data.responseObject?.totalCount;

            if (customers && Array.isArray(customers) && customers.length > 0) {
                customers.forEach(customer => {
                    const row = customerSummariesTableBody.insertRow();
                    // Format Loan IDs as a comma-separated list or a list of tags
                    // FIX: Changed map to display full loan ID instead of shortened
                    const loanIdsHtml = customer.loanIds && customer.loanIds.length > 0
                        ? `<ul class="loan-id-list">${customer.loanIds.map(id => `<li>${id}</li>`).join('')}</ul>`
                        : 'N/A';

                    row.innerHTML = `
                        <td>${customer.fullName || 'N/A'}</td>
                        <td>${customer.phonenumber || 'N/A'}</td>
                        <td>${loanIdsHtml}</td>
                    `;
                });
                displayPagination(totalRecords, page, customerSummariesPagination, 'customerSummaries');
                showCustomAlert('Customer summaries loaded successfully.', 'success');
            } else {
                customerSummariesTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">No customers found.</td></tr>';
                showCustomAlert('No customers found with the given criteria.', 'info');
                clearPagination(customerSummariesPagination);
            }
        } catch (error) {
            console.error('Error fetching customer summaries:', error);
            if (error.message !== 'Unauthorized') {
                showCustomAlert(`Failed to fetch customer summaries: ${error.message || 'Unknown error'}.`, 'error');
            }
            customerSummariesTableBody.innerHTML = '<tr><td colspan="3" style="color: red;">Error loading customers.</td></tr>';
            clearPagination(customerSummariesPagination);
        }
    }

    // Event listener for customer search button
    customerSearchBtn.addEventListener('click', () => {
        currentCustomerSummaryPage = 1; // Reset to first page on new search
        fetchAndRenderCustomerSummaries(currentCustomerSummaryPage, customerSearchInput.value.trim());
    });

    // Optional: Live search on input (debounce for performance)
    let searchTimeout;
    customerSearchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentCustomerSummaryPage = 1; // Reset to first page on new search
            fetchAndRenderCustomerSummaries(currentCustomerSummaryPage, customerSearchInput.value.trim());
        }, 500); // Debounce for 500ms
    });


    // --- Pagination Functions ---
    /**
     * Displays pagination controls for a given table.
     * @param {number} totalRecords - Total number of records.
     * @param {number} currentPage - The current active page.
     * @param {HTMLElement} paginationContainer - The DOM element to render pagination into.
     * @param {string} type - A string to differentiate pagination calls (e.g., 'pendingPayments', 'customerSummaries').
     */
    function displayPagination(totalRecords, currentPage, paginationContainer, type) {
        const effectivePageSize = (type === 'customerSummaries') ? customerSummaryPageSize : pageSize;
        const totalPages = Math.ceil(totalRecords / effectivePageSize);
        paginationContainer.innerHTML = '';
        paginationContainer.style.marginTop = '20px';
        paginationContainer.style.textAlign = 'center';

        if (totalPages <= 1) return;

        const createButton = (pageNum, text, isDisabled = false) => {
            const button = document.createElement('button');
            button.textContent = text;
            button.classList.add('pagination-button');
            button.style.padding = '8px 15px';
            button.style.margin = '0 5px';
            button.style.borderRadius = '5px';
            button.style.border = '1px solid #ddd';
            button.style.backgroundColor = '#f9f9f9';
            button.style.cursor = 'pointer';
            button.style.fontSize = '14px';

            if (pageNum === currentPage) {
                button.classList.add('active');
                button.style.backgroundColor = '#007bff';
                button.style.color = 'white';
                button.style.borderColor = '#007bff';
            }
            if (isDisabled) {
                button.disabled = true;
                button.style.opacity = '0.6';
                button.style.cursor = 'not-allowed';
            } else {
                button.addEventListener('click', () => {
                    if (type === 'pendingPayments') {
                        currentPage = pageNum;
                        fetchPendingPayments(currentPage);
                    } else if (type === 'customerSummaries') {
                        currentCustomerSummaryPage = pageNum;
                        fetchAndRenderCustomerSummaries(currentCustomerSummaryPage, customerSearchInput.value.trim());
                    }
                });
            }
            return button;
        };

        paginationContainer.appendChild(createButton(1, 'First', currentPage === 1));
        paginationContainer.appendChild(createButton(currentPage - 1, 'Previous', currentPage === 1));

        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, currentPage + 2);

        if (startPage > 1) {
            const span = document.createElement('span');
            span.textContent = '...';
            span.style.margin = '0 5px';
            paginationContainer.appendChild(span);
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationContainer.appendChild(createButton(i, i.toString()));
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const span = document.createElement('span');
                span.textContent = '...';
                span.style.margin = '0 5px';
                paginationContainer.appendChild(span);
            }
            paginationContainer.appendChild(createButton(totalPages, totalPages.toString()));
        }

        paginationContainer.appendChild(createButton(currentPage + 1, 'Next', currentPage === totalPages));
        paginationContainer.appendChild(createButton(totalPages, 'Last', currentPage === totalPages));
    }

    /**
     * Clears the pagination controls from the DOM.
     * @param {HTMLElement} paginationContainer - The DOM element whose content should be cleared.
     */
    function clearPagination(paginationContainer) {
        if (paginationContainer) {
            paginationContainer.innerHTML = '';
        }
    }

    // --- Logout Functionality ---
    const logoutButton = document.getElementById('logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', (event) => {
            event.preventDefault();
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('jwt_refresh_token');
            showCustomAlert('You have been logged out successfully.', 'info');
            setTimeout(() => { window.location.href = 'index.html'; }, 1000);
        });
    }

    // --- Initial Page Load Logic ---
    // Determine which section to show initially
    if (initialLoanIdFromURL) {
        hideAllSections();
        logPaymentForm.classList.remove('hidden');
        loanIdInput.value = initialLoanIdFromURL.trim();
        loanIdInput.dispatchEvent(new Event('blur')); // Trigger blur to load details
    } else {
        hideAllSections(); // Ensure all are hidden first
        logPaymentForm.classList.remove('hidden'); // Show log payment form by default
    }
});
