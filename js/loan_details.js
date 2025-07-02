document.addEventListener("DOMContentLoaded", function () {
    // DOM Elements
    const urlParams = new URLSearchParams(window.location.search);
    const loanId = urlParams.get('id');
    const loanDetailsTableBody = document.querySelector('#loan-details-table tbody');
    const paymentPlanTableBody = document.querySelector('#payment-plan-table tbody');
    const loanStatusSelect = document.getElementById('loan-status');
    const updateStatusBtn = document.getElementById('update-status-btn');
    const generateCsvBtn = document.getElementById('generate-csv-btn');
    const generatePdfBtn = document.getElementById('generate-pdf-btn');
    const refreshPaymentPlanBtn = document.getElementById('refresh-payment-plan');
    const loadingIndicator = document.getElementById('loading-indicator');

    // State
    let currentLoan = null;

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN'
        }).format(amount);
    };

    // Show loading state
    const showLoading = (show) => {
        loadingIndicator.style.display = show ? 'block' : 'none';
    };

    // Fetch payment plan
    const fetchPaymentPlan = async (loanId) => {
        try {
            showLoading(true);
            const response = await fetch(`/api/customer/loan/${loanId}/paymentplan`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to fetch payment plan');
            const data = await response.json();
            return data.items || [];
        } catch (error) {
            console.error("Payment plan error:", error);
            showCustomAlert(`Failed to load payment plan: ${error.message}`, 'error');
            return [];
        } finally {
            showLoading(false);
        }
    };

    // Render payment plan
    const renderPaymentPlan = (paymentPlanItems) => {
        paymentPlanTableBody.innerHTML = '';
        
        if (paymentPlanItems.length === 0) {
            paymentPlanTableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="no-data">No payment plan available</td>
                </tr>
            `;
            return;
        }

        paymentPlanItems.forEach((item, index) => {
            const row = document.createElement('tr');
            row.className = `payment-plan-item ${item.status.toLowerCase()}`;
            row.innerHTML = `
                <td>${new Date(item.dueDate).toLocaleDateString()}</td>
                <td>${formatCurrency(item.amountDue)}</td>
                <td class="status ${item.status.toLowerCase()}">
                    ${item.status}
                </td>
                <td>
                    ${item.status === 'UNPAID' ? 
                        `<button class="btn pay-btn" 
                                data-plan-id="${item.id}"
                                data-amount="${item.amountDue}">
                            Pay Now
                        </button>` : 
                        '<span class="paid-badge">Paid</span>'}
                </td>
            `;
            paymentPlanTableBody.appendChild(row);
        });

        // Add event listeners to payment buttons
        document.querySelectorAll('.pay-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const planId = e.target.dataset.planId;
                const amount = e.target.dataset.amount;
                window.location.href = `payment.html?loanId=${loanId}&planId=${planId}&amount=${amount}`;
            });
        });
    };

    // Fetch loan details
    const fetchLoanDetails = async () => {
        try {
            showLoading(true);
            const response = await fetch(`/api/loans/${loanId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to fetch loan details');
            return await response.json();
        } catch (error) {
            console.error("Loan details error:", error);
            showCustomAlert(`Failed to load loan details: ${error.message}`, 'error');
            return null;
        } finally {
            showLoading(false);
        }
    };

    // Render loan details
    const renderLoanDetails = (loan) => {
        if (!loan) return;
        
        loanDetailsTableBody.innerHTML = '';
        currentLoan = loan;

        const details = [
            { field: 'Loan ID', value: loan.id },
            { field: 'Customer Name', value: loan.customerName || loan.fullName },
            { field: 'Loan Amount', value: formatCurrency(loan.amount || loan.loanAmount) },
            { field: 'Interest Rate', value: `${loan.interestRate || loan.interest}%` },
            { field: 'Duration', value: `${loan.duration} months` },
            { field: 'Repayment Amount', 
              value: formatCurrency(loan.repaymentAmount || loan.weeklyInstallment || loan.monthlyInstallment) },
            { field: 'Balance', value: formatCurrency(loan.balance) },
            { field: 'Loan Group', value: loan.loanGroup || loan.group },
            { field: 'Status', value: loan.status },
            { field: 'Disbursement Date', 
              value: loan.disbursementDate ? new Date(loan.disbursementDate).toLocaleDateString() : 'N/A' },
        ];

        details.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="detail-label">${item.field}</td>
                <td class="detail-value">${item.value}</td>
            `;
            loanDetailsTableBody.appendChild(row);
        });

        loanStatusSelect.value = loan.status;
    };

    // Load all data
    const loadAllData = async () => {
        const loan = await fetchLoanDetails();
        if (loan) {
            renderLoanDetails(loan);
            const paymentPlan = await fetchPaymentPlan(loanId);
            renderPaymentPlan(paymentPlan);
        }
    };

    // Update loan status
    updateStatusBtn.addEventListener('click', async () => {
        const newStatus = loanStatusSelect.value;
        
        try {
            showLoading(true);
            const response = await fetch(`/api/loans/${loanId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            
            if (!response.ok) throw new Error('Status update failed');
            const updatedLoan = await response.json();
            
            currentLoan.status = newStatus;
            renderLoanDetails(currentLoan);
            showCustomAlert('Loan status updated successfully!', 'success');
        } catch (error) {
            console.error("Status update error:", error);
            showCustomAlert(`Failed to update status: ${error.message}`, 'error');
            loanStatusSelect.value = currentLoan.status; // Revert select
        } finally {
            showLoading(false);
        }
    });

    // Generate CSV
    generateCsvBtn.addEventListener('click', async () => {
        try {
            showLoading(true);
            const response = await fetch(`/api/loans/${loanId}/csv`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
                }
            });
            
            if (!response.ok) throw new Error('CSV generation failed');
            const blob = await response.blob();
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `loan_${loanId}_report.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("CSV error:", error);
            showCustomAlert(`Failed to generate CSV: ${error.message}`, 'error');
        } finally {
            showLoading(false);
        }
    });

    // Generate PDF
    generatePdfBtn.addEventListener('click', async () => {
        try {
            showLoading(true);
            const response = await fetch(`/api/loans/${loanId}/pdf`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
                }
            });
            
            if (!response.ok) throw new Error('PDF generation failed');
            const blob = await response.blob();
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `loan_${loanId}_report.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("PDF error:", error);
            showCustomAlert(`Failed to generate PDF: ${error.message}`, 'error');
        } finally {
            showLoading(false);
        }
    });

    // Refresh payment plan
    if (refreshPaymentPlanBtn) {
        refreshPaymentPlanBtn.addEventListener('click', async () => {
            const paymentPlan = await fetchPaymentPlan(loanId);
            renderPaymentPlan(paymentPlan);
        });
    }

    // Custom alert function
    window.showCustomAlert = (message, type = 'info') => {
        // Implement your preferred alert/notification system
        alert(`${type.toUpperCase()}: ${message}`);
    };

    // Initialize
    loadAllData();
});