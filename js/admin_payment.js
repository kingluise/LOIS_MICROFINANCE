document.addEventListener('DOMContentLoaded', () => {
    const logPaymentBtn = document.getElementById('logPaymentBtn');
    const paymentConfirmationBtn = document.getElementById('paymentConfirmationBtn');
    const logPaymentForm = document.getElementById('logPaymentForm');
    const confirmationTableContainer = document.getElementById('confirmationTableContainer');
    const paymentForm = document.getElementById('paymentForm');
    const cancelLogPayment = document.getElementById('cancelLogPayment');
    const goBackBtn = document.getElementById('goBackBtn');
    const confirmationTableBody = document.querySelector('#confirmationTable tbody');

    // Show the log payment form
    logPaymentBtn.addEventListener('click', () => {
        logPaymentForm.classList.remove('hidden');
        confirmationTableContainer.classList.add('hidden');
    });

    // Show the confirmation table
    paymentConfirmationBtn.addEventListener('click', () => {
        logPaymentForm.classList.add('hidden');
        confirmationTableContainer.classList.remove('hidden');
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

        // Populate the confirmation table
        confirmationTableBody.innerHTML = `
            <tr>
                <td>${customerId}</td>
                <td>${fullName}</td>
                <td>${loanType}</td>
                <td>${loanAmount.toFixed(2)}</td>
                <td>${totalBalance.toFixed(2)}</td>
                <td>${amountPaid.toFixed(2)}</td>
                <td>${modeOfPayment}</td>
                <td>${paymentDate}</td>
                <td>${newLoanBalance.toFixed(2)}</td>
                <td><button class="confirmPayment">Confirm</button></td>
            </tr>
        `;

        // Show the confirmation table
        confirmationTableContainer.classList.remove('hidden');
        logPaymentForm.classList.add('hidden');
    });

    // Handle cancel button
    cancelLogPayment.addEventListener('click', () => {
        // Reset the form fields
        paymentForm.reset();

        // Hide the log payment form and show it again
        logPaymentForm.classList.add('hidden');
        confirmationTableContainer.classList.add('hidden');
    });

    // Handle go back button
    goBackBtn.addEventListener('click', () => {
        confirmationTableContainer.classList.add('hidden');
        logPaymentForm.classList.remove('hidden');
    });

    // Handle confirm payment button
    confirmationTableBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('confirmPayment')) {
            const row = event.target.closest('tr');
            const cells = row.querySelectorAll('td');

            const paymentData = {
                customerId: cells[0].textContent,
                fullName: cells[1].textContent,
                loanType: cells[2].textContent,
                loanAmount: parseFloat(cells[3].textContent),
                totalBalance: parseFloat(cells[4].textContent),
                amountPaid: parseFloat(cells[5].textContent),
                modeOfPayment: cells[6].textContent,
                paymentDate: cells[7].textContent,
                newLoanBalance: parseFloat(cells[8].textContent)
            };

            fetch('/api/payment-confirmation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentData)
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                confirmationTableContainer.classList.add('hidden');
                logPaymentForm.classList.remove('hidden');
            })
            .catch(error => console.error('Error submitting payment confirmation:', error));
        }
    });
});
