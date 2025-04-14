document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const loanId = urlParams.get('id');
    const loanDetailsTableBody = document.querySelector('#loan-details-table tbody');
    const loanStatusSelect = document.getElementById('loan-status');
    const updateStatusBtn = document.getElementById('update-status-btn');
    const generateCsvBtn = document.getElementById('generate-csv-btn');
    const generatePdfBtn = document.getElementById('generate-pdf-btn');

    // Fetch and display loan details in a table
    fetch(`/api/loans/${loanId}`)
        .then(response => response.json())
        .then(loan => {
            const details = [
                { field: 'Loan ID', value: loan.id },
                { field: 'Customer Name', value: loan.fullName },
                { field: 'Loan Amount', value: loan.loanAmount },
                { field: 'Interest', value: loan.interest },
                { field: 'Duration', value: loan.duration },
                { field: 'Repayment', value: loan.weeklyInstallment || loan.monthlyInstallment },
                { field: 'Balance', value: loan.balance },
                { field: 'Group', value: loan.group },
                { field: 'Status', value: loan.status },
            ];

            details.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.field}</td>
                    <td>${item.value}</td>
                `;
                loanDetailsTableBody.appendChild(row);
            });

            loanStatusSelect.value = loan.status;
        })
        .catch(error => {
            console.error("Error fetching loan details:", error);
            alert("Failed to fetch loan details. Please try again.");
        });

    // Update loan status
    updateStatusBtn.addEventListener('click', () => {
        const newStatus = loanStatusSelect.value;
        fetch(`/api/loans/${loanId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        })
            .then(response => response.json())
            .then(updatedLoan => {
                alert('Loan status updated successfully.');
                const statusRow = Array.from(loanDetailsTableBody.children).find(row => row.children[0].textContent === 'Status');
                statusRow.children[1].textContent = updatedLoan.status;
            })
            .catch(error => {
                console.error("Error updating loan status:", error);
                alert("Failed to update loan status. Please try again.");
            });
    });

    // Generate CSV report
    generateCsvBtn.addEventListener('click', () => {
        fetch(`/api/loans/${loanId}/csv`)
            .then(response => response.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `loan_${loanId}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            })
            .catch(error => {
                console.error("Error generating CSV:", error);
                alert("Failed to generate CSV. Please try again.");
            });
    });

    // Generate PDF report
    generatePdfBtn.addEventListener('click', () => {
        fetch(`/api/loans/${loanId}/pdf`)
            .then(response => response.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `loan_${loanId}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            })
            .catch(error => {
                console.error("Error generating PDF:", error);
                alert("Failed to generate PDF. Please try again.");
            });
    });
});
