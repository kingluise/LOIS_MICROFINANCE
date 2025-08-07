document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const filterPeriod = document.getElementById('filterPeriod');
    const monthYearSelector = document.getElementById('monthYearSelector');
    const quarterYearSelector = document.getElementById('quarterYearSelector');
    const yearOnlySelector = document.getElementById('yearOnlySelector');
    const customRangeSelector = document.getElementById('customRangeSelector');

    const monthSelect = document.getElementById('month');
    // CORRECTED: Now consistently referencing the HTML element with id="year"
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
    const loadingIndicator = document.getElementById('loadingIndicator');

    // --- Constants ---
    // API_BASE_URL is assumed to be defined globally (e.g., in apiconfig.js)
    const PROFIT_ANALYTICS_ENDPOINT = '/report/profit/analytics';

    // --- Helper for Date Calculations ---
    function getQuarterDates(year, quarter) {
        let startDate, endDate;
        switch (String(quarter)) {
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
    async function fetchProfitData(filterType, params = {}, clickedButton = null) {
        const token = localStorage.getItem('jwt_token');

        if (!token) {
            displayMessageModal('Authentication Error', 'No authentication token found. Please login.');
            return;
        }

        if (loadingIndicator) loadingIndicator.style.display = 'block';
        if (clickedButton) clickedButton.disabled = true;

        let requestBody = {};
        let filterEnumValue;

        switch (filterType) {
            case 'monthly':
                if (!params.month || !params.year) {
                    displayMessageModal('Input Error', 'Please select both month and year.');
                    if (loadingIndicator) loadingIndicator.style.display = 'none';
                    if (clickedButton) clickedButton.disabled = false;
                    return;
                }
                requestBody = {
                    Month: parseInt(params.month, 10),
                    Year: parseInt(params.year, 10)
                };
                filterEnumValue = 1;
                break;

            case 'quarterly':
                if (!params.quarter || !params.year) {
                    displayMessageModal('Input Error', 'Please select both quarter and year.');
                    if (loadingIndicator) loadingIndicator.style.display = 'none';
                    if (clickedButton) clickedButton.disabled = false;
                    return;
                }
                requestBody = {
                    Quarter: parseInt(params.quarter, 10),
                    Year: parseInt(params.year, 10)
                };
                filterEnumValue = 2;
                break;

            case 'yearly':
                if (!params.year) {
                    displayMessageModal('Input Error', 'Please select a year.');
                    if (loadingIndicator) loadingIndicator.style.display = 'none';
                    if (clickedButton) clickedButton.disabled = false;
                    return;
                }
                requestBody = {
                    Year: parseInt(params.year, 10)
                };
                filterEnumValue = 3;
                break;

            case 'custom':
                if (!params.startDate || !params.endDate) {
                    displayMessageModal('Input Error', 'Please select both start and end dates.');
                    if (loadingIndicator) loadingIndicator.style.display = 'none';
                    if (clickedButton) clickedButton.disabled = false;
                    return;
                }
                if (new Date(params.startDate) > new Date(params.endDate)) {
                    displayMessageModal('Input Error', 'Start date cannot be after end date.');
                    if (loadingIndicator) loadingIndicator.style.display = 'none';
                    if (clickedButton) clickedButton.disabled = false;
                    return;
                }
                requestBody = {
                    From: params.startDate,
                    To: params.endDate
                };
                filterEnumValue = 4;
                break;

            default:
                displayMessageModal('Filter Error', 'Invalid filter type selected.');
                if (loadingIndicator) loadingIndicator.style.display = 'none';
                if (clickedButton) clickedButton.disabled = false;
                return;
        }

        requestBody.Filter = filterEnumValue;

        try {
            const url = `${API_BASE_URL}${PROFIT_ANALYTICS_ENDPOINT}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestBody)
            });

            if (response.status === 401) {
                displayMessageModal('Unauthorized', 'Your session may have expired. Please login again.');
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.Message || `An error occurred (${response.status}).`;
                throw new Error(errorMessage);
            }

            // CORRECTED: Extract responseObject from the API response
            const apiResponse = await response.json();
            let profitDataToDisplay = [];

            if (apiResponse.isSuccessful && apiResponse.responseObject) {
                // If responseObject is a single object, wrap it in an array for populateProfitTable
                if (typeof apiResponse.responseObject === 'object' && apiResponse.responseObject !== null) {
                    profitDataToDisplay = [apiResponse.responseObject];
                }
                // If responseObject could also be an array directly, you might add:
                // else if (Array.isArray(apiResponse.responseObject)) {
                //     profitDataToDisplay = apiResponse.responseObject;
                // }
            }
            populateProfitTable(profitDataToDisplay); // Pass the prepared array to the table function
        } catch (error) {
            console.error('Error fetching profit data:', error);
            displayMessageModal('Error', `Failed to fetch profit data: ${error.message}`);
        } finally {
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            if (clickedButton) clickedButton.disabled = false;
        }
    }

    // --- Function to populate the profit analysis table ---
    function populateProfitTable(data) {
        profitAnalysisTableBody.innerHTML = '';
        if (data && Array.isArray(data) && data.length > 0) {
            data.forEach(item => {
                const row = profitAnalysisTableBody.insertRow();
                row.insertCell().textContent = item.period || '';
                row.insertCell().textContent = item.totalDisbursement !== undefined ? item.totalDisbursement.toFixed(2) : '';
                row.insertCell().textContent = item.totalRepayment !== undefined ? item.totalRepayment.toFixed(2) : '';
                row.insertCell().textContent = item.interestEarned !== undefined ? item.interestEarned.toFixed(2) : '';
                row.insertCell().textContent = item.overdueLoans !== undefined ? item.overdueLoans : '';
                row.insertCell().textContent = item.totalOverdueAmount !== undefined ? item.totalOverdueAmount.toFixed(2) : '';
                row.insertCell().textContent = item.profit !== undefined ? item.profit.toFixed(2) : '';
            });
        } else {
            const row = profitAnalysisTableBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 7;
            cell.textContent = 'No profit data available for the selected period.';
            cell.style.textAlign = 'center';
            cell.style.padding = '20px';
        }
    }

    // --- Message Modal (replaces alert()) ---
    function displayMessageModal(title, message) {
        let modal = document.getElementById('customMessageModal');
        let modalTitle = document.getElementById('modalTitle');
        let modalMessage = document.getElementById('modalMessage');
        let modalCloseBtn = document.getElementById('modalCloseBtn');

        if (modal && modalTitle && modalMessage && modalCloseBtn) {
            modalTitle.textContent = title;
            modalMessage.textContent = message;
            modal.style.display = 'block';

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

    // --- Event listener for filter period change ---
    filterPeriod.addEventListener('change', () => {
        // Hide all selectors by removing the 'active' class
        monthYearSelector.classList.remove('active');
        quarterYearSelector.classList.remove('active');
        yearOnlySelector.classList.remove('active');
        customRangeSelector.classList.remove('active');

        switch (filterPeriod.value) {
            case 'monthly':
                monthYearSelector.classList.add('active');
                break;
            case 'quarterly':
                quarterYearSelector.classList.add('active');
                break;
            case 'yearly':
                yearOnlySelector.classList.add('active');
                break;
            case 'custom':
                customRangeSelector.classList.add('active');
                break;
        }
    });

    // --- Event listeners for applying filters ---
    applyMonthYearFilter.addEventListener('click', (event) => {
        const month = monthSelect.value;
        const year = yearInput.value; // Correctly referencing yearInput
        fetchProfitData('monthly', { month, year }, event.currentTarget);
    });

    applyQuarterYearFilter.addEventListener('click', (event) => {
        const quarter = quarterSelect.value;
        const year = yearQuarterInput.value;
        fetchProfitData('quarterly', { quarter, year }, event.currentTarget);
    });

    applyYearFilter.addEventListener('click', (event) => {
        const year = onlyYearInput.value;
        fetchProfitData('yearly', { year }, event.currentTarget);
    });

    applyCustomRangeFilter.addEventListener('click', (event) => {
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        fetchProfitData('custom', { startDate, endDate }, event.currentTarget);
    });

    // --- Event listeners for export buttons (Conceptual implementation) ---
    exportPdfBtn.addEventListener('click', () => {
        displayMessageModal('Export Feature', 'Exporting to PDF functionality needs backend API integration.');
    });

    exportXmlBtn.addEventListener('click', () => {
        displayMessageModal('Export Feature', 'Exporting to XML functionality needs backend API integration.');
    });

    // --- Helper function to get the current filter parameters in API request body format ---
    function getCurrentFilterRequestData() {
        const filterType = filterPeriod.value;
        const params = {};
        let requestBody = {};
        let filterEnumValue;

        switch (filterType) {
            case 'monthly':
                params.month = monthSelect.value;
                params.year = yearInput.value; // Correctly referencing yearInput
                requestBody = {
                    Month: parseInt(params.month, 10),
                    Year: parseInt(params.year, 10)
                };
                filterEnumValue = 1;
                break;
            case 'quarterly':
                params.quarter = quarterSelect.value;
                params.year = yearQuarterInput.value;
                requestBody = {
                    Quarter: parseInt(params.quarter, 10),
                    Year: parseInt(params.year, 10)
                };
                filterEnumValue = 2;
                break;
            case 'yearly':
                params.year = onlyYearInput.value;
                requestBody = {
                    Year: parseInt(params.year, 10)
                };
                filterEnumValue = 3;
                break;
            case 'custom':
                params.startDate = startDateInput.value;
                params.endDate = endDateInput.value;
                requestBody = {
                    From: params.startDate,
                    To: params.endDate
                };
                filterEnumValue = 4;
                break;
        }
        requestBody.Filter = filterEnumValue;
        return requestBody;
    }

    // --- Initial Load ---
    const today = new Date();
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
    const currentYear = today.getFullYear();

    // Added checks before setting values for initial load
    if (monthSelect) {
        monthSelect.value = currentMonth;
    } else {
        console.error("Element with ID 'month' not found.");
    }

    if (yearInput) { // Correctly referencing yearInput
        yearInput.value = currentYear;
    } else {
        console.error("Element with ID 'year' not found.");
    }

    if (filterPeriod) {
        filterPeriod.value = 'monthly';
    } else {
        console.error("Element with ID 'filterPeriod' not found.");
    }

    // Initial display logic, also with checks
    if (monthYearSelector) monthYearSelector.classList.add('active'); // Use class for initial display
    if (quarterYearSelector) quarterYearSelector.classList.remove('active');
    if (yearOnlySelector) yearOnlySelector.classList.remove('active');
    if (customRangeSelector) customRangeSelector.classList.remove('active');

    const customMessageModal = document.getElementById('customMessageModal');
    if (customMessageModal) {
        customMessageModal.style.display = 'none';
    }
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }

    // Pass the initial button, if applicable, or null
    if (applyMonthYearFilter) {
        fetchProfitData('monthly', { month: currentMonth, year: currentYear }, applyMonthYearFilter);
    } else {
        console.error("Element with ID 'applyMonthYearFilter' not found for initial fetch.");
    }
});
