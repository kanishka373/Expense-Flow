document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();
    loadUserInfo();
    loadSummary();
    loadTransactions();
});

function loadUserInfo() {
    const userData = localStorage.getItem("user");

    if (!userData) {
        window.location.href = "login.html";
        return;
    }

    const user = JSON.parse(userData);
    document.getElementById("userName").textContent = user.name;
}

async function loadSummary() {
    try {
        const response = await fetch("http://localhost:5000/api/analytics/summary", {
            method: "GET",
            headers: {
                Authorization: "Bearer " + localStorage.getItem("token")
            }
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Failed to load summary:", data.message);
            return;
        }
         document.getElementById("heroBalance").textContent = (data.balance < 0 ? "-₹" + Math.abs(data.balance) : "₹" + data.balance);
        document.getElementById("heroIncome").textContent = "₹" + data.totalIncome;
        document.getElementById("heroExpense").textContent = "₹" + data.totalExpense;

    } catch (error) {
        console.error("Error loading summary:", error);
    }
}

async function loadTransactions() {
    try {
        const response = await fetch("http://localhost:5000/api/transactions", {
            method: "GET",
            headers: {
                Authorization: "Bearer " + localStorage.getItem("token")
            }
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Failed to load transactions:", data.message);
            return;
        }

        renderTransactions(data.transactions);

    } catch (error) {
        console.error("Error loading transactions:", error);
    }
}

const categoryIcons = {
    food: "utensils", travel: "plane", shopping: "shopping-bag", medicine: "pill", bills: "receipt", entertainment: "film", salary: "wallet",
    fuel: "fuel",  rent: "home",  groceries: "shopping-cart",  education: "graduation-cap",  health: "heart-pulse",  subscription: "repeat",
    gift: "gift",  beauty: "sparkles",  books: "book-open",  coffee: "coffee", phone: "smartphone", clothing: "shirt",
    fitness: "dumbbell", taxes: "landmark", loan: "credit-card", savings: "piggy-bank", maintenance: "wrench",  other: "tag"
};
function renderTransactions(transactions) {
    const listContainer = document.getElementById("transactionList");

    if (transactions.length === 0) {
        listContainer.innerHTML = '<p class="loading-text">No transactions yet.</p>';
        return;
    }

    const recent = transactions.slice(0, 5);

    listContainer.innerHTML = recent.map(txn => {
        const iconClass = txn.type === "expense" ? "expense-icon" : "";
        const amountClass = txn.type === "expense" ? "expense" : "income";
        const sign = txn.type === "expense" ? "-" : "+";
        const key = txn.category.toLowerCase();
const iconName = categoryIcons[key] || (txn.type === "expense" ? "arrow-down" : "arrow-up");
        return `
            <div class="transaction-item">
                <div class="transaction-left">
                    <div class="transaction-icon ${iconClass}">
                        <i data-lucide="${iconName}"></i>
                    </div>
                    <div class="transaction-info">
                        <div class="cat">${txn.category}</div>
                        <div class="desc">${txn.description || "No description"}</div>
                    </div>
                </div>
                <div class="transaction-amount ${amountClass}">${sign}₹${txn.amount}</div>
            </div>
        `;
    }).join("");

    lucide.createIcons();
}

document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
});