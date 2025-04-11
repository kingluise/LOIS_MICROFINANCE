document.addEventListener("DOMContentLoaded", function () {
    // Variable Declarations
    const newLoanBtn = document.getElementById("new-loan-btn");
    const loanModal = document.getElementById("new-loan-modal");
    const closeBtn = document.querySelector(".close");
    const loanTypeSelect = document.getElementById("loan-type");
    const weeklyLoanForm = document.getElementById("weekly-loan-form");
    const monthlyLoanForm = document.getElementById("monthly-loan-form");
    const loanSearch = document.getElementById("loan-search");
    const loanTypeFilter = document.getElementById("loan-type-filter");
    const loansTableContainer = document.getElementById("loans-table-container");

    // New Loan Application Modal
    newLoanBtn.addEventListener("click", function () {
        const customerId = prompt("Enter Customer ID:");

        if (!customerId) {
            alert("Please enter a Customer ID to proceed.");
            return;
        }

        checkCustomerHasActiveLoan(customerId)
            .then(hasActiveLoan => {
                if (!hasActiveLoan) {
                    fetchCustomerDetails(customerId);
                } else {
                    alert("This customer currently has an active loan and cannot apply for a new one.");
                }
            })
            .catch(error => {
                console.error("Error checking for active loan:", error);
                alert("Error checking for active loan. Please try again.");
            });
    });

    closeBtn.addEventListener("click", function () {
        loanModal.style.display = "none";
    });

    loanTypeSelect.addEventListener("change", function () {
        if (loanTypeSelect.value === "weekly") {
            weeklyLoanForm.style.display = "block";
            monthlyLoanForm.style.display = "none";
        } else if (loanTypeSelect.value === "monthly") {
            weeklyLoanForm.style.display = "none";
            monthlyLoanForm.style.display = "block";
        } else {
            weeklyLoanForm.style.display = "none";
            monthlyLoanForm.style.display = "none";
        }
    });

    // Helper Functions
    function checkCustomerHasActiveLoan(customerId) {
        return fetch(`/api/customers/${customerId}/loans/active`)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Error checking for customer's active loan");
                }
                return response.json();
            })
            .then(data => {
                return data.hasActiveLoan;
            })
            .catch(error => {
                console.error("Error in checkCustomerHasActiveLoan:", error);
                return Promise.resolve(false);
            });
    }

    function fetchCustomerDetails(customerId) {
        fetch(`/api/customers/${customerId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Error fetching customer details");
                }
                return response.json();
            })
            .then(data => {
                document.getElementById("full-name").value = data.fullName;
                document.getElementById("full-name-monthly").value = data.fullName;
            })
            .catch(error => {
                console.error("Error fetching customer details:", error);
                alert("Error fetching customer details. Please try again.");
            });
    }

    // Form Submission Handling - Weekly
    weeklyLoanForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const customerId = document.getElementById("customer-id").value;
        const fullName = document.getElementById("full-name").value;
        const amount = parseFloat(document.getElementById("amount").value);
        const group = document.getElementById("group").value;
        const interestRate = parseFloat(document.getElementById("interest-rate").value);
        const duration = parseInt(document.getElementById("duration").value);
        const repaymentDate = document.getElementById("repayment-date").value;

        if (!customerId || !fullName || !amount || !group || !interestRate || !duration) {
            alert("Please fill in all required fields.");
            return;
        }

        const totalPayment = amount + (amount * (interestRate / 100));
        const weeklyRepayment = totalPayment / duration;

        fetch('/api/weekly-loans', {
            method: 'POST',
            body: JSON.stringify({
                customerId: customerId,
                fullName: fullName,
                amount: amount,
                group: group,
                interestRate: interestRate,
                duration: duration,
                repaymentDate: repaymentDate,
                totalPayment: totalPayment,
                weeklyRepayment: weeklyRepayment
            }),
            headers: { 'Content-Type': 'application/json' }
        })
            .then(response => response.json())
            .then(data => {
                alert("Weekly loan application submitted successfully!");
                weeklyLoanForm.reset();
                loanModal.style.display = "none";
            })
            .catch(error => {
                console.error('Error:', error);
                alert("Error submitting weekly loan application. Please try again.");
            });
    });

    // Form Submission Handling - Monthly
    monthlyLoanForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const customerIdMonthly = document.getElementById("customer-id-monthly").value;
        const fullNameMonthly = document.getElementById("full-name-monthly").value;
        const amountMonthly = parseFloat(document.getElementById("amount-monthly").value);
        const interestRateMonthly = parseFloat(document.getElementById("interest-rate-monthly").value);
        const durationMonthly = parseInt(document.getElementById("duration-monthly").value);
        const repaymentDateMonthly = document.getElementById("repayment-date-monthly").value;

        if (!customerIdMonthly || !fullNameMonthly || !amountMonthly || !interestRateMonthly || !durationMonthly) {
            alert("Please fill in all required fields for monthly loan.");
            return;
        }

        const totalPaymentMonthly = amountMonthly + (amountMonthly * (interestRateMonthly / 100));
        const monthlyRepayment = totalPaymentMonthly / durationMonthly;

        fetch('/api/monthly-loans', {
            method: 'POST',
            body: JSON.stringify({
                customerId: customerIdMonthly,
                fullName: fullNameMonthly,
                amount: amountMonthly,
                interestRate: interestRateMonthly,
                duration: durationMonthly,
                repaymentDate: repaymentDateMonthly,
                totalPayment: totalPaymentMonthly,
                monthlyRepayment: monthlyRepayment
            }),
            headers: { 'Content-Type': 'application/json' }
        })
            .then(response => response.json())
            .then(data => {
                alert("Monthly loan application submitted successfully!");
                monthlyLoanForm.reset();
                loanModal.style.display = "none";
            })
            .catch(error => {
                console.error('Error:', error);
                alert("Error submitting monthly loan application. Please try again.");
            });
    });

    // Consolidated Loan Table and Filtering
    async function populateLoansTable(loanType = "all", searchQuery = "") {
        try {
            let response;
            if (loanType === "weekly") {
                response = await fetch('/api/weekly-loans');
            } else if (loanType === "monthly") {
                response = await fetch('/api/monthly-loans');
            } else {
                response = await fetch('/api/loans');
            }

            if (!response.ok) {
                throw new Error("Failed to fetch loans");
            }

            const loans = await response.json();
            const tableBody = document.querySelector("#loans-table tbody");
            tableBody.innerHTML = "";

            const filteredLoans = loans.filter(loan => {
                if (loanType === "weekly" && !loan.weeklyInstallment) return false;
                if (loanType === "monthly" && !loan.monthlyInstallment) return false;
                if (searchQuery && !loan.fullName.toLowerCase().includes(searchQuery.toLowerCase()) && !loan.id.toString().includes(searchQuery)) return false;
                return true;
            });

            filteredLoans.forEach(loan => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${loan.id}</td>
                    <td>${loan.fullName}</td>
                    <td>${loan.loanAmount}</td>
                    <td>${loan.interest}</td>
                    <td>${loan.duration}</td>
                    <td>${loan.weeklyInstallment || loan.monthlyInstallment}</td>
                    <td>${loan.balance}</td>
                    <td>${loan.group}</td>
                    <td>${loan.status}</td>
                `;
                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error("Error fetching loans:", error);
            alert("Failed to fetch loans. Please try again.");
        }
    }

    // Event listeners for search and loan type filter
    loanSearch.addEventListener("input", () => populateLoansTable(loanTypeFilter.value, loanSearch.value));
    loanTypeFilter.addEventListener("change", () => populateLoansTable(loanTypeFilter.value, loanSearch.value));

    // Initial Data Load
    populateLoansTable();
});
