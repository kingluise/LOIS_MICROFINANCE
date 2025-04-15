
document.addEventListener('DOMContentLoaded', () => {
    const logPaymentBtn = document.getElementById('logPaymentBtn');
    const logPaymentForm = document.getElementById('logPaymentForm');
    const paymentForm = document.getElementById('paymentForm');
    const cancelLogPayment = document.getElementById('cancelLogPayment');

    // Show the log payment form
    logPaymentBtn.addEventListener('click', () => {
        logPaymentForm.classList.remove('hidden');
    });

    // Handle payment form submission
    paymentForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const customerId = document.getElementById('customerId').value;
        const fullName = document.getElementById('fullName').value;
        const loanType = document.getElementById('loanType').value;
        const loanAmount = parseFloat(document.getElementById('loanAmount').value);
        const totalBalance = parseFloat(document.getElementById('totalBalance').value);
        const amountPaid = parseFloat(document.getElementById('amountPaid').value);
        const modeOfPayment = document.getElementById('modeOfPayment').value;
        const paymentDate = document.getElementById('paymentDate').value;

        // Calculate new loan balance
        const newLoanBalance = totalBalance - amountPaid;

        // Fetch customer and loan data.
        fetch(`/api/customer-loan/${customerId}`)
            .then(response => response.json())
            .then(data => {
                document.getElementById('fullName').value = data.fullName;
                document.getElementById('loanType').value = data.loanType;
                document.getElementById('loanAmount').value = data.loanAmount;
                document.getElementById('totalBalance').value = data.totalBalance;
            })
            .catch(error => console.error('Error fetching customer/loan data:', error));

        // Send payment log to the backend
        const paymentData = {
            customerId: customerId,
            fullName: fullName,
            loanType: loanType,
            loanAmount: loanAmount,
            totalBalance: totalBalance,
            amountPaid: amountPaid,
            modeOfPayment: modeOfPayment,
            paymentDate: paymentDate,
            newLoanBalance: newLoanBalance
        };

        fetch('/api/payment-log', { // Change endpoint to payment-log
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData)
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            logPaymentForm.classList.add('hidden');
            paymentForm.reset();
        })
        .catch(error => console.error('Error logging payment:', error));
    });

    // Handle cancel button
    cancelLogPayment.addEventListener('click', () => {
        paymentForm.reset();
        logPaymentForm.classList.add('hidden');
    });
});