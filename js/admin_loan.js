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
    const pendingApprovalsBtn = document.getElementById("pending-approvals-btn");
    const pendingLoansTableContainer = document.getElementById("pending-loans-table-container");
    const pendingLoansTableBody = document.querySelector("#pending-loans-table tbody");
    const loansTableContainer = document.getElementById("loans-table-container");
    const backToLoansBtn = document.getElementById("back-to-loans-btn");

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
                showReviewPopup(data.id, amount, interestRate, duration, weeklyRepayment, repaymentDate);
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
                showReviewPopup(data.id, amountMonthly, interestRateMonthly, durationMonthly, monthlyRepayment, repaymentDateMonthly);
                monthlyLoanForm.reset();
                loanModal.style.display = "none";
            })
            .catch(error => {
                console.error('Error:', error);
                alert("Error submitting monthly loan application. Please try again.");
            });
    });

    // Show Review Popup
    function showReviewPopup(loanId, amount, interestRate, duration, repaymentAmount, repaymentDate) {
        const reviewPopup = document.getElementById("review-popup");
        reviewPopup.style.display = "block";

        document.getElementById("review-loan-id").innerText = loanId;
        document.getElementById("review-amount").innerText = amount.toFixed(2);
        document.getElementById("review-interest-rate").innerText = interestRate.toFixed(2) + "%";
        document.getElementById("review-duration").innerText = duration + (duration > 1 ? " months" : " month");
        document.getElementById("review-repayment-amount").innerText = repaymentAmount.toFixed(2);
        document.getElementById("review-repayment-date").innerText = repaymentDate;

        document.getElementById("export-pdf-btn").onclick = function () {
            exportToPDF(loanId, amount, interestRate, duration, repaymentAmount, repaymentDate);
        };

        document.getElementById("accept-loan-btn").onclick = function () {
            alert("Loan accepted!");
            reviewPopup.style.display = "none";
        };
    }

    // Export to PDF Functionality
    function exportToPDF(loanId, amount, interestRate, duration, repaymentAmount, repaymentDate) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.text("Loan Details", 20, 20);
        doc.text(`Loan ID: ${loanId}`, 20, 30);
        doc.text(`Loan Amount: $${amount.toFixed(2)}`, 20, 40);
        doc.text(`Interest Rate: ${interestRate.toFixed(2)}%`, 20, 50);
        doc.text(`Duration: ${duration} ${duration > 1 ? "months" : "month"}`, 20, 60);
        doc.text(`Repayment Amount: $${repaymentAmount.toFixed(2)}`, 20, 70);
        doc.text(`Repayment Date: ${repaymentDate}`, 20, 80);

        doc.save(`Loan_Details_${loanId}.pdf`);
    }

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
                    <td><button class="view-details-btn" data-loan-id="${loan.id}">View Details</button></td>
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

    // View Details Button Handler
    document.addEventListener('click', function (event) {
        if (event.target.classList.contains('view-details-btn')) {
            const loanId = event.target.dataset.loanId;
            window.location.href = `loan-details.html?id=${loanId}`;
        }
    });

    // Pending Approvals Button Event Listener
    pendingApprovalsBtn.addEventListener("click", function () {
        fetchPendingLoans();
        pendingLoansTableContainer.style.display = "block";
        loansTableContainer.style.display = "none";
    });

    // Function to Fetch Pending Loans
    function fetchPendingLoans() {
        fetch("/api/pending-loans")
            .then((response) => response.json())
            .then((pendingLoans) => {
                displayPendingLoans(pendingLoans);
            })
            .catch((error) => {
                console.error("Error fetching pending loans:", error);
                alert("Failed to fetch pending loans.");
            });
    }

    // Function to Display Pending Loans
    function displayPendingLoans(loans) {
        pendingLoansTableBody.innerHTML = "";

        loans.forEach((loan) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${loan.customerId}</td>
                <td>${loan.fullName}</td>
                <td>${loan.loanAmount}</td>
                <td>${loan.interestRate}</td>
                <td>${loan.loanType}</td>
                <td>${loan.totalPayment}</td>
                <td>${loan.status}</td>
                <td>
                    <select class="status-dropdown" data-loan-id="${loan.id}">
                        <option value="pending" ${loan.status === "pending" ? "selected" : ""}>Pending</option>
                        <option value="approved" ${loan.status === "approved" ? "selected" : ""}>Approved</option>
                        <option value="disbursed" ${loan.status === "disbursed" ? "selected" : ""}>Disbursed</option>
                        <option value="declined" ${loan.status === "declined" ? "selected" : ""}>Declined</option>
                    </select>
                </td>
            `;
            pendingLoansTableBody.appendChild(row);
        });

        const statusDropdowns = document.querySelectorAll(".status-dropdown");
        statusDropdowns.forEach((dropdown) => {
            dropdown.addEventListener("change", function () {
                const loanId = this.dataset.loanId;
                const newStatus = this.value;
                updateLoanStatus(loanId, newStatus);
            });
        });
    }

    // Function to Update Loan Status
    function updateLoanStatus(loanId, newStatus) {
        fetch(`/api/loans/${loanId}/status`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: newStatus }),
        })
            .then((response) => {
                if (response.ok) {
                    fetchPendingLoans();
                    populateLoansTable();
                    if (pendingLoansTableContainer.style.display == 'block'){
                        loansTableContainer.style.display = 'none';
                    }
                } else {
                    console.error("Failed to update loan status");
                    alert("Failed to update loan status.");
                }
            })
            .catch((error) => {
                console.error("Error updating loan status:", error);
                alert("Error updating loan status.");
            });
    }

    // Back to All Loans Button Event Listener
    backToLoansBtn.addEventListener("click", function () {
        pendingLoansTableContainer.style.display = "none";
        loansTableContainer.style.display = "block";
    });

    // Initial Data Load
    populateLoansTable();
});
