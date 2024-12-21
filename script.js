// Get references to DOM elements
const addButton = document.getElementById('add-btn'); // Get the button element that will trigger adding a transaction
const list = document.getElementById('list'); // Get the element where the list of transactions will be displayed
const fruitInput = document.getElementById('fruit-name'); // Get the input field for the fruit name
const priceInput = document.getElementById('fruit-price'); // Get the input field for the fruit price
const quantityInput = document.getElementById('fruit-quantity'); // Get the input field for the fruit quantity
const totalDiv = document.getElementById('total-div'); // Get the div that will display the total amount
const placeholderImage = document.getElementById('placeholder-image'); // Get the placeholder image element for empty transactions

// Initialize state variables
let allTransactions = []; // Stores all transactions for the day (persisted in localStorage)
let currentTransactions = []; // Stores the current customer's transactions
let total = 0; // Tracks the total amount for the current customer's transactions
let currentOrderId = 1; // Assign an order ID for each set of transactions

// Load previous transactions from localStorage on page load
const loadTransactions = () => {
    const savedTransactions = JSON.parse(localStorage.getItem('allTransactions')); // Retrieve saved transactions from localStorage
    if (savedTransactions) { // If there are saved transactions
        allTransactions = savedTransactions; // Load them into allTransactions
        // Update the current order ID to be the next available order ID
        currentOrderId = allTransactions.length > 0 ? allTransactions[allTransactions.length - 1].orderId + 1 : 1;
    }
};

// Save the current list of all transactions to localStorage
const saveTransactions = () => {
    localStorage.setItem('allTransactions', JSON.stringify(allTransactions)); // Store the allTransactions array in localStorage as a string
};

// Add a new transaction when the "Add" button is clicked
addButton.addEventListener('click', (e) => {
    e.preventDefault(); // Prevent the form from submitting and reloading the page

    // Get the values from the input fields and process them
    const fruitName = capitalize(fruitInput.value); // Capitalize the first letter of the fruit name
    const fruitPrice = parseFloat(priceInput.value); // Parse the fruit price as a floating-point number
    const fruitQuantity = parseFloat(quantityInput.value); // Parse the quantity as a floating-point number

    // If the price is negative, show an alert and stop processing
    if (fruitPrice < 0) {
        alert("Price cannot be negative!"); // Alert the user if the price is negative
        return; // Exit the function early
    }

    // Proceed if all inputs are valid (non-empty, valid numbers, positive quantities, and prices)
    if (fruitName !== '' && !isNaN(fruitPrice) && !isNaN(fruitQuantity) && fruitPrice >= 0 && fruitQuantity > 0) {
        const totalAmount = fruitPrice * fruitQuantity; // Calculate the total amount for the current item (price * quantity)

        // Check if this fruit already exists in the current transaction list
        const existingTransaction = currentTransactions.find(item => item.itemName === fruitName && item.orderId === currentOrderId);

        if (existingTransaction) { // If the item already exists in the current transactions
            existingTransaction.itemQuantity += fruitQuantity; // Increase the quantity of the existing transaction
            existingTransaction.totalAmount = existingTransaction.itemPrice * existingTransaction.itemQuantity; // Update the total amount
        } else { // If the item is new, create a new transaction
            const transaction = {
                orderId: currentOrderId, // Use the current order ID
                itemName: fruitName, // Store the fruit name
                itemPrice: fruitPrice, // Store the price of the fruit
                itemQuantity: fruitQuantity, // Store the quantity of the fruit
                totalAmount, // Store the calculated total amount for this transaction
                timestamp: new Date().toLocaleString(), // Store the current timestamp as a string
            };

            // Add the new transaction to both the current list and the allTransactions array
            currentTransactions.push(transaction);
            allTransactions.push(transaction);
        }

        total += totalAmount; // Add the total amount of this transaction to the overall total

        // Clear the input fields after adding the transaction
        fruitInput.value = '';
        priceInput.value = '';
        quantityInput.value = '1'; // Reset quantity to 1 after adding the transaction

        saveTransactions(); // Save the updated transactions to localStorage
        renderTransactionHistory(); // Re-render the transaction history on the page
        renderTotal(); // Re-render the total on the page
    }
});

