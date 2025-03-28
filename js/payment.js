// scripts/payment.js

document.addEventListener('DOMContentLoaded', () => {
    const customerIdInput = document.getElementById('customerId');
    const paymentForm = document.getElementById('paymentForm');
    const approvalsTableBody = document.querySelector('#approvalsTable tbody');
    const logPaymentForm = document.getElementById('logPaymentForm');
    const pendingApprovals = document.getElementById('pendingApprovals');
    const logPaymentBtn = document.getElementById('logPaymentBtn');
    const pendingApprovalsBtn = document.getElementById('pendingApprovalsBtn');
    const API_BASE_URL = '/api'; // Replace with your actual API base URL

    async function getCustomer(customerId) {
        try {
            const response = await fetch(`${API_BASE_URL}/customers/${customerId}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch customer: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API Error (getCustomer):', error);
            throw error;
        }
    }

    async function getLoansByCustomer(customerId) {
        try {
            const response = await fetch(`${API_BASE_URL}/loans/customer/${customerId}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch loans: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API Error (getLoansByCustomer):', error);
            throw error;
        }
    }

    async function recordPayment(paymentData) {
        try {
            const response = await fetch(`${API_BASE_URL}/payments/log`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentData),
            });
            if (!response.ok) {
                throw new Error(`Failed to record payment: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API Error (recordPayment):', error);
            throw error;
        }
    }

    async function getPendingPayments() {
        try {
            const response = await fetch(`${API_BASE_URL}/payments/pending`);
            if (!response.ok) {
                throw new Error(`Failed to fetch pending payments: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API Error (getPendingPayments):', error);
            throw error;
        }
    }

    async function acceptPayment(paymentId) {
        try {
            const response = await fetch(`${API_BASE_URL}/payments/accept/${paymentId}`, {
                method: 'PUT',
            });
            if (!response.ok) {
                throw new Error(`Failed to accept payment: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API Error (acceptPayment):', error);
            throw error;
        }
    }

    async function rejectPayment(paymentId) {
        try {
            const response = await fetch(`${API_BASE_URL}/payments/reject/${paymentId}`, {
                method: 'PUT',
            });
            if (!response.ok) {
                throw new Error(`Failed to reject payment: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API Error (rejectPayment):', error);
            throw error;
        }
    }

    async function populateFormFields(customerId) {
        try {
            const customer = await getCustomer(customerId);
            const loans = await getLoansByCustomer(customerId);

            if (loans.length > 0) {
                const loan = loans[0];
                document.getElementById('fullName').value = customer.fullName;
                document.getElementById('loanType').value = loan.loanType;
                document.getElementById('loanAmount').value = loan.loanAmount;
                document.getElementById('totalBalance').value = loan.totalBalance;
            } else {
                alert('No loans found for this customer.');
            }
        } catch (error) {
            alert(error.message);
        }
    }

    customerIdInput.addEventListener('input', () => {
        const customerId = customerIdInput.value;
        if (customerId) {
            populateFormFields(customerId);
        }
    });

    paymentForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const paymentData = {
            customerId: document.getElementById('customerId').value,
            amountPaid: parseFloat(document.getElementById('amountPaid').value),
            modeOfPayment: document.getElementById('modeOfPayment').value,
        };
        try {
            await recordPayment(paymentData);
            alert('Payment logged successfully.');
            paymentForm.reset();
            logPaymentForm.classList.add('hidden');
            renderPendingApprovals();
        } catch (error) {
            alert(error.message);
        }
    });

    async function renderPendingApprovals() {
        try {
            const payments = await getPendingPayments();
            approvalsTableBody.innerHTML = '';

            payments.forEach(payment => {
                const row = approvalsTableBody.insertRow();
                row.innerHTML = `
                    <td>${payment.customerId}</td>
                    <td>${payment.fullName}</td>
                    <td>${payment.loanType}</td>
                    <td>${payment.loanAmount}</td>
                    <td>${payment.totalBalance}</td>
                    <td>${payment.amountPaid}</td>
                    <td>${payment.modeOfPayment}</td>
                    <td>${payment.newLoanBalance}</td>
                    <td>${payment.status}</td>
                    <td>
                        <button class="accept-btn" data-id="${payment.paymentId}">Accept</button>
                        <button class="reject-btn" data-id="${payment.paymentId}">Reject</button>
                    </td>
                `;
            });

            document.querySelectorAll('.accept-btn').forEach(button => {
                button.addEventListener('click', async () => {
                    const paymentId = button.dataset.id;
                    try {
                        await acceptPayment(paymentId);
                        renderPendingApprovals();
                    } catch (error) {
                        alert(error.message);
                    }
                });
            });

            document.querySelectorAll('.reject-btn').forEach(button => {
                button.addEventListener('click', async () => {
                    const paymentId = button.dataset.id;
                    try {
                        await rejectPayment(paymentId);
                        renderPendingApprovals();
                    } catch (error) {
                        alert(error.message);
                    }
                });
            });
        } catch (error) {
            alert(error.message);
        }
    }

    logPaymentBtn.addEventListener('click', () => {
        logPaymentForm.classList.remove('hidden');
        pendingApprovals.classList.add('hidden');
    });

    pendingApprovalsBtn.addEventListener('click', () => {
        pendingApprovals.classList.remove('hidden');
        logPaymentForm.classList.add('hidden');
        renderPendingApprovals();
    });

    renderPendingApprovals();
});