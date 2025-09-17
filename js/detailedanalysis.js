// This script contains the logic for the Profit Analytics dashboard.
// It handles user interactions, fetches data from the API, and populates the tables.

document.addEventListener('DOMContentLoaded', function() {

    // --- DOM Elements ---
    const filterPeriodSelect = document.getElementById('filterPeriod');
    const monthYearSelector = document.getElementById('monthYearSelector');
    const quarterYearSelector = document.getElementById('quarterYearSelector');
    const yearOnlySelector = document.getElementById('yearOnlySelector');
    const customRangeSelector = document.getElementById('customRangeSelector');
    const profitAnalysisTableBody = document.querySelector('#profitAnalysisTable tbody');
    const detailedAnalysisTableBody = document.querySelector('#detailedAnalysisTable tbody');
    const detailedAnalysisSection = document.getElementById('detailedAnalysis');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const customMessageModal = document.getElementById('customMessageModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const logoutBtn = document.getElementById('logout');

    // --- API Configuration ---
    // NOTE: Replace this with the actual base URL from your config.js file
    
    // Fixed: Removed the redundant '/api' from the endpoint path to prevent 404 errors.
    const API_ENDPOINT = `${API_BASE_URL}/Loan/profit-analytics/detailed`;

    // --- Event Listeners ---
    // Toggle filter input fields based on selection
    filterPeriodSelect.addEventListener('change', function() {
        monthYearSelector.style.display = 'none';
        quarterYearSelector.style.display = 'none';
        yearOnlySelector.style.display = 'none';
        customRangeSelector.style.display = 'none';
        
        switch(this.value) {
            case 'monthly':
                monthYearSelector.style.display = 'block';
                break;
            case 'quarterly':
                quarterYearSelector.style.display = 'block';
                break;
            case 'yearly':
                yearOnlySelector.style.display = 'block';
                break;
            case 'custom':
                customRangeSelector.style.display = 'block';
                break;
        }
    });

    // Handle "Apply" button clicks for different filters
    document.getElementById('applyMonthYearFilter').addEventListener('click', () => {
        const month = document.getElementById('month').value;
        const year = document.getElementById('year').value;
        if (month && year) {
            fetchAndRenderAnalytics({ filterType: 'monthly', month, year });
        } else {
            showCustomMessageModal("Input Required", "Please select both a month and a year.");
        }
    });
    
    document.getElementById('applyQuarterYearFilter').addEventListener('click', () => {
        const quarter = document.getElementById('quarter').value;
        const year = document.getElementById('yearQuarter').value;
        if (quarter && year) {
            fetchAndRenderAnalytics({ filterType: 'quarterly', quarter, year });
        } else {
            showCustomMessageModal("Input Required", "Please select both a quarter and a year.");
        }
    });
    
    document.getElementById('applyYearFilter').addEventListener('click', () => {
        const year = document.getElementById('onlyYear').value;
        if (year) {
            fetchAndRenderAnalytics({ filterType: 'yearly', year });
        } else {
            showCustomMessageModal("Input Required", "Please enter a year.");
        }
    });

    document.getElementById('applyCustomRangeFilter').addEventListener('click', () => {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        if (startDate && endDate) {
            fetchAndRenderAnalytics({ filterType: 'custom', startDate, endDate });
        } else {
            showCustomMessageModal("Input Required", "Please select both a start and end date.");
        }
    });
    
    // Export button listeners
    document.getElementById('exportDetailedPdfBtn').addEventListener('click', () => exportData('pdf'));
    document.getElementById('exportDetailedXmlBtn').addEventListener('click', () => exportData('xml'));

    // Logout button listener
    logoutBtn.addEventListener('click', function(event) {
        event.preventDefault();
        // Clear the token and redirect to the login page
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });

    // Modal close button
    modalCloseBtn.addEventListener('click', hideCustomMessageModal);
    
    // --- Core Functions ---
    /**
     * Fetches analytics data from the API and populates the tables.
     * @param {Object} periodValues - An object containing the filter values.
     */
    async function fetchAndRenderAnalytics(periodValues) {
        showLoadingIndicator();

        const authToken = localStorage.getItem('token');
        if (!authToken) {
            showCustomMessageModal("Authentication Error", "You are not logged in. Please log in to view analytics.");
            hideLoadingIndicator();
            return;
        }

        // Reverted to including query parameters to fix the 400 Bad Request error.
        const queryParams = new URLSearchParams(periodValues).toString();
        const requestUrl = `${API_ENDPOINT}?${queryParams}`;

        try {
            const response = await fetch(requestUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // Corrected: Use standard 'Authorization' header with 'Bearer' token.
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Log the full data response to the console to see its structure
            console.log("API Response Data:", data);
            
            // Assuming the API returns a structure with both totals and a breakdown
            const simpleData = data.totals || data;
            const detailedData = data.breakdown || [];
            
            renderSimpleTable(simpleData, data.period);
            renderDetailedTable(detailedData);
            
            // Show the detailed table only if there is data to display
            if (detailedData.length > 0) {
                detailedAnalysisSection.style.display = 'block';
            } else {
                detailedAnalysisSection.style.display = 'none';
            }

        } catch (error) {
            console.error("Error fetching or rendering data:", error);
            showCustomMessageModal("Data Fetch Error", `Failed to load data. Details: ${error.message}`);
        } finally {
            hideLoadingIndicator();
        }
    }

    /**
     * Populates the simple profit analysis table.
     * @param {Object} data - The totals object from the API response.
     * @param {string} periodText - The period text (e.g., "2025-01-01 to 2025-12-31").
     */
    function renderSimpleTable(data, periodText) {
        profitAnalysisTableBody.innerHTML = '';
        if (Object.keys(data).length === 0) {
            profitAnalysisTableBody.innerHTML = '<tr><td colspan="7">No simple analytics data available for this period.</td></tr>';
            return;
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${periodText}</td>
            <td>${data.totalDisbursement}</td>
            <td>${data.totalRepayment}</td>
            <td>${data.totalExpectedInterest}</td>
            <td>${data.defaultedLoans}</td>
            <td>${data.totalDefaultedAmount}</td>
            <td>${data.profitEarned}</td>
        `;
        profitAnalysisTableBody.appendChild(row);
    }

    /**
     * Populates the detailed profit analysis table.
     * @param {Array<Object>} data - The breakdown array from the API response.
     */
    function renderDetailedTable(data) {
        detailedAnalysisTableBody.innerHTML = '';
        if (data.length === 0) {
            detailedAnalysisTableBody.innerHTML = '<tr><td colspan="6">No detailed analytics data available for this period.</td></tr>';
            return;
        }
        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.period}</td>
                <td>${item.disbursement}</td>
                <td>${item.expectedRepayment}</td>
                <td>${item.expectedInterest}</td>
                <td>${item.profitEarned}</td>
                <td>-</td>
            `;
            detailedAnalysisTableBody.appendChild(row);
        });
    }

    // --- Helper UI Functions ---
    function showLoadingIndicator() {
        loadingIndicator.style.display = 'block';
    }

    function hideLoadingIndicator() {
        loadingIndicator.style.display = 'none';
    }

    function showCustomMessageModal(title, message) {
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        customMessageModal.style.display = 'block';
    }

    function hideCustomMessageModal() {
        customMessageModal.style.display = 'none';
    }
    
    // Placeholder for export logic
    function exportData(format) {
        showCustomMessageModal("Exporting Data", `This will export the detailed analytics as a ${format.toUpperCase()} file. (Not yet implemented)`);
    }

    // --- Initial Load ---
    // Hide the pre-loader animation after a short delay
    const rollingLoader = document.querySelector('.rolling-load');
    if (rollingLoader) {
        setTimeout(() => {
            rollingLoader.style.display = 'none';
        }, 1000);
    }
    
    // Initialize the view by fetching data for the current month and year
    const today = new Date();
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
    const currentYear = today.getFullYear();
    document.getElementById('month').value = currentMonth;
    document.getElementById('year').value = currentYear;
    fetchAndRenderAnalytics({ month: currentMonth, year: currentYear });
});
