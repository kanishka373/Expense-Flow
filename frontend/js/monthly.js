
const BASE_URL = "https://expense-flow-58wi.onrender.com";

const CHART_COLORS = [
    "#a99bd6", "#d9829a", "#8fcf9f", "#f0cd7e",
    "#7fb8d9", "#e3a9c9", "#c3b3e8", "#6f6578"
];

if (!localStorage.getItem("token")) {
    window.location.href = "login.html";
}
let currentDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let allTransactions = [];
let dailyChart = null;

document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();
    syncPicker();
    loadTransactions();
});

document.getElementById("prevMonth").addEventListener("click", () => {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    syncPicker();
    render();
});

document.getElementById("nextMonth").addEventListener("click", () => {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    syncPicker();
    render();
});

document.getElementById("monthPicker").addEventListener("change", (e) => {
    if (!e.target.value) return;
    const [year, month] = e.target.value.split("-");
    currentDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    render();
});

function syncPicker() {
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    document.getElementById("monthPicker").value = `${currentDate.getFullYear()}-${month}`;
}

async function loadTransactions() {
    try {
        const response = await fetch(`${BASE_URL}/api/transactions`, {
            headers: { Authorization: "Bearer " + localStorage.getItem("token") }
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.message, "error");
            return;
        }

        allTransactions = data.transactions;
        render();

    } catch (error) {
        console.error("Error loading transactions:", error);
        showToast("Unable to load monthly data.", "error");
    }
}

function money(n) {
    const sign = n < 0 ? "-" : "";
    return sign + "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function shortDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function transactionsOfMonth(year, month) {
    return allTransactions.filter(txn => {
        const d = new Date(txn.date);
        return d.getFullYear() === year && d.getMonth() === month;
    });
}

function totals(list) {
    let income = 0;
    let expense = 0;

    list.forEach(txn => {
        const amount = parseFloat(txn.amount);
        if (txn.type === "income") income += amount;
        else expense += amount;
    });

    return { income, expense };
}

function setCompare(elementId, current, previous, goodWhenUp) {
    const el = document.getElementById(elementId);
    el.className = "stat-sub";

    if (previous === 0) {
        el.textContent = current === 0 ? "" : "Last month: ₹0" ;
        return;
    }

    const diff = Math.round(((current - previous) / previous) * 100);

    if (diff === 0) {
        el.textContent ="Same as last month" ;
        return;
    }

    el.textContent = `${diff > 0 ? "↑" : "↓"} ${Math.abs(diff)}% vs last month`;
    const isGood = (diff > 0) === goodWhenUp;
    el.classList.add(isGood ? "down" : "up");
}

function render() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const previous = new Date(year, month - 1, 1);

    const list = transactionsOfMonth(year, month);
    const previousList = transactionsOfMonth(previous.getFullYear(), previous.getMonth());

    const current = totals(list);
    const old = totals(previousList);

    const savings = current.income - current.expense;
    const rate = current.income > 0 ? Math.round((savings / current.income) * 100) : 0;

    document.getElementById("statIncome").textContent = money(current.income);
    document.getElementById("statExpense").textContent = money(current.expense);

    const savingsEl = document.getElementById("statSavings");
    savingsEl.textContent = money(savings);
    savingsEl.className = "stat-value " + (savings >= 0 ? "income" : "expense");

    document.getElementById("statSavingsSub").textContent = "Income minus expense";
    document.getElementById("statRate").textContent = rate + "%";

    setCompare("statIncomeSub", current.income, old.income, true);
    setCompare("statExpenseSub", current.expense, old.expense, false);

    renderDailyChart(list, year, month);
    renderCategoryList(list);
    renderTopExpenses(list);
}

function renderDailyChart(list, year, month) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const data = new Array(daysInMonth).fill(0);

    list.filter(txn => txn.type === "expense").forEach(txn => {
        const day = new Date(txn.date).getDate();
        data[day - 1] += parseFloat(txn.amount);
    });

    const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    if (dailyChart) dailyChart.destroy();

    dailyChart = new Chart(document.getElementById("dailyChart"), {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: "#d9829a",
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: items => "Day " + items[0].label,
                        label: ctx => money(ctx.parsed.y)
                    }
                }
            },
            scales: {
    x: {
        grid: { display: false },
        ticks: { maxRotation: 0, minRotation: 0, autoSkipPadding: 12 }
    },
    y: {
        beginAtZero: true,
        ticks: { callback: value => "₹" + value.toLocaleString("en-IN") }
    }
}
        }
    });
}

function renderCategoryList(list) {
    const container = document.getElementById("categoryList");
    const expenses = list.filter(txn => txn.type === "expense");

    if (expenses.length === 0) {
        container.innerHTML = '<p class="loading-text">No expenses this month.</p>';
        return;
    }

    const byCategory = {};
    expenses.forEach(txn => {
        byCategory[txn.category] = (byCategory[txn.category] || 0) + parseFloat(txn.amount);
    });

    const total = Object.values(byCategory).reduce((sum, value) => sum + value, 0);
    const rows = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

    container.innerHTML = rows.map(([category, amount], index) => {
        const percent = (amount / total) * 100;
        const color = CHART_COLORS[index % CHART_COLORS.length];

        return `
            <div class="breakdown-row">
                <div class="breakdown-top">
                    <div class="breakdown-left">
                        <div class="breakdown-dot" style="background: ${color};"></div>
                        <div class="breakdown-name">${escapeHtml(category)}</div>
                    </div>
                    <div class="breakdown-right">
                        <div class="breakdown-percent">${percent.toFixed(1)}%</div>
                        <div class="breakdown-amount">${money(amount)}</div>
                    </div>
                </div>
                <div class="breakdown-bar-track">
                    <div class="breakdown-bar-fill" style="width: ${percent}%; background: ${color};"></div>
                </div>
            </div>
        `;
    }).join("");
}

function renderTopExpenses(list) {
    const container = document.getElementById("topExpenses");

    const top = list
        .filter(txn => txn.type === "expense")
        .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
        .slice(0, 5);

    if (top.length === 0) {
        container.innerHTML = '<p class="loading-text">No expenses this month.</p>';
        return;
    }

    container.innerHTML = top.map((txn, index) => `
        <div class="top-expense-row">
            <div class="top-expense-rank">${index + 1}</div>
            <div class="top-expense-info">
                <div class="top-expense-name">${escapeHtml(txn.description || txn.category)}</div>
                <div class="top-expense-meta">${escapeHtml(txn.category)} • ${shortDate(txn.date)}</div>
            </div>
            <div class="top-expense-amount">-${money(parseFloat(txn.amount))}</div>
        </div>
    `).join("");
}

const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");

menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
});