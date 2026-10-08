const CATEGORIES = [
    { name: "Food", icon: "utensils" },
    { name: "Travel", icon: "plane" },
    { name: "Shopping", icon: "shopping-bag" },
    { name: "Bills", icon: "receipt" },
    { name: "Medicine", icon: "pill" },
    { name: "Entertainment", icon: "film" },
    { name:"Fuel",icon:"fuel"},
    {name:"Maintenance",icon:"wrench"},
    { name:"Rent", icon:"home"},  
    {name:"Education",icon:"graduation-cap"},
    {name:"Health",icon:"heart-pulse"},
    {name:"Groceries",icon:"shopping-cart"},
    {name:"Savings",icon:"Piggy-bank"},
    { name: "Other", icon: "tag" }
    
];

let currentDate = new Date();
let allTransactions = [];
let categoryBudgets = [];

document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();
    loadEverything();
});

document.getElementById("prevMonth").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    loadEverything();
});

document.getElementById("nextMonth").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    loadEverything();
});

document.getElementById("monthPicker").addEventListener("change", (e) => {
    const [year, month] = e.target.value.split("-");
    currentDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    loadEverything();
});

function getMonthString() {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
}

async function loadEverything() {
    document.getElementById("monthPicker").value = getMonthString();
    await loadTransactionsForMonth();
    await loadCategoryBudgets();
    renderOverallBudget();
}

async function loadTransactionsForMonth() {
    try {
        const response = await fetch("http://localhost:5000/api/transactions", {
            method: "GET",
            headers: { Authorization: "Bearer " + localStorage.getItem("token") }
        });

        const data = await response.json();
        const monthStr = getMonthString();

        allTransactions = data.transactions.filter(txn =>
            txn.type === "expense" && txn.date.startsWith(monthStr)
        );

    } catch (error) {
        console.error("Error loading transactions:", error);
    }
}

async function loadCategoryBudgets() {
    try {
        const response = await fetch(`http://localhost:5000/api/budgets?month=${getMonthString()}`, {
            method: "GET",
            headers: { Authorization: "Bearer " + localStorage.getItem("token") }
        });

        const data = await response.json();
        categoryBudgets = data.budgets || [];
        renderCategoryBudgets();

    } catch (error) {
        console.error("Error loading budgets:", error);
        showToast("Unable to load budgets.", "error");
    }
}

function renderCategoryBudgets() {
    const grid = document.getElementById("budgetGrid");

    grid.innerHTML = CATEGORIES.map(cat => {
        const existing = categoryBudgets.find(b => b.category === cat.name);
        const budgetAmount = existing ? parseFloat(existing.budget_amount) : null;

        const spent = allTransactions
            .filter(txn => txn.category === cat.name)
            .reduce((sum, txn) => sum + parseFloat(txn.amount), 0);

        let barHtml = "";
        let statusText = "No limit set";
        let deleteBtnHtml = "";

        if (budgetAmount) {
            const percent = Math.min((spent / budgetAmount) * 100, 100);
            const percentActual = Math.round((spent / budgetAmount) * 100);
            const remaining = Math.max(budgetAmount - spent, 0);

            let fillClass = "fill-ok";
            if (percent >= 100) fillClass = "fill-over";
            else if (percent >= 80) fillClass = "fill-warn";

            barHtml = `
                <div class="budget-bar-track">
                    <div class="budget-bar-fill ${fillClass}" style="width: ${percent}%;"></div>
                </div>
            `;
            statusText = `₹${spent} spent · ${percentActual}% used · ₹${remaining} left`;

            deleteBtnHtml = `
                <button class="budget-row-delete" onclick="deleteCategoryBudget('${cat.name}')">
                    <i data-lucide="trash-2"></i>
                </button>
            `;
        }

        return `
            <div class="budget-row">
                <div class="budget-row-top">
                    <div class="budget-row-icon">
                        <i data-lucide="${cat.icon}"></i>
                    </div>
                    <div>
                        <div class="budget-row-name">${cat.name}</div>
                        <div class="budget-row-status">${statusText}</div>
                    </div>
                </div>
                ${barHtml}
                <div class="budget-row-controls">
                    <input type="number" placeholder="Set limit" id="input-${cat.name}" value="${budgetAmount || ''}">
                    <button onclick="saveCategoryBudget('${cat.name}')">${budgetAmount ? "Update" : "Set"}</button>
                    ${deleteBtnHtml}
                </div>
            </div>
        `;
    }).join("");

    lucide.createIcons();
}