// Function to render the transaction history on the page
const renderTransactionHistory = () => {
    // If there are no transactions, show the placeholder image and return
    if (currentTransactions.length === 0) {
        list.innerHTML = `<img src="your-image.jpg" id="placeholder-image" class="img-fluid mt-3" alt="Welcome"/>`; // Display a placeholder image
        return; // Exit the function if there are no transactions
    }

    // If there are transactions, render them on the page
    list.innerHTML = ''; // Clear the previous list of transactions
    currentTransactions.forEach((transaction, index) => { // Iterate over each transaction in the currentTransactions array
        // Create the HTML for displaying the transaction
        const transactionHtml = `
            <div class="transaction alert">
                <p><strong>Order ID:</strong> ${transaction.orderId}</p>
                <p><strong>Item:</strong> ${transaction.itemName}</p>
                <p><strong>Price:</strong> ${transaction.itemPrice.toFixed(2)}</p>
                <p><strong>Quantity:</strong> <input type="number" value="${transaction.itemQuantity}" min="0" step="0.01" class="quantity-input" data-index="${index}" style="width:70px;"></p>
                <p><strong>Total:</strong> ${transaction.totalAmount.toFixed(2)}</p>
                <button class="remove-btn btn-sm" data-index="${index}">Remove</button>
            </div>
        `;
        // Insert the generated HTML for this transaction into the list container
        list.insertAdjacentHTML('beforeend', transactionHtml);
    });

    // Attach event listeners for quantity input fields to update the quantity and total when changed
    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const idx = parseInt(e.target.dataset.index); // Get the index of the transaction being modified
            const newQuantity = parseFloat(e.target.value); // Get the new quantity value from the input field

            // Validate the new quantity
            if (!isNaN(newQuantity) && newQuantity >= 0) {
                const oldTotal = currentTransactions[idx].totalAmount; // Get the old total amount for the transaction
                currentTransactions[idx].itemQuantity = newQuantity; // Update the quantity
                currentTransactions[idx].totalAmount = currentTransactions[idx].itemPrice * newQuantity; // Recalculate the total amount

                total = total - oldTotal + currentTransactions[idx].totalAmount; // Update the global total
                renderTransactionHistory(); // Re-render the transaction history
                renderTotal(); // Re-render the total
            }
        });
    });

    // Attach event listeners for the remove buttons to allow the user to remove a transaction
    document.querySelectorAll('.remove-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const idx = parseInt(e.target.dataset.index); // Get the index of the transaction to remove

            // Subtract the removed transaction's total amount from the global total
            total -= currentTransactions[idx].totalAmount;
            currentTransactions.splice(idx, 1); // Remove the transaction from the currentTransactions array
            renderTransactionHistory(); // Re-render the transaction history
            renderTotal(); // Re-render the total
            saveTransactions(); // Save the updated list of transactions to localStorage
        });
    });
};

// Function to render the total amount
const renderTotal = () => {
    if (currentTransactions.length === 0) {
        totalDiv.classList.add('d-none'); // Hide the total div if there are no transactions
    } else {
        totalDiv.classList.remove('d-none'); // Show the total div if there are transactions
    }
    totalDiv.innerHTML = `<p>Total: <span>${total.toFixed(2)}</span></p>`; // Display the total amount, formatted to two decimal places
};

// Capitalize the first letter of a string (used for fruit names)
const capitalize = (string) => string.charAt(0).toUpperCase() + string.slice(1);

