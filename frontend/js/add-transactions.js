const urlParams = new URLSearchParams(window.location.search);
const editId = urlParams.get("id");

document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();
    setDefaultDate();

    if (editId) {
        loadTransactionForEdit(editId);
    }
});

function setDefaultDate() {
    const dateInput = document.getElementById("date");
    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;
}

async function loadTransactionForEdit(id) {
    try {
        const response = await fetch("http://localhost:5000/api/transactions", {
            method: "GET",
            headers: {
                Authorization: "Bearer " + localStorage.getItem("token")
            }
        });

        const data = await response.json();
        const txn = data.transactions.find(t => t.id == id);

        if (!txn) {
            showToast("Transaction not found.", "error");
            return;
        }

        document.getElementById("amount").value = txn.amount;
        document.getElementById("description").value = txn.description || "";
        document.getElementById("date").value = txn.date.split("T")[0];
        document.getElementById("paymentMethod").value = txn.payment_method || "Cash";

        const categorySelect = document.getElementById("category");
        const categoryExists = [...categorySelect.options].some(opt => opt.value === txn.category);

        if (categoryExists) {
            categorySelect.value = txn.category;
        } else {
            categorySelect.value = "Other";
            document.getElementById("customCategoryGroup").style.display = "block";
            document.getElementById("customCategory").value = txn.category;
        }

        typeButtons.forEach(btn => btn.classList.remove("active"));
        typeButtons.forEach(btn => {
            if (btn.getAttribute("data-type") === txn.type) {
                btn.classList.add("active");
            }
        });
        selectedType = txn.type;

        document.querySelector(".form-section h1, .topbar h1").textContent = "Edit transaction.";
        document.querySelector(".primary-btn span").textContent = "Update transaction";

    } catch (error) {
        console.error("Error loading transaction:", error);
        showToast("Unable to load transaction.", "error");
    }
}

let selectedType = "expense";

const typeButtons = document.querySelectorAll(".type-btn");

typeButtons.forEach(button => {
    button.addEventListener("click", () => {
        typeButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");
        selectedType = button.getAttribute("data-type");
    });
});

const categorySelect = document.getElementById("category");
const customCategoryGroup = document.getElementById("customCategoryGroup");
const customCategoryInput = document.getElementById("customCategory");

categorySelect.addEventListener("change", () => {
    if (categorySelect.value === "Other") {
        customCategoryGroup.style.display = "block";
        customCategoryInput.required = true;
    } else {
        customCategoryGroup.style.display = "none";
        customCategoryInput.required = false;
        customCategoryInput.value = "";
    }
});

document.getElementById("transactionForm")
    .addEventListener("submit", async event => {
        event.preventDefault();

        const amount = document.getElementById("amount").value;
        const description = document.getElementById("description").value.trim();
        const date = document.getElementById("date").value;
        const paymentMethod = document.getElementById("paymentMethod").value;

        let category = categorySelect.value;

        if (category === "Other") {
            category = customCategoryInput.value.trim();
        }

        if (!amount || amount <= 0) {
            showToast("Please enter a valid amount.", "error");
            return;
        }

        if (category === "") {
            showToast("Please enter a category.", "error");
            return;
        }

        if (date === "") {
            showToast("Please select a date.", "error");
            return;
        }

        const url = editId
            ? `http://localhost:5000/api/transactions/${editId}`
            : "http://localhost:5000/api/transactions";

        const method = editId ? "PUT" : "POST";

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + localStorage.getItem("token")
                },
                body: JSON.stringify({
                    type: selectedType,
                    amount: amount,
                    category: category,
                    description: description,
                    date: date,
                    paymentMethod: paymentMethod
                })
            });

            const data = await response.json();

            if (!response.ok) {
                showToast(data.message, "error");
                return;
            }

            showToast(editId ? "Transaction updated!" : "Transaction added successfully!");
            setTimeout(() => {
                window.location.href = "transactions.html";
            }, 1200);

        } catch (error) {
            console.error("Save transaction error:", error);
            showToast("Unable to connect to the server.", "error");
        }
    });