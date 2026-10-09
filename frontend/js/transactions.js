let allTransactions = [];

document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();
    loadTransactions();
});

async function loadTransactions() {
    try {
        const response = await fetch("https://expense-flow-58wi.onrender.com/api/transactions", {
            method: "GET",
            headers: {
                Authorization: "Bearer " + localStorage.getItem("token")
            }
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.message, "error");
            return;
        }

        allTransactions = data.transactions;
        populateCategoryFilter(allTransactions);
        applyFilters();

    } catch (error) {
        console.error("Error loading transactions:", error);
        showToast("Unable to load transactions.", "error");
    }
}

function populateCategoryFilter(transactions) {
    const categorySelect = document.getElementById("filterCategory");
    const categories = [...new Set(transactions.map(txn => txn.category))];

    categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });
}

document.getElementById("filterType").addEventListener("change", applyFilters);
document.getElementById("filterCategory").addEventListener("change", applyFilters);
document.getElementById("searchInput").addEventListener("input", applyFilters);
document.getElementById("sortBy").addEventListener("change", applyFilters);

function applyFilters() {
    const typeValue = document.getElementById("filterType").value;
    const categoryValue = document.getElementById("filterCategory").value;
    const searchValue = document.getElementById("searchInput").value.toLowerCase();
    const sortValue = document.getElementById("sortBy").value;

    let filtered = allTransactions;

    if (typeValue !== "all") {
        filtered = filtered.filter(txn => txn.type === typeValue);
    }

    if (categoryValue !== "all") {
        filtered = filtered.filter(txn => txn.category === categoryValue);
    }

    if (searchValue !== "") {
        filtered = filtered.filter(txn =>
            (txn.description || "").toLowerCase().includes(searchValue) ||
            txn.category.toLowerCase().includes(searchValue)
        );
    }

    filtered = sortTransactions(filtered, sortValue);

    renderTransactions(filtered);
}

function sortTransactions(transactions, sortValue) {
    const sorted = [...transactions];

    if (sortValue === "newest") {
        sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortValue === "oldest") {
        sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortValue === "highest") {
        sorted.sort((a, b) => b.amount - a.amount);
    } else if (sortValue === "lowest") {
        sorted.sort((a, b) => a.amount - b.amount);
    }

    return sorted;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { day: "numeric", month: "short", year: "numeric" };
    return date.toLocaleDateString("en-IN", options);
}

function getCategoryIcon(category) {
    const icons = {
        Food: "utensils", Travel: "plane", Shopping: "shopping-bag", Medicine: "pill", Bills: "receipt", Entertainment: "film", Salary: "wallet", Fuel: "fuel",
        Rent: "home", Groceries: "shopping-cart", Education: "graduation-cap", Health: "heart-pulse", Subscription: "repeat", Gift: "gift",
        Beauty: "sparkles", Books: "book-open", Coffee: "coffee", Phone: "smartphone", Clothing: "shirt", Fitness: "dumbbell", Taxes: "landmark",
        Loan: "credit-card", Savings: "piggy-bank", Maintenance: "wrench"
    };
    return icons[category] || "tag";
}
function getCategoryColor(category) {
    const colors = {
        Food: "#e0a458", Travel: "#5b9bd5", Shopping: "#d9829a", Medicine: "#6fb88a", Health: "#e07a7a",
        Bills: "#a99bd6", Fuel: "#c08552", Rent: "#8a6d9e", Groceries: "#7fb069", Education: "#5ba3b0",
        Entertainment: "#c77dff", Subscription: "#f4a261", Gift: "#e85d75", Beauty: "#dda0dd", Books: "#70a9a1",
        Coffee: "#9c6644", Phone: "#577590", Clothing: "#f28482", Fitness: "#43aa8b", Taxes: "#6d6875", Loan: "#bc6c25",
        Savings: "#4caf7d", Maintenance: "#8d99ae", Salary: "#4caf7d"
    };
    return colors[category] || "#9b9299";
}

function renderTransactions(transactions) {
    const listContainer = document.getElementById("transactionList");

    if (transactions.length === 0) {
        listContainer.innerHTML = '<tr><td colspan="7" class="loading-text">No transactions found.</td></tr>';
        return;
    }

    listContainer.innerHTML = transactions.map(txn => {
        const amountClass = txn.type === "expense" ? "expense" : "income";
        const sign = txn.type === "expense" ? "-" : "+";
        const iconName = getCategoryIcon(txn.category);
        const catColor = getCategoryColor(txn.category);

        const typeClass = txn.type === "expense" ? "type-expense" : "type-income";
        const typeIcon = txn.type === "expense" ? "trending-down" : "trending-up";

        return `
            <tr data-id="${txn.id}">
                <td>${formatDate(txn.date)}</td>
                <td>${txn.description || "No description"}</td>
                <td>
                    <span class="table-cat" style="color:${catColor};">
                        <i data-lucide="${iconName}" style="color:${catColor};"></i>
                        ${txn.category}
                    </span>
                </td>
                <td>${txn.payment_method || "Cash"}</td>
                <td>
                    <span class="type-pill ${typeClass}">
                        <i data-lucide="${typeIcon}"></i>
                        ${txn.type === "expense" ? "Expense" : "Income"}
                    </span>
                </td>
                <td class="align-right">
                    <span class="transaction-amount ${amountClass}">${sign}₹${txn.amount}</span>
                </td>
                <td class="align-right">
                    <div class="transaction-actions">
                        <button class="action-btn" onclick="editTransaction(${txn.id})">
                            <i data-lucide="pencil"></i>
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteTransaction(${txn.id})">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");

    lucide.createIcons();
}
function editTransaction(id) {
    window.location.href = `add-transactions.html?id=${id}`;
}

async function deleteTransaction(id) {
    const confirmed = confirm("Delete this transaction?");
    if (!confirmed) return;

    try {
        const response = await fetch(`https://expense-flow-58wi.onrender.com/api/transactions/${id}`, {
            method: "DELETE",
            headers: {
                Authorization: "Bearer " + localStorage.getItem("token")
            }
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.message, "error");
            return;
        }

        showToast("Transaction deleted.");
        loadTransactions();

    } catch (error) {
        console.error("Delete error:", error);
        showToast("Unable to delete transaction.", "error");
    }
}