// Function to print the bill for the current transactions
const printBill = () => {
    if (currentTransactions.length === 0) { // If there are no transactions to print
        alert("No transactions to print!"); // Alert the user that no transactions exist to print
        return; // Exit the function
    }

    const billWindow = window.open('', '_blank'); // Open a new window for the bill
    // Generate and write the HTML for the bill inside the new window
    billWindow.document.write(`
        <html>
            <head>
                <title>Market Billing Receipt</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                    }
                    h1 {
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        text-align: left;
                        padding: 8px;
                    }
                    th {
                        background-color: #f4f4f4;
                    }
                    tfoot td {
                        font-weight: bold;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 20px;
                        font-size: 12px;
                        color: gray;
                    }
                </style>
            </head>
            <body>
                <h1>Market Billing Receipt (Order ID: ${currentOrderId})</h1>
                <table>
                    <thead>
                        <tr>
                            <th>Item Name</th>
                            <th>Price</th>
                            <th>Quantity</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${currentTransactions.map(transaction => `
                            <tr>
                                <td>${transaction.itemName}</td>
                                <td>${transaction.itemPrice.toFixed(2)}</td>
                                <td>${transaction.itemQuantity.toFixed(2)}</td>
                                <td>${transaction.totalAmount.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3">Grand Total</td>
                            <td>${total.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
                <div class="footer">
                    Thank you for shopping with us!<br />
                    Market Name: Your Market Name<br />
                    Date: ${new Date().toLocaleString()}
                </div>
            </body>
        </html>
    `);

    billWindow.document.close(); // Close the document to finish loading
    billWindow.print(); // Trigger the print dialog

    // Reset the total and current transactions after printing the bill
    total = 0;
    currentTransactions = [];
    renderTotal(); // Re-render the total
    renderTransactionHistory(); // Re-render the transaction history (this will show the placeholder image again)
    currentOrderId++; // Increment the order ID for the next set of transactions
};

// Function to view all transactions in a new window
// Function to view all transactions in a new window
const viewAllTransactions = () => {
    const transactionWindow = window.open('', '_blank'); // Open a new window for viewing all transactions
    // Generate and write the HTML for displaying all transactions in the new window
    transactionWindow.document.write(`
        <html>
            <head>
                <title>All Transactions</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                    }
                    h1 {
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        text-align: left;
                        padding: 8px;
                    }
                    th {
                        background-color: #f4f4f4;
                    }
                    .delete-btn {
                        color: red;
                        cursor: pointer;
                        font-weight: bold;
                    }
                </style>
            </head>
            <body>
                <h1>All Transactions</h1>
                <table>
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Item Name</th>
                            <th>Price</th>
                            <th>Quantity</th>
                            <th>Total</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${allTransactions.map((transaction, index) => `
                            <tr>
                                <td>${transaction.orderId}</td>
                                <td>${transaction.itemName}</td>
                                <td>${transaction.itemPrice.toFixed(2)}</td>
                                <td>${transaction.itemQuantity.toFixed(2)}</td>
                                <td>${transaction.totalAmount.toFixed(2)}</td>
                                <td>${transaction.timestamp}</td>
                                <td><span class="delete-btn" data-index="${index}">Delete</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
        </html>
    `);

    transactionWindow.document.close(); // Close the document to finish loading

    // Add event listener for delete buttons
    transactionWindow.document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const idx = parseInt(e.target.dataset.index); // Get the index of the transaction to delete

            // Remove the transaction from the allTransactions array
            allTransactions.splice(idx, 1);

            // Save the updated transactions to localStorage
            saveTransactions();

            // Re-render the transactions in the new window
            viewAllTransactions(); // Re-call the function to reload the transaction list without the deleted entry
        });
    });
};

// Re-create the "View All Transactions" and "Print Bill" buttons and add event listeners outside of the render function
const createTransactionButtons = () => {
    // Create "View All Transactions" button
    const viewAllButton = document.createElement('button');
    viewAllButton.textContent = "View All Transactions"; // Set button text
    viewAllButton.className = "btn btn-secondary mt-3"; // Apply CSS classes to the button
    totalDiv.insertAdjacentElement('afterend', viewAllButton); // Insert the button after the total div
    viewAllButton.addEventListener('click', viewAllTransactions); // Attach event listener to view all transactions when clicked

    // Create "Print Bill" button
    const printButton = document.createElement('button');
    printButton.textContent = "Print Bill"; // Set button text
    printButton.className = "btn btn-warning mt-3 ml-2"; // Apply CSS classes to the button
    viewAllButton.insertAdjacentElement('afterend', printButton); // Insert the button after the "View All Transactions" button
    printButton.addEventListener('click', printBill); // Attach event listener to print the bill when clicked
};

// Call this function once when the page is loaded to add the buttons
createTransactionButtons();
