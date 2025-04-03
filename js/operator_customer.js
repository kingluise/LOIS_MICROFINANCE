document.addEventListener('DOMContentLoaded', () => {
    const addCustomerBtn = document.getElementById('addCustomerBtn');
    const customerFormContainer = document.getElementById('customerFormContainer');
    const customerForm = document.getElementById('customerForm');
    const formSteps = Array.from(customerForm.querySelectorAll('.form-step'));
    const progressBar = document.getElementById('progress');
    let currentStep = 0;

    function showStep(stepIndex) {
        formSteps.forEach((step, index) => {
            step.classList.toggle('hidden', index !== stepIndex);
        });
        progressBar.style.width = `${((stepIndex + 1) / formSteps.length) * 100}%`;
    }

    showStep(0);

    addCustomerBtn.addEventListener('click', () => {
        customerFormContainer.classList.remove('hidden');
    });

    customerFormContainer.addEventListener('click', function(event) {
        if (event.target === customerFormContainer) {
            customerFormContainer.classList.add('hidden');
        }
    });

    function validateCurrentStep() {
        const currentStepElements = formSteps[currentStep].querySelectorAll('input, select, textarea');
        let isValid = true;

        currentStepElements.forEach(element => {
            if (element.hasAttribute('required') && !element.value.trim()) {
                isValid = false;
                element.classList.add('error');
            } else {
                element.classList.remove('error');
            }
        });

        if (!isValid) {
            alert('Please fill in all required fields.');
        }

        return isValid;
    }

    customerForm.querySelectorAll('.next-step').forEach((btn) => {
        btn.addEventListener('click', () => {
            if (validateCurrentStep()) {
                if (currentStep < formSteps.length - 1) {
                    currentStep++;
                    showStep(currentStep);
                }
            }
        });
    });

    customerForm.querySelectorAll('.prev-step').forEach((btn) => {
        btn.addEventListener('click', () => {
            if (currentStep > 0) {
                currentStep--;
                showStep(currentStep);
            }
        });
    });

    const tableBody = document.querySelector('#customer-list tbody');
    let customers = [];
    renderTable();

    const API_BASE_URL = '/api/customers';

    async function renderTable() {
        try {
            const response = await fetch(API_BASE_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            customers = await response.json();
            tableBody.innerHTML = '';
            customers.forEach((customer, index) => {
                const newRow = tableBody.insertRow();
                newRow.insertCell().textContent = index + 1;
                newRow.insertCell().textContent = customer.fullName;
                newRow.insertCell().textContent = customer.phone;
                newRow.insertCell().innerHTML = `
                    <button class="view-btn" data-id="${customer.id}">View</button>
                `;
            });
        } catch (error) {
            console.error('Error fetching customers:', error);
            alert('Failed to fetch customers.');
        }
    }

    tableBody.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        if (e.target.classList.contains('view-btn')) {
            const customer = await getCustomer(id);
            if (customer) {
                viewCustomer(customer);
            }
        }
    });

    const searchBar = document.getElementById('searchBar');
    searchBar.addEventListener('input', async () => {
        const searchTerm = searchBar.value.toLowerCase();
        await searchCustomers(searchTerm);
    });

    async function searchCustomers(searchTerm) {
        try {
            const response = await fetch(`<span class="math-inline">\{API\_BASE\_URL\}?search\=</span>{searchTerm}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            customers = await response.json();
            renderTable();
        } catch (error) {
            console.error('Error searching customers:', error);
            alert('Failed to search customers.');
        }
    }

    customerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(customerForm);
        const customerData = {};

        if (!formData.get('fullName') || !formData.get('phone')) {
            alert('Full Name and Phone are required fields.');
            return;
        }

        formData.forEach((value, key) => {
            customerData[key] = value;
        });

        // Check for duplicates before adding
        if (await isDuplicateCustomer(customerData)) {
            alert('Customer already exists.');
            return;
        }

        if (confirm('Are you sure you want to submit this customer information?')) {
            await addCustomer(customerData);
            renderTable();
            customerForm.reset();
            customerFormContainer.classList.add('hidden');
            currentStep = 0;
            showStep(0);
        }
    });

    async function addCustomer(customerData) {
        try {
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(customerData),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error adding customer:', error);
            alert('Failed to add customer.');
        }
    }

    async function getCustomer(id) {
        try {
            const response = await fetch(`<span class="math-inline">\{API\_BASE\_URL\}/</span>{id}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error getting customer:', error);
            alert('Failed to get customer.');
            return null;
        }
    }

    async function isDuplicateCustomer(customerData) {
        try {
            const response = await fetch(`<span class="math-inline">\{API\_BASE\_URL\}?phone\=</span>{customerData.phone}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const existingCustomers = await response.json();
            return existingCustomers.some(customer => customer.phone === customerData.phone);
        } catch (error) {
            console.error('Error checking for duplicate customers:', error);
            alert('Failed to check for duplicate customers.');
            return false; // Return false to avoid blocking the add in case of error.
        }
    }

    function viewCustomer(customer) {
        const newTab = window.open();
        newTab.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Customer View</title>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
            </head>
            <body>
                <h1>${customer.fullName}</h1>
                <p>Phone: ${customer.phone}</p>
                <p>Email: ${customer.email}</p>
                <p>DOB: ${customer.dob}</p>
                <p>Gender: ${customer.gender}</p>
                <p>Marital Status: ${customer.maritalStatus}</p>
                <p>Employment Status: ${customer.employment_status}</p>
                <p>Income: ${customer.income}</p>
                <p>ID Type: ${customer.idType}</p>
                <p>ID Number: ${customer.idNumber}</p>
                <h3>Guarantor Information</h3>
                <p>Guarantor Name: ${customer.nextKinName || 'N/A'}</p>
                <p>Guarantor Relationship: ${customer.nextKinRelation || 'N/A'}</p>
                <p>Guarantor Phone: ${customer.nextKinPhone || 'N/A'}</p>
                <p>Guarantor Email: ${customer.guarantorEmail || 'N/A'}</p>
                <p>Guarantor ID Type: ${customer.guarantorIdType || 'N/A'}</p>
                <p>Guarantor ID Number: ${customer.guarantorIdNumber || 'N/A'}</p>
                <img src="images/placeholder.png" alt="passport" style="max-width:200px;"><br>
                <img src="images/placeholderID.png" alt="ID" style="max-width:200px;">
                <button id="exportPdfBtn">Export to PDF</button>
                <script>
                    document.getElementById('exportPdfBtn').addEventListener('click', () => {
                        const { jsPDF } = window.jspdf;
                        const pdf = new jsPDF();
                        pdf.text(\`Customer Information: ${customer.fullName}\`, 10, 10);
                        pdf.text(\`Phone: ${customer.phone}\`, 10, 20);
                        pdf.text(\`Email: ${customer.email}\`, 10, 30);
                        pdf.text(\`DOB: ${customer.dob}\`, 10, 40);
                        pdf.text(\`Gender: ${customer.gender}\`, 10, 50);
                        pdf.text(\`Marital Status: ${customer.maritalStatus}\`, 10, 60);
                        pdf.text(\`Employment Status: ${customer.employment_status}\`, 10, 70);
                        pdf.text(\`Income: ${customer.income}\`, 10, 80);
                        pdf.text(\`ID Type: ${customer.idType}\`, 10, 90);
                        pdf.text(\`ID Number: ${customer.idNumber}\`, 10, 100);
                        pdf.text(\`Guarantor Name: ${customer.nextKinName || 'N/A'}\`, 10, 110);
                        pdf.text(\`Guarantor Relationship: ${customer.nextKinRelation || 'N/A'}\`, 10, 120);
                        pdf.text(\`Guarantor Phone: ${customer.nextKinPhone || 'N/A'}\`, 10, 130);
                        pdf.text(\`Guarantor Email: ${customer.guarantorEmail || 'N/A'}\`, 10, 140);
                        pdf.text(\`Guarantor ID Type: ${customer.guarantorIdType || 'N/A'}\`, 10, 150);
                        pdf.text(\`Guarantor ID Number: ${customer.guarantorIdNumber || 'N/A'}\`, 10, 160);
                        pdf.save(\`customer_${customer.fullName}.pdf\`);
                    });
                </script>
            </body>
            </html>
        `);
        newTab.document.close();
    }
});
