// admin_customer.js

// Ensure API_BASE_URL is defined in js/config.js.
// It should look like this: const API_BASE_URL = 'http://localhost:5279/api';

document.addEventListener('DOMContentLoaded', () => {
    const addCustomerBtn = document.getElementById('addCustomerBtn');
    const customerFormContainer = document.getElementById('customerFormContainer');
    const customerForm = document.getElementById('customerForm');
    const formSteps = Array.from(customerForm.querySelectorAll('.form-step'));
    const progressBar = document.getElementById('progress');
    let currentStep = 0;

    const loanTypeSelect = customerForm.querySelector('#loanType');
    const weeklyLoanDetails = customerForm.querySelector('#weeklyLoanDetails');
    const monthlyLoanDetails = customerForm.querySelector('#monthlyLoanDetails');

    // Get all relevant input/select elements for weekly loan details
    const weeklyLoanInputs = [
        document.getElementById('weeklyAmount'),
        document.getElementById('weeklyGroup'),
        document.getElementById('weeklyInterestRate'),
        document.getElementById('weeklyDuration')
    ];

    // Get all relevant input/select elements for monthly loan details
    const monthlyLoanInputs = [
        document.getElementById('monthlyAmount'),
        document.getElementById('monthlyInterestRate'),
        document.getElementById('monthlyDuration')
    ];

    // --- DOM Elements for Customer List and Search ---
    const customerListTableBody = document.querySelector('#customer-list-body');
    const searchBar = document.getElementById('searchBar');
    const customerPaginationContainer = document.getElementById('customerPagination');

    // --- Loading Overlay Element ---
    const loadingOverlay = document.getElementById('loadingOverlay');

    // --- Global Variables for Pagination and Search ---
    let currentCustomerPage = 1;
    const customerPageSize = 50; // Increased page size to show more contacts by default
    let allCustomersData = []; // Store all fetched customers for client-side search

    /**
     * Helper function to set or remove the 'required' attribute on a list of elements.
     * @param {Array<HTMLElement>} elements - An array of HTML input, select, or textarea elements.
     * @param {boolean} isRequired - True to add 'required', false to remove.
     */
    function setRequired(elements, isRequired) {
        elements.forEach(el => {
            if (el) { // Ensure element exists before trying to modify
                if (isRequired) {
                    el.setAttribute('required', 'required');
                } else {
                    el.removeAttribute('required');
                }
            }
        });
    }

    /**
     * Shows a specific step of the form and updates the progress bar.
     * Also manages the 'required' attributes for loan detail fields.
     * @param {number} stepIndex - The index of the step to show.
     */
    function showStep(stepIndex) {
        formSteps.forEach((step, index) => {
            step.classList.toggle('hidden', index !== stepIndex);
        });
        progressBar.style.width = `${((stepIndex + 1) / formSteps.length) * 100}%`;

        // Manage 'required' attributes for loan detail fields based on the current step
        if (formSteps[stepIndex] === weeklyLoanDetails) {
            setRequired(weeklyLoanInputs, true);
            setRequired(monthlyLoanInputs, false);
        } else if (formSteps[stepIndex] === monthlyLoanDetails) {
            setRequired(monthlyLoanInputs, true);
            setRequired(weeklyLoanInputs, false);
        } else {
            // If not on a loan details step, ensure both are not required
            setRequired(weeklyLoanInputs, false);
            setRequired(monthlyLoanInputs, false);
        }
    }

    // Initialize form and show first step, ensuring loan fields are not required initially
    showStep(0);

    addCustomerBtn.addEventListener('click', () => {
        customerFormContainer.classList.remove('hidden');
        customerForm.reset(); // Clear form on opening for new customer
        currentStep = 0; // Reset to the first step when opening the form
        showStep(currentStep); // This will also reset loan field 'required' states
        // Ensure loan detail sections are hidden and loan type dropdown is reset
        if (weeklyLoanDetails) weeklyLoanDetails.classList.add('hidden');
        if (monthlyLoanDetails) monthlyLoanDetails.classList.add('hidden');
        if (loanTypeSelect) loanTypeSelect.value = '';
    });

    customerFormContainer.addEventListener('click', function(event) {
        // Close form if clicking outside the form content
        if (event.target === customerFormContainer) {
            customerFormContainer.classList.add('hidden');
            customerForm.reset(); // Clear the form fields
            currentStep = 0;
            showStep(currentStep); // This will also reset loan field 'required' states
            if (weeklyLoanDetails) weeklyLoanDetails.classList.add('hidden');
            if (monthlyLoanDetails) monthlyLoanDetails.classList.add('hidden');
            if (loanTypeSelect) loanTypeSelect.value = '';
        }
    });

    customerForm.querySelectorAll('.cancel-form').forEach((btn) => {
        btn.addEventListener('click', () => {
            customerFormContainer.classList.add('hidden');
            customerForm.reset(); // Clear the form fields
            currentStep = 0;
            showStep(currentStep); // This will also reset loan field 'required' states
            if (weeklyLoanDetails) weeklyLoanDetails.classList.add('hidden');
            if (monthlyLoanDetails) monthlyLoanDetails.classList.add('hidden');
            if (loanTypeSelect) loanTypeSelect.value = '';
        });
    });

    /**
     * Validates all required fields in the currently visible form step.
     * Uses native HTML5 validation methods.
     * @returns {boolean} True if all fields in the current step are valid, false otherwise.
     */
    function validateCurrentStep() {
        const currentStepElement = formSteps[currentStep];
        // Select all form controls within the current step that have the 'required' attribute
        const requiredElements = currentStepElement.querySelectorAll('[required]');

        let isValid = true;
        for (const element of requiredElements) {
            // Use native HTML5 validation methods
            if (!element.checkValidity()) {
                element.reportValidity(); // This will show the browser's error message and attempt to focus
                isValid = false;
                break; // Stop at the first invalid field
            }
        }
        return isValid;
    }

    customerForm.querySelectorAll('.next-step').forEach((btn) => {
        btn.addEventListener('click', () => {
            if (validateCurrentStep()) { // Validate current step before proceeding
                // Special handling for the Loan Type Selection step (Step 4)
                if (formSteps[currentStep] === formSteps[3]) { // Assuming Step 4 is index 3
                    const selectedLoanType = loanTypeSelect.value;
                    // The 'required' attribute on loanTypeSelect should handle empty selection
                    // if (!selectedLoanType) { alert('Please select a loan type.'); return; }

                    // IMPORTANT FIX: Ensure 'Weekly' and 'Monthly' match the values in your HTML's select options
                    if (selectedLoanType === 'Weekly') { // Changed to 'Weekly' to match HTML
                        currentStep = formSteps.indexOf(weeklyLoanDetails); // Set currentStep to the weekly loan step
                    } else if (selectedLoanType === 'Monthly') { // Changed to 'Monthly' to match HTML
                        currentStep = formSteps.indexOf(monthlyLoanDetails); // Set currentStep to the monthly loan step
                    }
                    showStep(currentStep); // This will make the selected loan form visible and set its 'required' attributes
                } else {
                    // Standard sequential navigation
                    if (currentStep < formSteps.length - 1) {
                        currentStep++;
                        showStep(currentStep);
                    }
                }
            }
        });
    });

    customerForm.querySelectorAll('.prev-step').forEach((btn) => {
        btn.addEventListener('click', () => {
            if (currentStep > 0) {
                // If currently on a loan details step, navigate back to loan type selection
                if (formSteps[currentStep].id === 'weeklyLoanDetails' || formSteps[currentStep].id === 'monthlyLoanDetails') {
                    // Hide the current loan detail form
                    formSteps[currentStep].classList.add('hidden');
                    // Ensure 'required' attributes are removed from the loan fields that are now hidden
                    setRequired(weeklyLoanInputs, false);
                    setRequired(monthlyLoanInputs, false);

                    currentStep = formSteps.indexOf(customerForm.querySelector('fieldset:nth-of-type(4)')); // Go back to Loan Type Selection (Step 4, index 3)
                    showStep(currentStep); // Show the loan type selection step
                    loanTypeSelect.value = ''; // Reset loan type selection
                } else {
                    currentStep--;
                    showStep(currentStep);
                }
            }
        });
    });

    // --- Authentication and Error Handling Helpers (Re-used from payment.js) ---
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
        const customAlertContainer = document.getElementById('customAlertContainer'); // Ensure this is defined or passed
        if (!customAlertContainer) {
            console.log(`Alert (${type}): ${message}`);
            alert(message); // Fallback
            return;
        }

        const alertDiv = document.createElement('div');
        alertDiv.classList.add('custom-alert', `custom-alert-${type}`);
        alertDiv.textContent = message;

        // Add basic inline styles if no external CSS is provided for .custom-alert
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
            // Attempt to parse JSON error, but fallback to text if not JSON
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.message || (errorData.errors && errorData.errors.join(', ')) || `HTTP error! status: ${response.status}`;
                throw new Error(errorMessage);
            } else {
                const errorText = await response.text();
                throw new Error(`Server error: ${response.status} - ${errorText.substring(0, 100)}... (See console for full response)`);
            }
        }
        return response.json();
    }

    // --- Loading Overlay Functions ---
    function showLoadingOverlay() {
        if (loadingOverlay) {
            loadingOverlay.classList.add('visible');
        }
    }

    function hideLoadingOverlay() {
        if (loadingOverlay) {
            loadingOverlay.classList.remove('visible');
        }
    }

    /**
     * Fetches customers from the API based on pagination and stores them.
     * Then, it renders the filtered customers based on the search term.
     * @param {number} pageNum - The current page number.
     * @param {string} searchTerm - The search query (for client-side filtering).
     */
    async function fetchAndRenderCustomers(pageNum, searchTerm = '') {
        const jwtToken = getAuthToken();
        if (!jwtToken) {
            handleUnauthorized();
            customerListTableBody.innerHTML = '<tr><td colspan="4" class="text-center" style="color: red;">Authentication required to view customers.</td></tr>';
            clearPagination();
            return;
        }

        customerListTableBody.innerHTML = '<tr><td colspan="4" class="text-center">Loading customers...</td></tr>';
        showLoadingOverlay(); // Show loading overlay

        try {
            // Only send pagination parameters to the backend
            const payload = {
                pageNumber: pageNum,
                pageSize: customerPageSize
            };

            const url = `${API_BASE_URL}/customer/search`; // Use search endpoint
            console.log("Fetching customers from URL:", url, "with pagination payload:", payload);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwtToken}`
                },
                body: JSON.stringify(payload), // Send payload with pagination only
            });

            const data = await handleApiResponse(response);

            customerListTableBody.innerHTML = ''; // Clear loading message

            if (data.isSuccessful && data.responseObject && Array.isArray(data.responseObject.items)) {
                allCustomersData = data.responseObject.items; // Store fetched data
                const totalCount = data.responseObject.totalCount;

                // Apply client-side filtering based on the search term
                const lowerCaseSearchTerm = searchTerm.toLowerCase();
                const filteredCustomers = lowerCaseSearchTerm ?
                    allCustomersData.filter(customer =>
                        (customer.fullName && customer.fullName.toLowerCase().includes(lowerCaseSearchTerm)) ||
                        (customer.phonenumber && customer.phonenumber.toLowerCase().includes(lowerCaseSearchTerm)) ||
                        (customer.email && customer.email.toLowerCase().includes(lowerCaseSearchTerm))
                    ) :
                    allCustomersData; // If no search term, show all from the current page

                if (filteredCustomers.length === 0) {
                    customerListTableBody.innerHTML = '<tr><td colspan="4" class="text-center">No customers found.</td></tr>';
                } else {
                    filteredCustomers.forEach((customer, index) => {
                        const newRow = customerListTableBody.insertRow();
                        // Calculate actual index based on current page (for display purposes)
                        newRow.insertCell().textContent = (pageNum - 1) * customerPageSize + index + 1;
                        newRow.insertCell().textContent = customer.fullName;
                        newRow.insertCell().textContent = customer.phonenumber;
                        newRow.insertCell().innerHTML = `
                            <button class="view-btn" data-id="${customer.id}">View</button>
                            <button class="edit-btn" data-id="${customer.id}">Edit</button>
                            <button class="delete-btn" data-id="${customer.id}">Delete</button>
                        `;
                    });
                }
                displayCustomerPagination(totalCount, pageNum);
            } else {
                const errorMessage = data.message || (data.errors && data.errors.join(', ')) || 'Failed to retrieve valid customer data from API.';
                console.error('API reported an issue with customer data:', errorMessage, data);
                showCustomAlert(`Failed to load customers: ${errorMessage}`, 'error');
                customerListTableBody.innerHTML = '<tr><td colspan="4" class="text-center">Error loading customers.</td></tr>';
                clearPagination();
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
            if (error.message !== 'Unauthorized') {
                showCustomAlert(`Failed to fetch customers: ${error.message || 'Network error'}`, 'error');
            }
            customerListTableBody.innerHTML = '<tr><td colspan="4" class="text-center">Error loading customers.</td></tr>';
            clearPagination();
        } finally {
            hideLoadingOverlay(); // Hide loading overlay regardless of success or failure
        }
    }

    // --- Pagination Functions ---
    function displayCustomerPagination(totalRecords, page) {
        const totalPages = Math.ceil(totalRecords / customerPageSize);
        if (!customerPaginationContainer) {
            console.error('Pagination container not found!');
            return;
        }
        customerPaginationContainer.innerHTML = '';
        customerPaginationContainer.style.marginTop = '20px';
        customerPaginationContainer.style.textAlign = 'center';
        customerPaginationContainer.style.display = 'flex';
        customerPaginationContainer.style.justifyContent = 'center';
        customerPaginationContainer.style.flexWrap = 'wrap';
        customerPaginationContainer.style.gap = '5px';


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

            if (pageNum === page) { // Use 'page' parameter for active state
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
                    currentCustomerPage = pageNum;
                    fetchAndRenderCustomers(currentCustomerPage, searchBar.value.trim()); // Pass current search term
                });
            }
            return button;
        };

        customerPaginationContainer.appendChild(createButton(1, 'First', page === 1));
        customerPaginationContainer.appendChild(createButton(page - 1, 'Previous', page === 1));

        let startPage = Math.max(1, page - 2);
        let endPage = Math.min(totalPages, page + 2);

        if (startPage > 1) {
            const span = document.createElement('span');
            span.textContent = '...';
            span.style.margin = '0 5px';
            customerPaginationContainer.appendChild(span);
        }

        for (let i = startPage; i <= endPage; i++) {
            customerPaginationContainer.appendChild(createButton(i, i.toString()));
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const span = document.createElement('span');
                span.textContent = '...';
                span.style.margin = '0 5px';
                customerPaginationContainer.appendChild(span);
            }
            customerPaginationContainer.appendChild(createButton(totalPages, totalPages.toString()));
        }

        customerPaginationContainer.appendChild(createButton(page + 1, 'Next', page === totalPages));
        customerPaginationContainer.appendChild(createButton(totalPages, 'Last', page === totalPages));
    }

    function clearPagination() {
        if (customerPaginationContainer) {
            customerPaginationContainer.innerHTML = '';
        }
    }

    // --- Event listener for table actions (View, Edit, Delete) ---
    customerListTableBody.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        if (e.target.classList.contains('delete-btn')) {
            if (confirm('Are you sure you want to delete this customer?')) {
                await deleteCustomer(id);
                fetchAndRenderCustomers(currentCustomerPage, searchBar.value.trim()); // Re-render table after deletion
            }
        } else if (e.target.classList.contains('edit-btn')) {
            const customer = await getCustomer(id);
            if (customer) { // Only proceed if customer data was successfully fetched
                populateEditModal(customer);
                document.getElementById('editModal').style.display = 'block';
            }
        } else if (e.target.classList.contains('view-btn')) {
            const customer = await getCustomer(id);
            if (customer) { // Only proceed if customer data was successfully fetched
                viewCustomer(customer);
            }
        }
    });

    const editModal = document.getElementById('editModal');
    const closeModal = document.getElementById('closeModal');
    const editForm = document.getElementById('editForm');
    // Add event listener for the new "Cancel" button in the edit modal
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            editModal.style.display = 'none';
        });
    }

    let editCustomerId = null;

    /**
     * Populates the edit modal form with customer data.
     * @param {Object} customer - The customer data object.
     */
    function populateEditModal(customer) {
        document.getElementById('editFullName').value = customer.fullName || '';
        document.getElementById('editPhone').value = customer.phonenumber || '';
        document.getElementById('editEmail').value = customer.email || '';
        document.getElementById('editDob').value = customer.dateOfBirth ? customer.dateOfBirth.split('T')[0] : '';
        document.getElementById('editGender').value = customer.gender || '';
        document.getElementById('editMaritalStatus').value = customer.maritalStatus || '';
        document.getElementById('editEmployment_status').value = customer.employmentStatus || '';
        document.getElementById('editIncome').value = customer.monthlyIncome || '';
        document.getElementById('editIdType').value = customer.identification?.identificationType || '';
        document.getElementById('editIdNumber').value = customer.identification?.identificationNumber || '';
        document.getElementById('editBvn').value = customer.bvn || ''; // Assuming BVN is a top-level field for customer

        // IMPORTANT: These IDs MUST be unique in your HTML for guarantor fields!
        // The JS below ASSUMES you have made these corrections in your HTML.
        const editGuarantorFullNameElement = document.getElementById('editGuarantorFullName');
        if (editGuarantorFullNameElement) editGuarantorFullNameElement.value = customer.guarantor?.fullName || '';

        const editRelationshipToBorrowerElement = document.getElementById('editRelationshipToBorrower');
        if (editRelationshipToBorrowerElement) editRelationshipToBorrowerElement.value = customer.guarantor?.relationshipToCustomer || '';

        const editGuarantorPhoneElement = document.getElementById('editGuarantorPhone');
        if (editGuarantorPhoneElement) editGuarantorPhoneElement.value = customer.guarantor?.phoneNumber || '';

        const editGuarantorEmailElement = document.getElementById('editGuarantorEmail');
        if (editGuarantorEmailElement) editGuarantorEmailElement.value = customer.guarantor?.emailAddress || '';

        const editGuarantorIdTypeElement = document.getElementById('editGuarantorIdType');
        if (editGuarantorIdTypeElement) editGuarantorIdTypeElement.value = customer.guarantor?.identificationType || '';

        const editGuarantorIdNumberElement = document.getElementById('editGuarantorIdNumber');
        if (editGuarantorIdNumberElement) editGuarantorIdNumberElement.value = customer.guarantor?.identificationNumber || '';

        const editGuarantorResidentialAddressElement = document.getElementById('editGuarantorResidentialAddress');
        if (editGuarantorResidentialAddressElement) editGuarantorResidentialAddressElement.value = customer.guarantor?.residentialAddress || '';

        editCustomerId = customer.id;
    }

    closeModal.addEventListener('click', () => {
        editModal.style.display = 'none';
    });

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to save changes?')) {
            showLoadingOverlay(); // Show loading overlay
            try {
                const updatedCustomer = {
                    id: editCustomerId,
                    fullName: document.getElementById('editFullName').value,
                    phonenumber: document.getElementById('editPhone').value,
                    email: document.getElementById('editEmail').value,
                    dateOfBirth: document.getElementById('editDob').value,
                    gender: document.getElementById('editGender').value,
                    maritalStatus: document.getElementById('editMaritalStatus').value,
                    employmentStatus: document.getElementById('editEmployment_status').value,
                    monthlyIncome: parseFloat(document.getElementById('editIncome').value),
                    identification: {
                        identificationType: document.getElementById('editIdType').value,
                        identificationNumber: document.getElementById('editIdNumber').value
                    },
                    guarantor: {
                        fullName: document.getElementById('editGuarantorFullName').value,
                        relationshipToCustomer: document.getElementById('editRelationshipToBorrower').value,
                        phoneNumber: document.getElementById('editGuarantorPhone').value,
                        emailAddress: document.getElementById('editGuarantorEmail').value,
                        identificationType: document.getElementById('editGuarantorIdType').value,
                        identificationNumber: document.getElementById('editGuarantorIdNumber').value,
                        residentialAddress: document.getElementById('editGuarantorResidentialAddress').value // Use the new unique ID
                    },
                    residentialAddress: document.getElementById('editResidentialAddress').value,
                    selfieUrl: '', // Placeholder: handle actual image URL if available
                    bvn: document.getElementById('editBvn').value // Assuming BVN is a top-level field for customer
                };
                await updateCustomer(updatedCustomer);
                fetchAndRenderCustomers(currentCustomerPage, searchBar.value.trim()); // Re-render table after update
                editModal.style.display = 'none';
            } catch (error) {
                console.error('Error during customer update:', error);
                if (error.message !== 'Unauthorized') {
                    showCustomAlert(`Failed to update customer: ${error.message || 'Unknown error'}`, 'error');
                }
            } finally {
                hideLoadingOverlay(); // Hide loading overlay
            }
        }
    });

    // --- Search Bar Event Listener ---
    searchBar.addEventListener('input', () => {
        fetchAndRenderCustomers(currentCustomerPage, searchBar.value.trim());
    });

    /**
     * Deletes a customer via API.
     * @param {string} id - The ID of the customer to delete.
     */
    async function deleteCustomer(id) {
        const jwtToken = getAuthToken();
        if (!jwtToken) { handleUnauthorized(); return; }

        if (confirm('Are you sure you want to delete this customer?')) {
            showLoadingOverlay(); // Show loading overlay
            try {
                const response = await fetch(`${API_BASE_URL}/customer/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${jwtToken}`
                    }
                });
                const data = await handleApiResponse(response);
                showCustomAlert(data.message || 'Customer deleted successfully!', 'success');
            } catch (error) {
                console.error('Error deleting customer:', error);
                if (error.message !== 'Unauthorized') {
                    showCustomAlert(`Failed to delete customer: ${error.message || 'Unknown error'}`, 'error');
                }
            } finally {
                hideLoadingOverlay(); // Hide loading overlay
            }
        }
    }

    /**
     * Fetches a single customer by ID.
     * @param {string} id - The ID of the customer to fetch.
     * @returns {Promise<Object|null>} The customer object if found, null otherwise.
     */
    async function getCustomer(id) {
        const jwtToken = getAuthToken();
        if (!jwtToken) { handleUnauthorized(); return null; }

        showLoadingOverlay(); // Show loading overlay
        try {
            const response = await fetch(`${API_BASE_URL}/customer/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${jwtToken}`
                }
            });
            const data = await handleApiResponse(response);
            if (data.isSuccessful && data.responseObject) {
                return data.responseObject;
            } else {
                showCustomAlert(data.message || 'Customer not found.', 'error');
                return null;
            }
        } catch (error) {
            console.error('Error fetching customer:', error);
            if (error.message !== 'Unauthorized') {
                showCustomAlert(`Failed to fetch customer: ${error.message || 'Unknown error'}`, 'error');
            }
            return null;
        } finally {
            hideLoadingOverlay(); // Hide loading overlay
        }
    }

    /**
     * Updates a customer via API.
     * @param {Object} customerData - The updated customer data payload.
     */
    async function updateCustomer(customerData) {
        const jwtToken = getAuthToken();
        if (!jwtToken) { handleUnauthorized(); return; }

        showLoadingOverlay(); // Show loading overlay
        try {
            const response = await fetch(`${API_BASE_URL}/customer`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwtToken}`
                },
                body: JSON.stringify(customerData) // Sending the customerData object as JSON
            });
            const data = await handleApiResponse(response);
            showCustomAlert(data.message || 'Customer updated successfully!', 'success');
        } catch (error) {
            console.error('Error updating customer:', error);
            if (error.message !== 'Unauthorized') {
                showCustomAlert(`Failed to update customer: ${error.message || 'Unknown error'}`, 'error');
            }
        } finally {
            hideLoadingOverlay(); // Hide loading overlay
        }
    }

    /**
     * Displays customer details in the view modal
     * @param {Object} customer - The customer data object
     */
    function viewCustomer(customer) {
        const viewModal = document.getElementById('viewCustomerModal');

        if (!viewModal) {
            console.error('View customer modal not found.');
            showCustomAlert('View customer modal not found in HTML.', 'error');
            return;
        }

        // Format date if it exists
        const formatDate = (dateString) => {
            if (!dateString) return 'N/A';
            try {
                return new Date(dateString).toLocaleDateString();
            } catch (e) {
                return dateString.split('T')[0];
            }
        };

        // Format currency if it exists
        const formatCurrency = (amount) => {
            if (!amount) return 'N/A';
            return amount.toLocaleString('en-NG', {
                style: 'currency',
                currency: 'NGN',
                minimumFractionDigits: 2
            });
        };

        // Populate view modal fields
        document.getElementById('viewFullName').textContent = customer.fullName || 'N/A';
        document.getElementById('viewPhone').textContent = customer.phonenumber || 'N/A';
        document.getElementById('viewEmail').textContent = customer.email || 'N/A';
        document.getElementById('viewDob').textContent = formatDate(customer.dateOfBirth);
        document.getElementById('viewGender').textContent = customer.gender || 'N/A';
        document.getElementById('viewMaritalStatus').textContent = customer.maritalStatus || 'N/A';
        document.getElementById('viewEmploymentStatus').textContent = customer.employmentStatus || 'N/A';
        document.getElementById('viewIncome').textContent = formatCurrency(customer.monthlyIncome);
        document.getElementById('viewIdType').textContent = customer.identification?.identificationType || 'N/A';
        document.getElementById('viewIdNumber').textContent = customer.identification?.identificationNumber || 'N/A';
        document.getElementById('viewBvn').textContent = customer.bvn || 'N/A';
        document.getElementById('viewResidentialAddress').textContent = customer.residentialAddress || 'N/A';

        // Guarantor details
        document.getElementById('viewGuarantorFullName').textContent = customer.guarantor?.fullName || 'N/A';
        document.getElementById('viewRelationshipToBorrower').textContent = customer.guarantor?.relationshipToCustomer || 'N/A';
        document.getElementById('viewGuarantorPhone').textContent = customer.guarantor?.phoneNumber || 'N/A';
        document.getElementById('viewGuarantorEmail').textContent = customer.guarantor?.emailAddress || 'N/A';
        document.getElementById('viewGuarantorIdType').textContent = customer.guarantor?.identificationType || 'N/A';
        document.getElementById('viewGuarantorIdNumber').textContent = customer.guarantor?.identificationNumber || 'N/A';
        document.getElementById('viewGuarantorResidentialAddress').textContent = customer.guarantor?.residentialAddress || 'N/A';

        // Show the modal
        viewModal.classList.add('visible');

        // Close button handlers
        const closeViewModal = document.getElementById('closeViewCustomerModal');
        const closeViewModalBtn = document.getElementById('closeViewCustomerModalBtn');

        if (closeViewModal) {
            closeViewModal.onclick = () => {
                viewModal.classList.remove('visible');
            };
        }

        if (closeViewModalBtn) {
            closeViewModalBtn.onclick = () => {
                viewModal.classList.remove('visible');
            };
        }

        // Close if click outside modal
        window.onclick = (event) => {
            if (event.target === viewModal) {
                viewModal.classList.remove('visible');
            }
        };
    }

    // --- MAIN FORM SUBMISSION (for adding new customer) ---
    customerForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent default form submission

        // Ensure the currently visible step is the one being submitted
        const finalStep = formSteps[currentStep];

        if (finalStep.id !== 'weeklyLoanDetails' && finalStep.id !== 'monthlyLoanDetails') {
            console.error("Attempted to submit from an invalid step. Current step ID:", finalStep.id);
            showCustomAlert("Please complete all steps before submitting the loan application.", 'warning');
            return;
        }

        if (!validateCurrentStep()) { // Validate the final loan step before submitting
            return; // Stop submission if validation fails
        }

        if (confirm('Are you sure you want to submit this customer and loan information?')) {
            showLoadingOverlay(); // Show loading overlay
            try {
                // Collect all customer data from initial steps
                const personalInfo = {
                    fullName: document.getElementById('fullName').value,
                    dateOfBirth: document.getElementById('dob').value,
                    gender: document.getElementById('gender').value,
                    maritalStatus: document.getElementById('maritalStatus').value,
                    residentialAddress: document.getElementById('address').value,
                };

                const employmentIdInfo = {
                    email: document.getElementById('email').value,
                    phone: document.getElementById('phone').value,
                    employmentStatus: document.getElementById('employment_status').value,
                    income: parseFloat(document.getElementById('income').value),
                    idType: document.getElementById('idType').value,
                    idNumber: document.getElementById('idNumber').value,
                    bvn: document.getElementById('bvn').value,
                };

                const guarantorInfo = {
                    fullName: document.getElementById('nextKinName').value,
                    relationshipToCustomer: document.getElementById('nextKinRelation').value,
                    phoneNumber: document.getElementById('nextKinPhone').value,
                    emailAddress: document.getElementById('guarantorEmail').value,
                    identificationType: document.getElementById('guarantorIdType').value,
                    identificationNumber: document.getElementById('guarantorIdNumber').value,
                    residentialAddress: document.getElementById('nextKinAddress')?.value || ''
                };

                // Collect loan details based on the selected type
                let loanDetails = {};
                const selectedLoanType = loanTypeSelect.value;

                if (selectedLoanType === 'Weekly') {
                    loanDetails = {
                        amount: parseFloat(document.getElementById('weeklyAmount').value),
                        interestRate: parseFloat(document.getElementById('weeklyInterestRate').value),
                        duration: parseInt(document.getElementById('weeklyDuration').value), // Duration in weeks
                        repaymentDate: document.getElementById('weeklyRepaymentDate').value,
                        group: document.getElementById('weeklyGroup').value,
                    };
                } else if (selectedLoanType === 'Monthly') {
                    loanDetails = {
                        amount: parseFloat(document.getElementById('monthlyAmount').value),
                        interestRate: parseFloat(document.getElementById('monthlyInterestRate').value),
                        duration: parseInt(document.getElementById('monthlyDuration').value) * 4, // Convert months to weeks for durationInWeeks
                        repaymentDate: document.getElementById('monthlyRepaymentDate').value,
                    };
                }

                // Prepare the customer payload matching the API Swagger definition
                const customerPayload = {
                    fullName: personalInfo.fullName,
                    dateOfBirth: personalInfo.dateOfBirth,
                    email: employmentIdInfo.email,
                    phonenumber: employmentIdInfo.phone,
                    maritalStatus: personalInfo.maritalStatus,
                    gender: personalInfo.gender,
                    residentialAddress: personalInfo.residentialAddress,
                    employmentStatus: employmentIdInfo.employmentStatus,
                    monthlyIncome: employmentIdInfo.income,
                    selfieUrl: '', // Placeholder: Your HTML has a file input, but this JSON expects a URL.
                    // You'll need separate logic to upload the image and get a URL.
                    loanPreference: {
                        loanGroup: selectedLoanType, // <--- Uses "Weekly" or "Monthly" from the select
                        amount: loanDetails.amount,
                        currencyCode: 'NGN', // Assuming NGN as default, add input if dynamic
                        interestRate: loanDetails.interestRate,
                        durationInWeeks: loanDetails.duration // This is already in weeks for both types now
                    },
                    guarantor: {
                        fullName: guarantorInfo.fullName,
                        relationshipToCustomer: guarantorInfo.relationshipToCustomer,
                        residentialAddress: guarantorInfo.residentialAddress,
                        phoneNumber: guarantorInfo.phoneNumber,
                        emailAddress: guarantorInfo.emailAddress,
                        identification: {
                            identificationType: guarantorInfo.identificationType,
                            identificationNumber: guarantorInfo.identificationNumber,
                            identificationUrl: '' // Placeholder: similarly for guarantor ID
                        }
                    },
                    identification: {
                        identificationType: employmentIdInfo.idType,
                        identificationNumber: employmentIdInfo.idNumber,
                        identificationUrl: '' // Placeholder: similarly for customer ID
                    },
                    // Add BVN if your API schema for customer creation includes it directly,
                    // as it's not nested under identification in the provided swagger.
                    // Assuming BVN is a top-level field for customer:
                    bvn: employmentIdInfo.bvn
                };

                // Log the payload to inspect before sending
                console.log('Customer Payload being sent:', customerPayload);

                let createdCustomerId = null;

                try {
                    // Step 1: Add the customer with nested loanPreference
                    const addCustomerResponse = await addCustomer(customerPayload);

                    if (addCustomerResponse && addCustomerResponse.isSuccessful && addCustomerResponse.responseObject) {
                        createdCustomerId = addCustomerResponse.responseObject.id;
                        showCustomAlert('Customer created successfully!', 'success');
                    } else {
                        // Error already handled by addCustomer function, just return
                        return;
                    }
                } catch (error) {
                    console.error('Error during customer submission flow:', error);
                    showCustomAlert(`Error: ${error.message || 'An unexpected error occurred during submission.'}`, 'error');
                    return;
                }

                // Reset form and UI after successful submission
                customerForm.reset();
                customerFormContainer.classList.add('hidden');
                currentStep = 0;
                showStep(0); // Reset to first step and clear loan field 'required' states

                if (weeklyLoanDetails) weeklyLoanDetails.classList.add('hidden');
                if (monthlyLoanDetails) monthlyLoanDetails.classList.add('hidden');
                if (loanTypeSelect) loanTypeSelect.value = '';

                fetchAndRenderCustomers(currentCustomerPage, searchBar.value.trim()); // Refresh table to show new customer
            } finally {
                hideLoadingOverlay(); // Hide loading overlay
            }
        }
    });

    /**
     * Adds a new customer to the API.
     * @param {Object} customerData - The customer data payload.
     * @returns {Promise<Object|null>} The API response data if successful, null otherwise.
     */
    async function addCustomer(customerData) {
        const jwtToken = getAuthToken();
        if (!jwtToken) { handleUnauthorized(); return; }

        showLoadingOverlay(); // Show loading overlay
        try {
            const response = await fetch(`${API_BASE_URL}/customer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwtToken}`
                },
                body: JSON.stringify(customerData)
            });
            const data = await handleApiResponse(response);
            return data; // Return the full response data for further checks
        } catch (error) {
            console.error('Error adding customer:', error);
            if (error.message !== 'Unauthorized') {
                showCustomAlert(`Failed to add customer: ${error.message || 'Unknown error'}`, 'error');
            }
            return null;
        } finally {
            hideLoadingOverlay(); // Hide loading overlay
        }
    }

    // --- Initial Load ---
    // Fetch and render customers when the page loads
    fetchAndRenderCustomers(currentCustomerPage, searchBar.value.trim()); // Call with current page and empty search term initially
});
