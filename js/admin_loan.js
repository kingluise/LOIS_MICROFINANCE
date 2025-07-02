// admin_loan.js - Updated Code for Loan Management
// This version integrates various loan-related endpoints for:
// - Fetching and displaying all loans (Manage Loans)
// - Fetching and displaying loans pending approval (Approve Loans)
// - Handling loan approval, decline, and default actions
// - Enhancing "View Details" for individual loans
// - Adding a basic "View Loan By Customer" functionality
// - UPDATED: Loan Application Form now perfectly matches the provided API request body
//            by excluding 'collateral' and 'startDate' from the payload.
// - NEW: Auto-populates Customer Name in Add Loan form based on Customer ID.
// - REVISED: Removed 'collateral' field and set 'startDate' to read-only current date.
// - ENHANCED: Implemented a custom success modal with an OK button for loan application submission.
//             The page will only refresh and navigate after the user clicks OK.

// Ensure API_BASE_URL is defined in apiconfig.js and loaded before this script.

document.addEventListener('DOMContentLoaded', () => {

    // --- Custom Alert Container ---
    const customAlertContainer = document.getElementById('customAlertContainer');
    if (!customAlertContainer) {
        console.warn('Element with ID "customAlertContainer" not found. Alerts will default to console.');
    }

    // --- Navigation & Logout ---
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

    // --- Main Section Buttons ---
    const addLoanBtn = document.getElementById('addLoanBtn');
    const manageLoansBtn = document.getElementById('manageLoansBtn');
    const approveLoansBtn = document.getElementById('approveLoansBtn');
    const viewLoanByCustomerBtn = document.getElementById('viewLoanByCustomerBtn');

    // --- Form/Table Containers ---
    const duePaymentsSection = document.getElementById('duePaymentsSection'); // Placeholder for query due payments
    const addLoanFormSection = document.getElementById('addLoanForm');
    const manageLoansTableContainer = document.getElementById('manageLoansTableContainer');
    const approveLoansTableContainer = document.getElementById('approveLoansTableContainer');

    // --- Loan Application Form Elements ---
    const loanApplicationForm = document.getElementById('loanApplicationForm');
    const cancelAddLoanBtn = document.getElementById('cancelAddLoan');
    const customerIdLoanInput = document.getElementById('customerIdLoan');
    const customerNameLoanInput = document.getElementById('customerNameLoan'); // Customer Name input
    const loanAmountApplyInput = document.getElementById('loanAmountApply');
    const loanTypeApplyInput = document.getElementById('loanTypeApply'); // This will be loanGroup
    const interestRateApplyInput = document.getElementById('interestRateApply');
    const durationWeeksApplyInput = document.getElementById('durationWeeksApply');
    const startDateInput = document.getElementById('startDate'); // Now read-only and auto-populated


    // --- Manage Loans Table Elements ---
    const manageLoansTableBody = document.getElementById('manageLoansTableBody');
    const manageLoansPagination = document.getElementById('manageLoansPagination');
    const manageLoansGoBackBtn = document.getElementById('manageLoansGoBackBtn');

    // --- Approve Loans Table Elements ---
    const approveLoansTableBody = document.getElementById('approveLoansTableBody');
    const approveLoansPagination = document.getElementById('approveLoansPagination');
    const approveLoansGoBackBtn = document.getElementById('approveLoansGoBackBtn');

    // --- Loan Details Modal Elements ---
    const loanDetailsModal = document.getElementById('loanDetailsModal');
    const closeLoanDetailsModal = document.getElementById('closeLoanDetailsModal');
    const closeLoanDetailsModalBottom = document.getElementById('closeLoanDetailsModalBottom');

    const detailLoanId = document.getElementById('detailLoanId');
    const detailCustomerId = document.getElementById('detailCustomerId');
    const detailAmount = document.getElementById('detailAmount');
    const detailTotalRepayment = document.getElementById('detailTotalRepayment');
    const detailInterestRate = document.getElementById('detailInterestRate');
    const detailDuration = document.getElementById('detailDuration');
    const detailGroup = document.getElementById('detailGroup');
    const detailStatus = document.getElementById('detailStatus');
    const detailCollateral = document.getElementById('detailCollateral');
    const detailCreatedBy = document.getElementById('detailCreatedBy');
    const detailDateCreated = document.getElementById('detailDateCreated');
    const detailApprovedBy = document.getElementById('detailApprovedBy');
    const detailDateApproved = document.getElementById('detailDateApproved');
    const detailDeclinedBy = document.getElementById('detailDeclinedBy');
    const detailDateDeclined = document.getElementById('detailDateDeclined');
    const detailDefaultedBy = document.getElementById('detailDefaultedBy');
    const detailDateDefaulted = document.getElementById('detailDateDefaulted');

    // --- NEW: Success Message Modal Elements ---
    const successMessageModal = document.getElementById('successMessageModal');
    const successMessageText = document.getElementById('successMessageText');
    const successMessageOkBtn = document.getElementById('successMessageOkBtn');


    // --- Global Variables for Pagination ---
    let currentManageLoansPage = 1;
    let currentApproveLoansPage = 1;
    const pageSize = 10; // Default page size

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
            alert(message);
            return;
        }

        const alertDiv = document.createElement('div');
        alertDiv.classList.add('custom-alert', `custom-alert-${type}`);
        alertDiv.textContent = message;

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

    // --- UI State Management (Show/Hide Sections) ---
    function hideAllSections() {
        duePaymentsSection.classList.add('hidden');
        addLoanFormSection.classList.add('hidden');
        manageLoansTableContainer.classList.add('hidden');
        approveLoansTableContainer.classList.add('hidden');
        loanDetailsModal.classList.add('hidden'); // Ensure modal is hidden
        successMessageModal.classList.add('hidden'); // Ensure new success modal is hidden
    }

    // --- Manage Loans Section Logic ---

    /**
     * Fetches all loans from the backend for the "Manage Loans" table.
     * Assumes API_BASE_URL/customer/loan/pagenumber/{page}/pagesize/{pageSize} returns
     * { isSuccessful: true, responseObject: { items: [], totalCount: 0 } }
     * where each item in 'items' is a CustomerLoan entity or similar DTO
     * that includes Id, CustomerId, Amount, RepaymentAmount, LoanGroup, Status.
     */
    async function fetchManageLoans(page) {
        const authToken = getAuthToken();
        if (!authToken) { handleUnauthorized(); return; }

        manageLoansTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Loading loans...</td></tr>';
        displayManageLoansPagination(0, 0); // Clear pagination during load

        try {
            const url = `${API_BASE_URL}/customer/loan/pagenumber/${page}/pagesize/${pageSize}`;
            console.log("Fetching manage loans from URL:", url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            const data = await handleApiResponse(response);

            manageLoansTableBody.innerHTML = ''; // Clear loading message

            if (data.isSuccessful && data.responseObject && Array.isArray(data.responseObject.items)) {
                const loans = data.responseObject.items;
                const totalCount = data.responseObject.totalCount || 0;

                displayManageLoans(loans);
                displayManageLoansPagination(totalCount, page);
                showCustomAlert('Loans loaded successfully.', 'success');

                if (loans.length === 0 && page === 1) {
                    manageLoansTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No loans found.</td></tr>';
                }
            } else {
                const errorMessage = data.message || 'Failed to retrieve loans.';
                manageLoansTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">Error: ${errorMessage}</td></tr>`;
                showCustomAlert(`Error fetching loans: ${errorMessage}`, 'error');
            }
        } catch (error) {
            console.error('Error fetching manage loans:', error);
            if (error.message !== 'Unauthorized') {
                manageLoansTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">Error fetching loans: ${error.message || 'Network error'}</td></tr>`;
                showCustomAlert(`Error fetching loans: ${error.message || 'Network error'}`, 'error');
            }
        }
    }

    /**
     * Populates the "Manage Loans" table with fetched data.
     * Includes "View Details" and "Default" action buttons.
     */
    function displayManageLoans(loans) {
        manageLoansTableBody.innerHTML = ''; // Clear existing rows
        if (loans.length === 0) {
            manageLoansTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No loans to display.</td></tr>';
            return;
        }

        loans.forEach(loan => {
            const row = manageLoansTableBody.insertRow();
            const amountDisplay = (typeof loan.amount === 'number') ? loan.amount.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' }) : 'N/A';
            const totalRepaymentDisplay = (typeof loan.repaymentAmount === 'number') ? loan.repaymentAmount.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' }) : 'N/A';

            row.innerHTML = `
                <td data-label="Loan ID:">${loan.id || 'N/A'}</td>
                <td data-label="Customer ID:">${loan.customerId || 'N/A'}</td> <!-- Changed to Customer ID -->
                <td data-label="Amount:">${amountDisplay}</td>
                <td data-label="Total Repayment:">${totalRepaymentDisplay}</td>
                <td data-label="Group:">${loan.loanGroup || 'N/A'}</td>
                <td data-label="Status:">${loan.status || 'N/A'}</td>
                <td data-label="Action:">
                    <button class="view-details-btn action-button" data-loan-id="${loan.id || ''}">
                        View Details
                    </button>
                    <button class="default-btn action-button ${loan.status === 'Defaulted' ? 'disabled' : ''}" data-loan-id="${loan.id || ''}" ${loan.status === 'Defaulted' ? 'disabled' : ''}>
                        Default
                    </button>
                </td>
            `;
        });

        // Event delegation for action buttons in manage loans table
        // IMPORTANT: Attach event listeners AFTER the rows are added to the DOM
        manageLoansTableBody.addEventListener('click', (event) => {
            const target = event.target;
            const loanId = target.dataset.loanId;

            if (!loanId) return; // Exit if no loanId is present

            if (target.classList.contains('view-details-btn')) {
                handleViewDetails(loanId);
            } else if (target.classList.contains('default-btn') && !target.disabled) {
                handleDefaultLoan(loanId);
            }
        }, { once: false }); // Ensure this listener is not `once` if you re-render the tbody often
    }

    /**
     * Displays pagination controls for the "Manage Loans" table.
     */
    function displayManageLoansPagination(totalRecords, currentPage) {
        const totalPages = Math.ceil(totalRecords / pageSize);
        manageLoansPagination.innerHTML = ''; // Clear existing pagination

        if (totalPages > 1) {
            const createButton = (text, page, isActive = false, isDisabled = false) => {
                const button = document.createElement('button');
                button.textContent = text;
                button.classList.add('pagination-button');
                if (isActive) button.classList.add('active');
                if (isDisabled) button.disabled = true;
                button.addEventListener('click', () => {
                    if (!isDisabled) {
                        currentManageLoansPage = page;
                        fetchManageLoans(currentManageLoansPage);
                    }
                });
                return button;
            };

            manageLoansPagination.appendChild(createButton('Previous', currentPage - 1, false, currentPage === 1));

            for (let i = 1; i <= totalPages; i++) {
                manageLoansPagination.appendChild(createButton(i, i.toString(), i === currentPage));
            }

            manageLoansPagination.appendChild(createButton('Next', currentPage + 1, false, currentPage === totalPages));
        }
    }

    /**
     * Fetches detailed information for a single loan and displays it in a modal.
     * Uses GET /api/customer/loan/{id}
     */
    async function handleViewDetails(loanId) {
        const authToken = getAuthToken();
        if (!authToken) { handleUnauthorized(); return; }

        showCustomAlert(`Fetching details for Loan ID: ${loanId}...`, 'info');

        try {
            const url = `${API_BASE_URL}/customer/loan/${loanId}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            const data = await handleApiResponse(response);

            if (data.isSuccessful && data.responseObject) {
                const loan = data.responseObject;

                // Populate modal fields
                detailLoanId.textContent = loan.id || 'N/A';
                detailCustomerId.textContent = loan.customerId || 'N/A';
                detailAmount.textContent = loan.amount ? loan.amount.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' }) : 'N/A';
                detailTotalRepayment.textContent = loan.repaymentAmount ? loan.repaymentAmount.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' }) : 'N/A';
                detailInterestRate.textContent = (loan.interestRatePercent ? `${loan.interestRatePercent}%` : 'N/A');
                detailDuration.textContent = (loan.durationInWeeks ? `${loan.durationInWeeks} weeks` : 'N/A');
                detailGroup.textContent = loan.loanGroup || 'N/A';
                detailStatus.textContent = loan.status || 'N/A';
                detailCollateral.textContent = loan.collateral || 'N/A'; // This field is still in the modal HTML
                detailCreatedBy.textContent = loan.createdBy || 'N/A';
                detailDateCreated.textContent = loan.dateCreated ? new Date(loan.dateCreated).toLocaleDateString() : 'N/A';
                detailApprovedBy.textContent = loan.approvedBy || 'N/A';
                detailDateApproved.textContent = loan.dateApproved ? new Date(loan.dateApproved).toLocaleDateString() : 'N/A';
                detailDeclinedBy.textContent = loan.declinedBy || 'N/A';
                detailDateDeclined.textContent = loan.dateDeclined ? new Date(loan.dateDeclined).toLocaleDateString() : 'N/A';
                detailDefaultedBy.textContent = loan.defaultedBy || 'N/A';
                detailDateDefaulted.textContent = loan.dateDefaulted ? new Date(loan.dateDefaulted).toLocaleDateString() : 'N/A';

                loanDetailsModal.classList.remove('hidden'); // Show the modal
                showCustomAlert('Loan details loaded successfully.', 'success');
            } else {
                showCustomAlert(data.message || 'Failed to retrieve loan details.', 'error');
            }
        } catch (error) {
            console.error('Error fetching loan details:', error);
            if (error.message !== 'Unauthorized') {
                showCustomAlert(`Error fetching details: ${error.message || 'Network error'}`, 'error');
            }
        }
    }

    /**
     * Handles defaulting a loan.
     * Uses POST /api/customer/loan/{id}/defaulted
     */
    async function handleDefaultLoan(loanId) {
        const authToken = getAuthToken();
        if (!authToken) { handleUnauthorized(); return; }

        // Replaced native confirm with custom alert for better UX in a web app context
        const confirmDefault = () => {
            const userConfirmed = window.confirm(`Are you sure you want to mark Loan ID: ${loanId} as DEFAULTED? This action cannot be undone.`);
            return userConfirmed;
        };

        if (!confirmDefault()) {
            return;
        }

        showCustomAlert('Marking loan as defaulted...', 'info');

        try {
            const url = `${API_BASE_URL}/customer/loan/${loanId}/defaulted`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            const data = await handleApiResponse(response);

            showCustomAlert(data.message || 'Loan successfully marked as defaulted!', 'success');
            fetchManageLoans(currentManageLoansPage); // Refresh the table
        } catch (error) {
            console.error('Error defaulting loan:', error);
            if (error.message !== 'Unauthorized') {
                showCustomAlert(`Failed to default loan: ${error.message || 'Unknown error'}`, 'error');
            }
        }
    }


    // --- Approve Loans Section Logic ---

    /**
     * Fetches loans with 'Pending_Approver_Review' status from the backend.
     * Uses GET /api/customer/loan/pagenumber/{page}/pagesize/{pageSize}?status=Pending_Approver_Review
     */
    async function fetchApproveLoans(page) {
        const authToken = getAuthToken();
        if (!authToken) { handleUnauthorized(); return; }

        approveLoansTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Loading loans for approval...</td></tr>';
        displayApproveLoansPagination(0, 0); // Clear pagination during load

        try {
            const url = `${API_BASE_URL}/customer/loan/pagenumber/${page}/pagesize/${pageSize}?status=Pending_Approver_Review`;
            console.log("Fetching approve loans from URL:", url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            const data = await handleApiResponse(response);

            approveLoansTableBody.innerHTML = ''; // Clear loading message

            if (data.isSuccessful && data.responseObject && Array.isArray(data.responseObject.items)) {
                const loans = data.responseObject.items;
                const totalCount = data.responseObject.totalCount || 0;

                displayApproveLoans(loans);
                displayApproveLoansPagination(totalCount, page);
                showCustomAlert('Loans pending approval loaded successfully.', 'success');

                if (loans.length === 0 && page === 1) {
                    approveLoansTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No loans pending approval found.</td></tr>';
                }
            } else {
                const errorMessage = data.message || 'Failed to retrieve loans for approval.';
                approveLoansTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Error: ${errorMessage}</td></tr>`;
                showCustomAlert(`Error fetching approve loans: ${errorMessage}`, 'error');
            }
        } catch (error) {
            console.error('Error fetching approve loans:', error);
            if (error.message !== 'Unauthorized') {
                approveLoansTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Error fetching loans: ${error.message || 'Network error'}</td></tr>`;
                showCustomAlert(`Error fetching approve loans: ${errorMessage}`, 'error');
            }
        }
    }

    /**
     * Populates the "Approve Loans" table with fetched data.
     * Includes "Approve" and "Decline" action buttons.
     */
    function displayApproveLoans(loans) {
        approveLoansTableBody.innerHTML = '';
        if (loans.length === 0) {
            approveLoansTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No loans to display for approval.</td></tr>';
            return;
        }

        loans.forEach(loan => {
            const row = approveLoansTableBody.insertRow();
            const amountDisplay = (typeof loan.amount === 'number') ? loan.amount.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' }) : 'N/A';

            row.innerHTML = `
                <td data-label="Loan ID:">${loan.id || 'N/A'}</td>
                <td data-label="Customer ID:">${loan.customerId || 'N/A'}</td>
                <td data-label="Amount:">${amountDisplay}</td>
                <td data-label="Type:">${loan.loanGroup || 'N/A'}</td>
                <td data-label="Status:">${loan.status || 'N/A'}</td>
                <td data-label="Actions:">
                    <button class="approve-btn action-button" data-loan-id="${loan.id || ''}">Approve</button>
                    <button class="decline-btn action-button" data-loan-id="${loan.id || ''}">Decline</button>
                </td>
            `;
        });

        // Event delegation for action buttons in approve loans table
        approveLoansTableBody.addEventListener('click', (event) => {
            const target = event.target;
            const loanId = target.dataset.loanId;

            if (!loanId) return;

            if (target.classList.contains('approve-btn')) {
                handleApproveLoan(loanId);
            } else if (target.classList.contains('decline-btn')) {
                handleDeclineLoan(loanId);
            }
        }, { once: false }); // Not `once` if tbody is often re-rendered
    }

    /**
     * Displays pagination controls for the "Approve Loans" table.
     */
    function displayApproveLoansPagination(totalRecords, currentPage) {
        const totalPages = Math.ceil(totalRecords / pageSize);
        approveLoansPagination.innerHTML = '';

        if (totalPages > 1) {
            const createButton = (text, page, isActive = false, isDisabled = false) => {
                const button = document.createElement('button');
                button.textContent = text;
                button.classList.add('pagination-button');
                if (isActive) button.classList.add('active');
                if (isDisabled) button.disabled = true;
                button.addEventListener('click', () => {
                    if (!isDisabled) {
                        currentApproveLoansPage = page;
                        fetchApproveLoans(currentApproveLoansPage);
                    }
                });
                return button;
            };

            approveLoansPagination.appendChild(createButton('Previous', currentPage - 1, false, currentPage === 1));

            for (let i = 1; i <= totalPages; i++) {
                approveLoansPagination.appendChild(createButton(i, i.toString(), i === currentPage));
            }

            approveLoansPagination.appendChild(createButton('Next', currentPage + 1, false, currentPage === totalPages));
        }
    }

    /**
     * Handles approving a loan.
     * Uses POST /api/customer/loan/{id}/approve
     */
    async function handleApproveLoan(loanId) {
        const authToken = getAuthToken();
        if (!authToken) { handleUnauthorized(); return; }

        // Replaced native confirm with custom alert for better UX in a web app context
        const confirmApprove = () => {
            const userConfirmed = window.confirm(`Are you sure you want to APPROVE Loan ID: ${loanId}?`);
            return userConfirmed;
        };

        if (!confirmApprove()) {
            return;
        }

        showCustomAlert('Approving loan...', 'info');

        try {
            const url = `${API_BASE_URL}/customer/loan/${loanId}/approve`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            const data = await handleApiResponse(response);

            showCustomAlert(data.message || 'Loan approved successfully!', 'success');
            fetchApproveLoans(currentApproveLoansPage); // Refresh the table
            fetchManageLoans(currentManageLoansPage); // Also refresh manage loans to reflect status change
        } catch (error) {
            console.error('Error approving loan:', error);
            if (error.message !== 'Unauthorized') {
                showCustomAlert(`Failed to approve loan: ${error.message || 'Unknown error'}`, 'error');
            }
        }
    }

    /**
     * Handles declining a loan.
     * Uses POST /api/customer/loan/{id}/decline
     */
    async function handleDeclineLoan(loanId) {
        const authToken = getAuthToken();
        if (!authToken) { handleUnauthorized(); return; }

        // Replaced native confirm with custom alert for better UX in a web app context
        const confirmDecline = () => {
            const userConfirmed = window.confirm(`Are you sure you want to DECLINE Loan ID: ${loanId}?`);
            return userConfirmed;
        };

        if (!confirmDecline()) {
            return;
        }

        showCustomAlert('Declining loan...', 'info');

        try {
            const url = `${API_BASE_URL}/customer/loan/${loanId}/decline`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            const data = await handleApiResponse(response);

            showCustomAlert(data.message || 'Loan declined successfully!', 'success');
            fetchApproveLoans(currentApproveLoansPage); // Refresh the table
            fetchManageLoans(currentManageLoansPage); // Also refresh manage loans to reflect status change
        } catch (error) {
            console.error('Error declining loan:', error);
            if (error.message !== 'Unauthorized') {
                showCustomAlert(`Failed to decline loan: ${error.message || 'Unknown error'}`, 'error');
            }
        }
    }

    /**
     * Handles fetching loans by customer ID.
     * Uses GET /api/customer/{customerId}/loan/pagenumber/{pagenum}/pagesize/{pagesize}
     * For now, this will prompt for customer ID and then display the loans in a new table/section,
     * or could reuse manageLoansTableContainer. For simplicity, will reuse manageLoansTableContainer
     * but could be split into a new dedicated section.
     */
    async function handleViewLoanByCustomer() {
        const customerId = prompt("Please enter the Customer ID:");
        if (!customerId) {
            showCustomAlert('Customer ID is required to view loans by customer.', 'warning');
            return;
        }

        const authToken = getAuthToken();
        if (!authToken) { handleUnauthorized(); return; }

        hideAllSections();
        manageLoansTableContainer.classList.remove('hidden'); // Reuse the manage loans table for display
        manageLoansTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Loading loans for customer...</td></tr>';
        displayManageLoansPagination(0, 0);

        try {
            const url = `${API_BASE_URL}/customer/${customerId}/loan/pagenumber/${1}/pagesize/${pageSize}`; // Always start with page 1 for customer query
            console.log("Fetching loans by customer from URL:", url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            const data = await handleApiResponse(response);
            manageLoansTableBody.innerHTML = ''; // Clear loading message

            if (data.isSuccessful && data.responseObject && Array.isArray(data.responseObject.items)) {
                const loans = data.responseObject.items;
                const totalCount = data.responseObject.totalCount || 0;

                // Reuse displayManageLoans function, but note it's now showing loans for a specific customer
                displayManageLoans(loans);
                displayManageLoansPagination(totalCount, 1); // Pagination based on customer's loans
                showCustomAlert(`Loans for Customer ID ${customerId} loaded successfully.`, 'success');

                if (loans.length === 0) {
                    manageLoansTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center;">No loans found for Customer ID: ${customerId}.</td></tr>`;
                }
            } else {
                const errorMessage = data.message || `Failed to retrieve loans for Customer ID: ${customerId}.`;
                manageLoansTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">Error: ${errorMessage}</td></tr>`;
                showCustomAlert(`Error fetching loans for customer: ${errorMessage}`, 'error');
            }
        } catch (error) {
            console.error('Error fetching loans by customer:', error);
            if (error.message !== 'Unauthorized') {
                manageLoansTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">Error fetching loans: ${error.message || 'Network error'}</td></tr>`;
                showCustomAlert(`Error fetching loans by customer: ${error.message || 'Network error'}`, 'error');
            }
        }
    }

    // --- Due Repayments Query Logic ---

    // Function to clear the query form and results
    function clearQueryResults() {
        const queryDuePaymentsForm = document.getElementById('queryDuePaymentsForm');
        const queriedPaymentsTableBody = document.getElementById('queriedPaymentsTableBody');
        const queriedPaymentsContainer = document.getElementById('queriedPaymentsContainer');

        if (queryDuePaymentsForm) queryDuePaymentsForm.reset();
        if (queriedPaymentsTableBody) queriedPaymentsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #6c757d;">Enter date range above to query due payments.</td></tr>';
        if (queriedPaymentsContainer) queriedPaymentsContainer.classList.add('hidden');
    }

    // Event listener for Query Due Payments form submission
    const queryDuePaymentsForm = document.getElementById('queryDuePaymentsForm');
    const fromDateInput = document.getElementById('fromDate');
    const toDateInput = document.getElementById('toDate');
    const queriedPaymentsTableBody = document.getElementById('queriedPaymentsTableBody');
    const queriedPaymentsContainer = document.getElementById('queriedPaymentsContainer');
    const clearQueryButton = document.getElementById('clearQueryButton');

    if (queryDuePaymentsForm) {
        queryDuePaymentsForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const fromDate = fromDateInput.value;
            const toDate = toDateInput.value;

            if (!fromDate || !toDate) {
                showCustomAlert('Please select both From Date and To Date.', 'warning');
                clearQueryResults();
                return;
            }

            if (new Date(fromDate) > new Date(toDate)) {
                showCustomAlert('From Date cannot be after To Date.', 'warning');
                clearQueryResults();
                return;
            }

            const authToken = getAuthToken();
            if (!authToken) {
                handleUnauthorized();
                return;
            }

            queriedPaymentsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Querying payments...</td></tr>';
            queriedPaymentsContainer.classList.remove('hidden');

            try {
                const url = `${API_BASE_URL}/customer/loan/paymentplan?from=${fromDate}&to=${toDate}`;
                console.log("Calling due payments query API:", url);

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                });

                const data = await handleApiResponse(response);

                queriedPaymentsTableBody.innerHTML = '';

                if (data.isSuccessful && Array.isArray(data.responseObject)) {
                    const duePayments = data.responseObject;
                    if (duePayments.length > 0) {
                        duePayments.forEach((item) => {
                            const row = queriedPaymentsTableBody.insertRow();
                            const dueDate = item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'N/A';
                            const amountDue = (typeof item.amountPerInstallment === 'number') ? item.amountPerInstallment.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' }) : 'N/A';
                            const status = item.isPaid ? 'Paid' : 'Due';

                            row.innerHTML = `
                                <td>${item.loanId || 'N/A'}</td>
                                <td>${item.fullname || 'N/A'}</td>
                                <td>${amountDue}</td>
                                <td>${dueDate}</td>
                                <td>${status}</td>
                            `;
                            if (status === 'Paid') {
                                row.classList.add('paid-installment');
                            }
                        });
                        showCustomAlert('Due payments loaded for the specified range.', 'success');
                    } else {
                        queriedPaymentsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No due payments found for this date range.</td></tr>';
                        showCustomAlert('No due payments found for the selected dates.', 'info');
                    }
                } else {
                    const errorMessage = data.message || 'Failed to retrieve due payments.';
                    queriedPaymentsTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Error: ${errorMessage}</td></tr>`;
                    showCustomAlert(`Error: ${errorMessage}`, 'error');
                }

            } catch (error) {
                console.error('Error querying due payments:', error);
                if (error.message !== 'Unauthorized') {
                    queriedPaymentsTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Error querying payments: ${error.message || 'Network error'}</td></tr>`;
                    showCustomAlert(`Error querying payments: ${error.message || 'Network error'}`, 'error');
                }
            }
        });
    }

    if (clearQueryButton) {
        clearQueryButton.addEventListener('click', clearQueryResults);
    }


    // --- Event Listeners for Main Section Buttons ---
    if (addLoanBtn) {
        addLoanBtn.addEventListener('click', () => {
            hideAllSections();
            addLoanFormSection.classList.remove('hidden');
            loanApplicationForm.reset();
            customerNameLoanInput.value = ''; // Clear customer name on form reset
            // Set current date for the 'Date' field
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
            const dd = String(today.getDate()).padStart(2, '0');
            startDateInput.value = `${yyyy}-${mm}-${dd}`;
        });
    }

    if (manageLoansBtn) {
        manageLoansBtn.addEventListener('click', () => {
            hideAllSections();
            manageLoansTableContainer.classList.remove('hidden');
            currentManageLoansPage = 1;
            fetchManageLoans(currentManageLoansPage); // Trigger fetching loans for manage table
        });
    }

    if (approveLoansBtn) {
        approveLoansBtn.addEventListener('click', () => {
            hideAllSections();
            approveLoansTableContainer.classList.remove('hidden');
            currentApproveLoansPage = 1;
            fetchApproveLoans(currentApproveLoansPage); // Trigger fetching loans for approval
        });
    }

    if (viewLoanByCustomerBtn) {
        viewLoanByCustomerBtn.addEventListener('click', () => {
            // This button now directly triggers the customer loan fetch logic
            handleViewLoanByCustomer();
        });
    }

    // --- Loan Application Form Submission ---
    if (loanApplicationForm) {
        loanApplicationForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const authToken = getAuthToken();
            if (!authToken) { handleUnauthorized(); return; }

            // Construct the loanData object to perfectly match the API's expected request body format
            // 'collateral' and 'startDate' are EXCLUDED from the payload as per the provided API schema.
            // The 'startDate' is now just for display and internal form management, not sent to this specific API.
            const loanData = {
                customerId: customerIdLoanInput.value,
                loanPreference: {
                    loanGroup: loanTypeApplyInput.value, // Maps to loanGroup
                    amount: parseFloat(loanAmountApplyInput.value),
                    currencyCode: "NGN", // Defaulting to NGN, consider adding an input if dynamic
                    interestRate: parseFloat(interestRateApplyInput.value),
                    durationInWeeks: parseInt(durationWeeksApplyInput.value)
                }
            };

            // Basic validation (updated to remove collateral and startDate checks)
            if (!loanData.customerId ||
                !loanData.loanPreference.loanGroup ||
                isNaN(loanData.loanPreference.amount) || loanData.loanPreference.amount <= 0 ||
                !loanData.loanPreference.currencyCode ||
                isNaN(loanData.loanPreference.interestRate) || loanData.loanPreference.interestRate < 0 ||
                isNaN(loanData.loanPreference.durationInWeeks) || loanData.loanPreference.durationInWeeks <= 0) {
                showCustomAlert('Please ensure all required loan application fields are filled correctly (Customer ID, Loan Type, Amount, Interest Rate, Duration).', 'warning');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/customer/loan`, { // Endpoint for POST /api/customer/loan
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify(loanData)
                });
                const data = await handleApiResponse(response);

                // --- NEW: Show custom success modal instead of direct alert and timeout ---
                showSuccessMessageModal(data.message || 'Your application has been submitted for review.');

            } catch (error) {
                console.error('Error submitting loan application:', error);
                if (error.message !== 'Unauthorized') {
                    showCustomAlert(`Failed to submit loan: ${error.message || 'Unknown error'}`, 'error');
                }
            }
        });
    }

    // --- NEW: Function to show the custom success modal ---
    function showSuccessMessageModal(message) {
        successMessageText.textContent = message;
        successMessageModal.classList.remove('hidden');
    }

    // --- NEW: Event listener for the OK button in the success modal ---
    if (successMessageOkBtn) {
        successMessageOkBtn.addEventListener('click', () => {
            successMessageModal.classList.add('hidden'); // Hide the modal

            // Now perform the actions that were previously in the setTimeout
            loanApplicationForm.reset();
            customerNameLoanInput.value = ''; // Clear customer name on successful submission
            hideAllSections();
            // After successful loan creation, show manage loans
            manageLoansTableContainer.classList.remove('hidden');
            fetchManageLoans(1); // Refresh the manage loans table
        });
    }

    // --- Customer ID Auto-populate Logic ---
    customerIdLoanInput.addEventListener('blur', async () => {
        const customerId = customerIdLoanInput.value.trim();
        customerNameLoanInput.value = ''; // Clear existing name

        if (!customerId) {
            return; // Don't fetch if customer ID is empty
        }

        const authToken = getAuthToken();
        if (!authToken) {
            handleUnauthorized();
            return;
        }

        try {
            showCustomAlert('Fetching customer details...', 'info');
            const url = `${API_BASE_URL}/customer/${customerId}`; // Endpoint to get single customer by ID
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            const data = await handleApiResponse(response);

            if (data.isSuccessful && data.responseObject && data.responseObject.fullName) {
                customerNameLoanInput.value = data.responseObject.fullName;
                showCustomAlert('Customer details loaded.', 'success');
            } else {
                customerNameLoanInput.value = 'Customer Not Found';
                showCustomAlert('Customer ID not found. Please enter a valid ID.', 'warning');
            }
        } catch (error) {
            console.error('Error fetching customer details:', error);
            customerNameLoanInput.value = 'Error fetching name';
            if (error.message !== 'Unauthorized') {
                showCustomAlert(`Error fetching customer: ${error.message || 'Network error'}`, 'error');
            }
        }
    });


    // --- Cancel Add Loan ---
    if (cancelAddLoanBtn) {
        cancelAddLoanBtn.addEventListener('click', () => {
            loanApplicationForm.reset();
            customerNameLoanInput.value = ''; // Clear customer name on cancel
            // Clear date field (or reset to current if desired)
            startDateInput.value = ''; // Or set to current date if preferred:
            // const today = new Date();
            // const yyyy = today.getFullYear();
            // const mm = String(today.getMonth() + 1).padStart(2, '0');
            // const dd = String(today.getDate()).padStart(2, '0');
            // startDateInput.value = `${yyyy}-${mm}-${dd}`;

            hideAllSections();
            manageLoansTableContainer.classList.remove('hidden');
            fetchManageLoans(currentManageLoansPage); // Show manage loans and refresh
        });
    }

    // --- Go Back Buttons ---
    if (manageLoansGoBackBtn) {
        manageLoansGoBackBtn.addEventListener('click', () => {
            hideAllSections();
            document.getElementById('loanButtons').classList.remove('hidden');
            // If you have a default tab/section for the main loan page after "Go Back", activate it here.
        });
    }

    if (approveLoansGoBackBtn) {
        approveLoansGoBackBtn.addEventListener('click', () => {
            hideAllSections();
            document.getElementById('loanButtons').classList.remove('hidden');
            // If you have a default tab/section for the main loan page after "Go Back", activate it here.
        });
    }

    // --- Modal Close Event Listeners ---
    if (closeLoanDetailsModal) {
        closeLoanDetailsModal.addEventListener('click', () => {
            loanDetailsModal.classList.add('hidden');
        });
    }
    if (closeLoanDetailsModalBottom) {
        closeLoanDetailsModalBottom.addEventListener('click', () => {
            loanDetailsModal.classList.add('hidden');
        });
    }
    // Close modal if user clicks outside of it
    window.addEventListener('click', (event) => {
        if (event.target === loanDetailsModal || event.target === successMessageModal) { // Also close success modal
            event.target.classList.add('hidden');
        }
    });

    // --- Initial View Setup ---
    hideAllSections();
    // Default to showing the Manage Loans section on page load
    manageLoansTableContainer.classList.remove('hidden');
    fetchManageLoans(currentManageLoansPage); // Load loans on initial page load
});
