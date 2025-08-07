document.addEventListener('DOMContentLoaded', () => {
    console.log('User Management Script Loaded.');

    // --- DOM Element References ---
    const adminUserTableBody = document.getElementById('adminUserTableBody');
    const operatorUserTableBody = document.getElementById('operatorUserTableBody');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const addAdminUserBtn = document.getElementById('addAdminUserBtn');
    const addOperatorUserBtn = document.getElementById('addOperatorUserBtn');

    // --- Helper functions (Copied for self-containment, ideally in a shared utility file) ---

    /**
     * Shows the global loading indicator.
     */
    function showLoadingIndicator() {
        if (loadingIndicator) {
            loadingIndicator.style.display = 'block';
        }
    }

    /**
     * Hides the global loading indicator.
     */
    function hideLoadingIndicator() {
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    }

    /**
     * Displays a custom message modal.
     * @param {string} title - The title of the modal.
     * @param {string} message - The message content.
     */
    function displayMessageModal(title, message) {
        let modal = document.getElementById('customMessageModal');
        let modalTitle = document.getElementById('modalTitle');
        let modalMessage = document.getElementById('modalMessage');
        let modalCloseBtn = document.getElementById('modalCloseBtn');

        if (modal && modalTitle && modalMessage && modalCloseBtn) {
            modalTitle.textContent = title;
            modalMessage.textContent = message;
            modal.style.display = 'block';

            // Re-attach event listener to ensure it works after content changes
            const oldCloseBtn = modalCloseBtn;
            const newCloseBtn = oldCloseBtn.cloneNode(true);
            oldCloseBtn.parentNode.replaceChild(newCloseBtn, oldCloseBtn);
            newCloseBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        } else {
            console.warn("Custom message modal elements not found, falling back to alert.");
            alert(`${title}: ${message}`);
        }
    }

    /**
     * Generic function to make GET requests to the API.
     * @param {string} endpoint - The API endpoint path (e.g., 'user/admin/pagenumber/1/pagesize/10').
     * @param {string} [successMessage] - Optional message to display on success.
     * @param {string} [errorMessage] - Optional message to display on error.
     * @returns {Promise<{isSuccessful: boolean, data?: object, message?: string}>}
     */
    async function fetchData(endpoint, successMessage, errorMessage) {
        const token = localStorage.getItem('jwt_token');
        if (!token) {
            displayMessageModal('Authentication Error', 'No authentication token found. Please login.');
            return { isSuccessful: false, message: 'No token' };
        }

        showLoadingIndicator();

        try {
            const url = `${API_BASE_URL}/${endpoint}`; // Adjusted: API_BASE_URL already ends with /api, so add /
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const responseData = await response.json();

            if (response.ok) {
                // Optionally display success message for GET, usually not needed for data retrieval
                // if (successMessage) displayMessageModal('Success', successMessage);
                return { isSuccessful: true, data: responseData };
            } else {
                const msg = responseData.message || errorMessage || `Error: ${response.status} ${response.statusText}`;
                displayMessageModal('Error', msg);
                return { isSuccessful: false, message: msg };
            }
        } catch (error) {
            displayMessageModal('Error', `Network error: ${error.message}`);
            console.error('API GET Error:', error);
            return { isSuccessful: false, message: `Network error: ${error.message}` };
        } finally {
            hideLoadingIndicator();
        }
    }

    /**
     * Generic function to make POST requests to the API.
     * @param {string} endpoint - The API endpoint path (e.g., 'user/admin').
     * @param {object} data - The JSON data to send in the request body.
     * @param {string} [successMessage] - Optional message to display on success.
     * @param {string} [errorMessage] - Optional message to display on error.
     * @returns {Promise<{isSuccessful: boolean, data?: object, message?: string}>}
     */
    async function postData(endpoint, data, successMessage, errorMessage) {
        const token = localStorage.getItem('jwt_token');
        if (!token) {
            displayMessageModal('Authentication Error', 'No authentication token found. Please login.');
            return { isSuccessful: false, message: 'No token' };
        }

        showLoadingIndicator();

        try {
            const url = `${API_BASE_URL}/${endpoint}`; // Adjusted: API_BASE_URL already ends with /api, so add /
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            const responseData = await response.json();

            if (response.ok) {
                displayMessageModal('Success', successMessage || responseData.message || 'Operation successful!');
                return { isSuccessful: true, data: responseData };
            } else {
                const msg = responseData.message || errorMessage || `Error: ${response.status} ${response.statusText}`;
                displayMessageModal('Error', msg);
                return { isSuccessful: false, message: msg };
            }
        } catch (error) {
            displayMessageModal('Error', `Network error: ${error.message}`);
            console.error('API POST Error:', error);
            return { isSuccessful: false, message: `Network error: ${error.message}` };
        } finally {
            hideLoadingIndicator();
        }
    }

    // --- Functions to load and display Users ---

    /**
     * Loads and displays Admin users in the table.
     * @param {number} pageNumber - The current page number.
     * @param {number} pageSize - The number of items per page.
     */
    async function loadAdminUsers(pageNumber = 1, pageSize = 10) {
        // Adjusted endpoint path
        const endpoint = `user/admin/pagenumber/${pageNumber}/pagesize/${pageSize}`;
        const result = await fetchData(endpoint, 'Admin users loaded successfully!', 'Failed to load admin users.');

        if (result.isSuccessful && result.data.responseObject) {
            const users = result.data.responseObject.users || []; // Assuming 'users' array is nested in responseObject

            if (adminUserTableBody) {
                adminUserTableBody.innerHTML = ''; // Clear existing rows
                if (users.length > 0) {
                    users.forEach(user => {
                        const row = adminUserTableBody.insertRow();
                        row.insertCell().textContent = user.firstName || '';
                        row.insertCell().textContent = user.lastName || '';
                        row.insertCell().textContent = user.email || '';
                        row.insertCell().textContent = user.phoneNumber || '';
                        row.insertCell().textContent = user.status || '';

                        // Add action buttons
                        const actionsCell = row.insertCell();
                        actionsCell.innerHTML = `
                            <button class="deactivate-btn" data-user-id="${user.id}">Deactivate</button>
                            <button class="activate-btn" data-user-id="${user.id}">Activate</button>
                            <button class="reset-password-btn" data-user-id="${user.id}">Reset Password</button>
                        `;
                    });
                } else {
                    const row = adminUserTableBody.insertRow();
                    const cell = row.insertCell();
                    cell.colSpan = 6; // Adjust colspan based on your table columns
                    cell.textContent = 'No admin users found.';
                    cell.style.textAlign = 'center';
                }
            }
        }
    }

    /**
     * Loads and displays Operator users in the table.
     * @param {number} pageNumber - The current page number.
     * @param {number} pageSize - The number of items per page.
     */
    async function loadOperatorUsers(pageNumber = 1, pageSize = 10) {
        // Adjusted endpoint path
        const endpoint = `user/operator/pagenumber/${pageNumber}/pagesize/${pageSize}`;
        const result = await fetchData(endpoint, 'Operator users loaded successfully!', 'Failed to load operator users.');

        if (result.isSuccessful && result.data.responseObject) {
            const users = result.data.responseObject.users || []; // Assuming 'users' array is nested in responseObject

            if (operatorUserTableBody) {
                operatorUserTableBody.innerHTML = ''; // Clear existing rows
                if (users.length > 0) {
                    users.forEach(user => {
                        const row = operatorUserTableBody.insertRow();
                        row.insertCell().textContent = user.firstName || '';
                        row.insertCell().textContent = user.lastName || '';
                        row.insertCell().textContent = user.email || '';
                        row.insertCell().textContent = user.phoneNumber || '';
                        row.insertCell().textContent = user.status || '';

                        // Add action buttons
                        const actionsCell = row.insertCell();
                        actionsCell.innerHTML = `
                            <button class="deactivate-btn" data-user-id="${user.id}">Deactivate</button>
                            <button class="activate-btn" data-user-id="${user.id}">Activate</button>
                            <button class="reset-password-btn" data-user-id="${user.id}">Reset Password</button>
                        `;
                    });
                } else {
                    const row = operatorUserTableBody.insertRow();
                    const cell = row.insertCell();
                    cell.colSpan = 6; // Adjust colspan based on your table columns
                    cell.textContent = 'No operator users found.';
                    cell.style.textAlign = 'center';
                }
            }
        }
    }

    // --- Event Listeners for User Actions (using event delegation) ---

    // Event delegation for Admin User Table actions
    if (adminUserTableBody) {
        adminUserTableBody.addEventListener('click', async (event) => {
            const target = event.target;
            const userId = target.dataset.userId;

            if (!userId) return; // Exit if no user ID is found

            if (target.classList.contains('deactivate-btn')) {
                if (confirm('Are you sure you want to deactivate this admin user?')) { // Consider replacing with custom modal
                    // Adjusted endpoint path
                    const result = await postData('user/deactivate', { userId: userId }, 'Admin user deactivated successfully!', 'Failed to deactivate admin user.');
                    if (result.isSuccessful) {
                        loadAdminUsers(); // Refresh the list after action
                    }
                }
            } else if (target.classList.contains('activate-btn')) {
                if (confirm('Are you sure you want to activate this admin user?')) { // Consider replacing with custom modal
                    // Adjusted endpoint path
                    const result = await postData('user/activate', { userId: userId }, 'Admin user activated successfully!', 'Failed to activate admin user.');
                    if (result.isSuccessful) {
                        loadAdminUsers(); // Refresh the list after action
                    }
                }
            } else if (target.classList.contains('reset-password-btn')) {
                if (confirm('Are you sure you want to reset the password for this admin user? This will send a password reset link/temporary password.')) { // Consider replacing with custom modal
                    // Adjusted endpoint path
                    const result = await postData('user/reset-password', { userId: userId }, 'Admin user password reset initiated!', 'Failed to reset admin user password.');
                    // No need to refresh list for password reset, just show success
                }
            }
        });
    }

    // Event delegation for Operator User Table actions
    if (operatorUserTableBody) {
        operatorUserTableBody.addEventListener('click', async (event) => {
            const target = event.target;
            const userId = target.dataset.userId;

            if (!userId) return; // Exit if no user ID is found

            if (target.classList.contains('deactivate-btn')) {
                if (confirm('Are you sure you want to deactivate this operator user?')) { // Consider replacing with custom modal
                    // Adjusted endpoint path
                    const result = await postData('user/deactivate', { userId: userId }, 'Operator user deactivated successfully!', 'Failed to deactivate operator user.');
                    if (result.isSuccessful) {
                        loadOperatorUsers(); // Refresh the list after action
                    }
                }
            } else if (target.classList.contains('activate-btn')) {
                if (confirm('Are you sure you want to activate this operator user?')) { // Consider replacing with custom modal
                    // Adjusted endpoint path
                    const result = await postData('user/activate', { userId: userId }, 'Operator user activated successfully!', 'Failed to activate operator user.');
                    if (result.isSuccessful) {
                        loadOperatorUsers(); // Refresh the list after action
                    }
                }
            } else if (target.classList.contains('reset-password-btn')) {
                if (confirm('Are you sure you want to reset the password for this operator user? This will send a password reset link/temporary password.')) { // Consider replacing with custom modal
                    // Adjusted endpoint path
                    const result = await postData('user/reset-password', { userId: userId }, 'Operator user password reset initiated!', 'Failed to reset operator user password.');
                    // No need to refresh list for password reset, just show success
                }
            }
        });
    }

    // --- Event Listeners for Add User Buttons (Placeholder for future forms/modals) ---
    if (addAdminUserBtn) {
        addAdminUserBtn.addEventListener('click', () => {
            displayMessageModal('Add Admin', 'Functionality to add Admin users will be implemented here (e.g., show a form modal).');
            // Future: Show a form for adding admin user
        });
    }

    if (addOperatorUserBtn) {
        addOperatorUserBtn.addEventListener('click', () => {
            displayMessageModal('Add Operator', 'Functionality to add Operator users will be implemented here (e.g., show a form modal).');
            // Future: Show a form for adding operator user
        });
    }

    // --- Initial Load of Users when the page loads ---
    // Ensure these are called after all DOM elements are guaranteed to be available
    loadAdminUsers(1, 10); // Load the first page of admin users
    loadOperatorUsers(1, 10); // Load the first page of operator users
});