async function saveCategoryBudget(category) {
    const input = document.getElementById(`input-${category}`);
    const amount = input.value;

    if (!amount || amount <= 0) {
        showToast("Please enter a valid amount.", "error");
        return;
    }

    try {
        const response = await fetch("http://localhost:5000/api/budgets", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify({ category, amount, month: getMonthString() })
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.message, "error");
            return;
        }

        showToast(`Budget set for ${category}!`);
        await loadCategoryBudgets();

    } catch (error) {
        console.error("Save budget error:", error);
        showToast("Unable to save budget.", "error");
    }
}

async function deleteCategoryBudget(category) {
    const confirmed = confirm(`Remove budget for ${category}?`);
    if (!confirmed) return;

    try {
        const response = await fetch(
            `http://localhost:5000/api/budgets/${category}?month=${getMonthString()}`,
            {
                method: "DELETE",
                headers: { Authorization: "Bearer " + localStorage.getItem("token") }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            showToast(data.message, "error");
            return;
        }

        showToast("Budget removed.");
        await loadCategoryBudgets();

    } catch (error) {
        console.error("Delete budget error:", error);
        showToast("Unable to remove budget.", "error");
    }
}

function renderOverallBudget() {
    const overallEntry = categoryBudgets.find(b => b.category === "OVERALL");
    const overallAmount = overallEntry ? parseFloat(overallEntry.budget_amount) : null;

    const totalSpent = allTransactions.reduce((sum, txn) => sum + parseFloat(txn.amount), 0);

    document.getElementById("overallInput").value = overallAmount || "";

    const banner = document.getElementById("exceedBanner");

    if (!overallAmount) {
        document.getElementById("overallAmount").textContent = "Not set";
        document.getElementById("overallSub").textContent = `₹${totalSpent} spent this month`;
        document.getElementById("overallBarFill").style.width = "0%";
        document.getElementById("overallPercent").textContent = "";
        banner.innerHTML = "";
        return;
    }

    const percent = Math.min((totalSpent / overallAmount) * 100, 100);
    const percentActual = Math.round((totalSpent / overallAmount) * 100);
    const remaining = Math.max(overallAmount - totalSpent, 0);

    let fillClass = "fill-ok";
    if (percent >= 100) fillClass = "fill-over";
    else if (percent >= 80) fillClass = "fill-warn";

    document.getElementById("overallAmount").textContent = `₹${overallAmount}`;
    document.getElementById("overallSub").textContent = `₹${totalSpent} spent this month · ₹${remaining} remaining`;
    document.getElementById("overallBarFill").className = `budget-bar-fill ${fillClass}`;
    document.getElementById("overallBarFill").style.width = `${percent}%`;
    document.getElementById("overallPercent").textContent = `${percentActual}% used`;

    if (totalSpent > overallAmount) {
        const over = totalSpent - overallAmount;
            banner.innerHTML = `
    <div class="exceed-banner">
        <i data-lucide="alert-triangle"></i>
        <strong>Budget exceeded — over by ₹${over}</strong>
    </div>
`;
        lucide.createIcons();
    } else {
        banner.innerHTML = "";
    }
}

document.getElementById("saveOverallBtn").addEventListener("click", async () => {
    const amount = document.getElementById("overallInput").value;

    if (!amount || amount <= 0) {
        showToast("Please enter a valid amount.", "error");
        return;
    }

    try {
        const response = await fetch("http://localhost:5000/api/budgets", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify({ category: "OVERALL", amount, month: getMonthString() })
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.message, "error");
            return;
        }

        showToast("Monthly budget saved!");
        await loadCategoryBudgets();
        renderOverallBudget();

    } catch (error) {
        console.error("Save overall budget error:", error);
        showToast("Unable to save budget.", "error");
    }
});

document.getElementById("removeOverallBtn").addEventListener("click", async () => {
    const confirmed = confirm("Remove overall monthly budget?");
    if (!confirmed) return;

    try {
        const response = await fetch(
            `http://localhost:5000/api/budgets/OVERALL?month=${getMonthString()}`,
            {
                method: "DELETE",
                headers: { Authorization: "Bearer " + localStorage.getItem("token") }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            showToast(data.message, "error");
            return;
        }

        showToast("Monthly budget removed.");
        await loadCategoryBudgets();
        renderOverallBudget();

    } catch (error) {
        console.error("Remove overall budget error:", error);
        showToast("Unable to remove budget.", "error");
    }
});