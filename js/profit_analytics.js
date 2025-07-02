document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const filterPeriod = document.getElementById('filterPeriod');
    const monthYearSelector = document.getElementById('monthYearSelector');
    const quarterYearSelector = document.getElementById('quarterYearSelector');
    const yearOnlySelector = document.getElementById('yearOnlySelector');
    const customRangeSelector = document.getElementById('customRangeSelector');

    const monthSelect = document.getElementById('month');
    const yearInput = document.getElementById('year');
    const quarterSelect = document.getElementById('quarter');
    const yearQuarterInput = document.getElementById('yearQuarter');
    const onlyYearInput = document.getElementById('onlyYear');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');

    const applyMonthYearFilter = document.getElementById('applyMonthYearFilter');
    const applyQuarterYearFilter = document.getElementById('applyQuarterYearFilter');
    const applyYearFilter = document.getElementById('applyYearFilter');
    const applyCustomRangeFilter = document.getElementById('applyCustomRangeFilter');

    const profitAnalysisTableBody = document.querySelector('#profitAnalysisTable tbody');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const exportXmlBtn = document.getElementById('exportXmlBtn');
    const loadingIndicator = document.getElementById('loadingIndicator'); // Assumed to exist in HTML

    // --- Constants ---
    // API_BASE_URL is assumed to be defined in another JavaScript file (e.g., config.js).
    // Corrected endpoint path: Removed leading '/api/' to avoid duplication with API_BASE_URL
    const PROFIT_ANALYTICS_ENDPOINT = '/report/profit/analytics';

    // --- Helper for Date Calculations ---
    function getQuarterDates(year, quarter) {
        let startDate, endDate;
        switch (quarter) {
            case '1': // Q1: Jan-Mar
                startDate = `${year}-01-01`;
                endDate = `${year}-03-31`;
                break;
            case '2': // Q2: Apr-Jun
                startDate = `${year}-04-01`;
                endDate = `${year}-06-30`;
                break;
            case '3': // Q3: Jul-Sep
                startDate = `${year}-07-01`;
                endDate = `${year}-09-30`;
                break;
            case '4': // Q4: Oct-Dec
                startDate = `${year}-10-01`;
                endDate = `${year}-12-31`;
                break;
            default:
                return null; // Invalid quarter
        }
        return { startDate, endDate };
    }

    // --- Function to fetch profit data from the API ---
    async function fetchProfitData(filterType, params = {}) {
        const token = localStorage.getItem('jwt_token');

        if (!token) {
            displayMessageModal('Authentication Error', 'No authentication token found. Please login.');
            // Optionally redirect to login page if needed
            // window.location.href = '/login';
            return;
        }

        // Show loading indicator
        if (loadingIndicator) loadingIndicator.style.display = 'block';

        let requestBody = {};

        // Construct the request body based on filterType
        switch (filterType) {
            case 'monthly':
                if (!params.month || !params.year) {
                    displayMessageModal('Input Error', 'Please select both month and year.');
                    if (loadingIndicator) loadingIndicator.style.display = 'none';
                    return;
                }
                const month = String(params.month).padStart(2, '0');
                const year = params.year;
                const lastDayOfMonth = new Date(year, month, 0).getDate();
                requestBody = {
                    startDate: `${year}-${month}-01`,
                    endDate: `${year}-${month}-${lastDayOfMonth}`,
                    aggregationLevel: 'MONTHLY'
                };
                break;
            case 'quarterly':
                if (!params.quarter || !params.year) {
                    displayMessageModal('Input Error', 'Please select both quarter and year.');
                    if (loadingIndicator) loadingIndicator.style.display = 'none';
                    return;
                }
                const quarterDates = getQuarterDates(params.year, params.quarter);
                if (!quarterDates) {
                    displayMessageModal('Input Error', 'Invalid quarter selected.');
                    if (loadingIndicator) loadingIndicator.style.display = 'none';
                    return;
                }
                requestBody = {
                    startDate: quarterDates.startDate,
                    endDate: quarterDates.endDate,
                    aggregationLevel: 'QUARTERLY'
                };
                break;
            case 'yearly':
                if (!params.year) {
                    displayMessageModal('Input Error', 'Please select a year.');
                    if (loadingIndicator) loadingIndicator.style.display = 'none';
                    return;
                }
                requestBody = {
                    startDate: `${params.year}-01-01`,
                    endDate: `${params.year}-12-31`,
                    aggregationLevel: 'YEARLY'
                };
                break;
            case 'custom':
                if (!params.startDate || !params.endDate) {
                    displayMessageModal('Input Error', 'Please select both start and end dates.');
                    if (loadingIndicator) loadingIndicator.style.display = 'none';
                    return;
                }
                // Basic date validation: ensure start date is not after end date
                if (new Date(params.startDate) > new Date(params.endDate)) {
                    displayMessageModal('Input Error', 'Start date cannot be after end date.');
                    if (loadingIndicator) loadingIndicator.style.display = 'none';
                    return;
                }
                requestBody = {
                    startDate: params.startDate,
                    endDate: params.endDate,
                    aggregationLevel: 'DAILY' // Default for custom, or infer from range
                };
                break;
            default:
                displayMessageModal('Filter Error', 'Invalid filter type selected.');
                if (loadingIndicator) loadingIndicator.style.display = 'none';
                return;
        }

        try {
            const url = `${API_BASE_URL}${PROFIT_ANALYTICS_ENDPOINT}`; // Combine base URL with endpoint path

            const response = await fetch(url, {
                method: 'POST', // Use POST method as per API documentation
                headers: {
                    'Content-Type': 'application/json', // Essential for sending JSON body
                    'Authorization': `Bearer ${token}` // Include JWT token for authentication
                },
                body: JSON.stringify(requestBody) // Send the constructed JSON body
            });

            if (response.status === 401) {
                displayMessageModal('Unauthorized', 'Your session may have expired. Please login again.');
                // Optionally redirect to login page: window.location.href = '/login';
                return;
            }

            if (!response.ok) {
                let errorDetails = `Status: ${response.status}`;
                let errorMessageForUser = `An error occurred (${response.status}).`; // Default user message

                // Clone the response to safely read its body without consuming the original stream
                const clonedResponse = response.clone();

                try {
                    // Try to parse the cloned response as JSON
                    const errorData = await clonedResponse.json();
                    if (errorData && errorData.message) {
                        errorMessageForUser = errorData.message;
                        errorDetails += `, Message: ${errorData.message}`;
                    } else if (errorData) {
                        errorMessageForUser = `Server error: ${JSON.stringify(errorData)}`;
                        errorDetails += `, Details: ${JSON.stringify(errorData)}`;
                    }
                } catch (jsonParseError) {
                    // If JSON parsing fails, read the cloned response as text
                    const textError = await clonedResponse.text();
                    errorMessageForUser = textError || response.statusText || 'Unknown error.';
                    errorDetails += `, Raw Response: ${textError.substring(0, 200)}...`; // Limit length for console
                }
                throw new Error(`Failed to fetch profit data. ${errorMessageForUser}`);
            }

            const data = await response.json(); // This will only be called if response.ok is true
            populateProfitTable(data);
        } catch (error) {
            console.error('Error fetching profit data:', error);
            displayMessageModal('Error', `Failed to fetch profit data: ${error.message}`);
        } finally {
            // Hide loading indicator
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        }
    }

    // --- Function to populate the profit analysis table ---
    function populateProfitTable(data) {
        profitAnalysisTableBody.innerHTML = ''; // Clear existing table data
        if (data && Array.isArray(data) && data.length > 0) {
            data.forEach(item => {
                const row = profitAnalysisTableBody.insertRow();
                row.insertCell().textContent = item.period || '';
                row.insertCell().textContent = item.totalDisbursement !== undefined ? item.totalDisbursement.toFixed(2) : '';
                row.insertCell().textContent = item.totalRepayment !== undefined ? item.totalRepayment.toFixed(2) : '';
                row.insertCell().textContent = item.interestEarned !== undefined ? item.interestEarned.toFixed(2) : '';
                row.insertCell().textContent = item.overdueLoans !== undefined ? item.overdueLoans : ''; // Assuming this is an integer
                row.insertCell().textContent = item.totalOverdueAmount !== undefined ? item.totalOverdueAmount.toFixed(2) : '';
                row.insertCell().textContent = item.profit !== undefined ? item.profit.toFixed(2) : '';
                // Add more cells based on your API response structure if needed
            });
        } else {
            const row = profitAnalysisTableBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 7; // Adjust colspan based on the number of columns in your table
            cell.textContent = 'No profit data available for the selected period.';
            cell.style.textAlign = 'center';
            cell.style.padding = '20px';
        }
    }

    // --- Message Modal (replaces alert()) ---
    function displayMessageModal(title, message) {
        // This function assumes the customMessageModal HTML structure exists in the DOM.
        // It will find the existing modal and populate its content.
        let modal = document.getElementById('customMessageModal');
        let modalTitle = document.getElementById('modalTitle');
        let modalMessage = document.getElementById('modalMessage');
        let modalCloseBtn = document.getElementById('modalCloseBtn');

        if (modal && modalTitle && modalMessage && modalCloseBtn) {
            modalTitle.textContent = title;
            modalMessage.textContent = message;
            modal.style.display = 'block'; // Show the modal by setting display style

            // Remove previous event listener to prevent multiple bindings
            const oldCloseBtn = modalCloseBtn;
            const newCloseBtn = oldCloseBtn.cloneNode(true);
            oldCloseBtn.parentNode.replaceChild(newCloseBtn, oldCloseBtn);
            newCloseBtn.addEventListener('click', () => {
                modal.style.display = 'none'; // Hide the modal by setting display style
            });
        } else {
            console.warn("Custom message modal elements not found, falling back to alert.");
            alert(`${title}: ${message}`);
        }
    }


    // --- Event listener for filter period change ---
    filterPeriod.addEventListener('change', () => {
        // Hide all selectors first
        monthYearSelector.style.display = 'none';
        quarterYearSelector.style.display = 'none';
        yearOnlySelector.style.display = 'none';
        customRangeSelector.style.display = 'none';

        // Show the selected selector
        switch (filterPeriod.value) {
            case 'monthly':
                monthYearSelector.style.display = ''; // Use empty string to revert to default display (flex)
                break;
            case 'quarterly':
                quarterYearSelector.style.display = '';
                break;
            case 'yearly':
                yearOnlySelector.style.display = '';
                break;
            case 'custom':
                customRangeSelector.style.display = '';
                break;
        }
    });

    // --- Event listeners for applying filters ---
    applyMonthYearFilter.addEventListener('click', () => {
        const month = monthSelect.value;
        const year = yearInput.value;
        fetchProfitData('monthly', { month, year });
    });

    applyQuarterYearFilter.addEventListener('click', () => {
        const quarter = quarterSelect.value;
        const year = yearQuarterInput.value;
        fetchProfitData('quarterly', { quarter, year });
    });

    applyYearFilter.addEventListener('click', () => {
        const year = onlyYearInput.value;
        fetchProfitData('yearly', { year });
    });

    applyCustomRangeFilter.addEventListener('click', () => {
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        fetchProfitData('custom', { startDate, endDate });
    });

    // --- Event listeners for export buttons (Conceptual implementation) ---
    exportPdfBtn.addEventListener('click', () => {
        displayMessageModal('Export Feature', 'Exporting to PDF functionality needs backend API integration.');
        // To implement this, you'd typically make a POST request to your backend's PDF export endpoint.
        // The backend would then generate the PDF and return it as a file (e.g., application/pdf blob).
        // Example conceptual call (uncomment and adapt if you implement backend export):
        /*
        const currentFilterData = getCurrentFilterRequestData(); // Get data formatted for API request body
        fetch(`${API_BASE_URL}/api/report/profit/export/pdf`, { // Example export endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
            },
            body: JSON.stringify(currentFilterData)
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to generate PDF');
            return response.blob(); // Expecting a file blob
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `profit_analytics_report.pdf`; // Suggest a filename
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url); // Clean up the URL object
            a.remove();
            displayMessageModal('Export Success', 'PDF export initiated successfully.');
        })
        .catch(error => displayMessageModal('Export Error', `Failed to export PDF: ${error.message}`));
        */
    });

    exportXmlBtn.addEventListener('click', () => {
        displayMessageModal('Export Feature', 'Exporting to XML functionality needs backend API integration.');
        // Similar to PDF export, you'd make a POST request to your backend's XML export endpoint.
        // Example conceptual call (uncomment and adapt if you implement backend export):
        /*
        const currentFilterData = getCurrentFilterRequestData(); // Get data formatted for API request body
        fetch(`${API_BASE_URL}/api/report/profit/export/xml`, { // Example export endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
            },
            body: JSON.stringify(currentFilterData)
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to generate XML');
            return response.text(); // Expecting XML text
        })
        .then(xmlData => {
            const blob = new Blob([xmlData], { type: 'application/xml' }); // Correct MIME type for XML
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `profit_analytics_report.xml`; // Suggest a filename
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
            displayMessageModal('Export Success', 'XML export initiated successfully.');
        })
        .catch(error => displayMessageModal('Export Error', `Failed to export XML: ${error.message}`));
        */
    });

    // --- Helper function to get the current filter parameters in API request body format ---
    // This is useful for export functionalities where you might send the same filter criteria.
    function getCurrentFilterRequestData() {
        const filterType = filterPeriod.value;
        const params = {};
        let requestBody = {};

        switch (filterType) {
            case 'monthly':
                params.month = monthSelect.value;
                params.year = yearInput.value;
                const month = String(params.month).padStart(2, '0');
                const year = params.year;
                const lastDayOfMonth = new Date(year, month, 0).getDate();
                requestBody = {
                    startDate: `${year}-${month}-01`,
                    endDate: `${year}-${month}-${lastDayOfMonth}`,
                    aggregationLevel: 'MONTHLY'
                };
                break;
            case 'quarterly':
                params.quarter = quarterSelect.value;
                params.year = yearQuarterInput.value;
                const quarterDates = getQuarterDates(params.year, params.quarter);
                requestBody = {
                    startDate: quarterDates ? quarterDates.startDate : '',
                    endDate: quarterDates ? quarterDates.endDate : '',
                    aggregationLevel: 'QUARTERLY'
                };
                break;
            case 'yearly':
                params.year = onlyYearInput.value;
                requestBody = {
                    startDate: `${params.year}-01-01`,
                    endDate: `${params.year}-12-31`,
                    aggregationLevel: 'YEARLY'
                };
                break;
            case 'custom':
                params.startDate = startDateInput.value;
                params.endDate = endDateInput.value;
                requestBody = {
                    startDate: params.startDate,
                    endDate: params.endDate,
                    aggregationLevel: 'DAILY'
                };
                break;
        }
        return requestBody;
    }

    // --- Initial Load ---
    // Set default filter to monthly and fetch data for the current month/year
    const today = new Date();
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0'); // getMonth() is 0-indexed
    const currentYear = today.getFullYear();

    // Set initial values in the monthly filter inputs
    monthSelect.value = currentMonth;
    yearInput.value = currentYear;
    filterPeriod.value = 'monthly'; // Ensure the dropdown reflects monthly

    // Manually set initial display for selectors as there's no inline style in HTML
    monthYearSelector.style.display = ''; // Revert to default (likely 'block' or 'flex')
    quarterYearSelector.style.display = 'none';
    yearOnlySelector.style.display = 'none';
    customRangeSelector.style.display = 'none';

    // Ensure the custom message modal is hidden on initial load
    const customMessageModal = document.getElementById('customMessageModal');
    if (customMessageModal) {
        customMessageModal.style.display = 'none';
    }
    // Ensure loading indicator is hidden on initial load
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }


    // Trigger initial fetch
    fetchProfitData('monthly', { month: currentMonth, year: currentYear });
});
