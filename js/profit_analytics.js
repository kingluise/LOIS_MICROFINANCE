document.addEventListener('DOMContentLoaded', () => {
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

    // Function to fetch profit data from the API
    async function fetchProfitData(filterType, params = {}) {
        let apiUrl = '/api/profit-analytics'; // Replace with your actual API endpoint

        const queryParams = new URLSearchParams({ filter: filterType, ...params });
        apiUrl += `?${queryParams.toString()}`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData?.message || response.statusText}`);
            }
            const data = await response.json();
            populateProfitTable(data);
        } catch (error) {
            console.error('Error fetching profit data:', error);
            // Optionally display an error message to the user
            alert(`Failed to fetch profit data: ${error.message}`);
        }
    }

    // Function to populate the profit analysis table
    function populateProfitTable(data) {
        profitAnalysisTableBody.innerHTML = ''; // Clear existing table data
        if (data && data.length > 0) {
            data.forEach(item => {
                const row = profitAnalysisTableBody.insertRow();
                row.insertCell().textContent = item.period || '';
                row.insertCell().textContent = item.totalDisbursement || '';
                row.insertCell().textContent = item.totalRepayment || '';
                row.insertCell().textContent = item.interestEarned || '';
                row.insertCell().textContent = item.overdueLoans || '';
                row.insertCell().textContent = item.totalOverdueAmount || '';
                row.insertCell().textContent = item.profit || '';
                // Add more cells based on your API response structure
            });
        } else {
            const row = profitAnalysisTableBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 7; // Adjust colspan based on the number of columns
            cell.textContent = 'No profit data available for the selected period.';
            cell.style.textAlign = 'center';
        }
    }

    // Event listener for filter period change
    filterPeriod.addEventListener('change', () => {
        monthYearSelector.style.display = filterPeriod.value === 'monthly' ? 'flex' : 'none';
        quarterYearSelector.style.display = filterPeriod.value === 'quarterly' ? 'flex' : 'none';
        yearOnlySelector.style.display = filterPeriod.value === 'yearly' ? 'flex' : 'none';
        customRangeSelector.style.display = filterPeriod.value === 'custom' ? 'flex' : 'none';
    });

    // Event listeners for applying filters
    applyMonthYearFilter.addEventListener('click', () => {
        const month = monthSelect.value;
        const year = yearInput.value;
        if (year) {
            fetchProfitData('monthly', { month, year });
        } else {
            alert('Please select a year.');
        }
    });

    applyQuarterYearFilter.addEventListener('click', () => {
        const quarter = quarterSelect.value;
        const year = yearQuarterInput.value;
        if (year) {
            fetchProfitData('quarterly', { quarter, year });
        } else {
            alert('Please select a year.');
        }
    });

    applyYearFilter.addEventListener('click', () => {
        const year = onlyYearInput.value;
        if (year) {
            fetchProfitData('yearly', { year });
        } else {
            alert('Please select a year.');
        }
    });

    applyCustomRangeFilter.addEventListener('click', () => {
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        if (startDate && endDate) {
            fetchProfitData('custom', { startDate, endDate });
        } else {
            alert('Please select both start and end dates.');
        }
    });

    // Event listeners for export buttons
    exportPdfBtn.addEventListener('click', () => {
        // Implement PDF export functionality here
        alert('Exporting to PDF (API call and client-side processing needed)');
        // You would typically call an API endpoint to generate the PDF
        // fetch('/api/export/profit-analytics/pdf', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify(getCurrentFilterParams()) // Send current filter parameters
        // })
        // .then(response => response.blob())
        // .then(blob => {
        //     // Create a download link
        // })
        // .catch(error => console.error('Error exporting to PDF:', error));
    });

    exportXmlBtn.addEventListener('click', () => {
        // Implement XML export functionality here
        alert('Exporting to XML (API call needed)');
        // You would typically call an API endpoint to get the XML data
        // fetch('/api/export/profit-analytics/xml?' + new URLSearchParams(getCurrentFilterParams()))
        // .then(response => response.text())
        // .then(xmlData => {
        //     // Trigger download of XML data
        // })
        // .catch(error => console.error('Error exporting to XML:', error));
    });

    // Helper function to get the current filter parameters
    function getCurrentFilterParams() {
        const filterType = filterPeriod.value;
        const params = {};
        if (filterType === 'monthly') {
            params.month = monthSelect.value;
            params.year = yearInput.value;
        } else if (filterType === 'quarterly') {
            params.quarter = quarterSelect.value;
            params.year = yearQuarterInput.value;
        } else if (filterType === 'yearly') {
            params.year = onlyYearInput.value;
        } else if (filterType === 'custom') {
            params.startDate = startDateInput.value;
            params.endDate = endDateInput.value;
        }
        return params;
    }

    // Initial load - maybe fetch data for the current month/year by default
    const today = new Date();
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
    const currentYear = today.getFullYear();
    fetchProfitData('monthly', { month: currentMonth, year: currentYear });
});
