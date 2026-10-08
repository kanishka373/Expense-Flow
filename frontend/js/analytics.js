const CHART_COLORS = [
    "#a99bd6", "#d9829a", "#8fcf9f", "#f0cd7e", "#7fb8d9", "#e3a9c9", "#c3b3e8", "#6f6578"
];

document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();
    loadAnalytics();
});

async function loadAnalytics() {
    try {
        const [summaryRes, breakdownRes] = await Promise.all([
            fetch("http://localhost:5000/api/analytics/summary", {
                headers: { Authorization: "Bearer " + localStorage.getItem("token") }
            }),
            fetch("http://localhost:5000/api/analytics/breakdown", {
                headers: { Authorization: "Bearer " + localStorage.getItem("token") }
            })
        ]);

        const summaryData = await summaryRes.json();
        const breakdownData = await breakdownRes.json();

        if (!summaryRes.ok || !breakdownRes.ok) {
            showToast("Unable to load analytics.", "error");
            return;
        }

        renderComparisonChart(summaryData);
        renderCategoryChart(breakdownData.breakdown);
        renderBreakdownList(breakdownData.breakdown);
        renderHighestCategory(breakdownData.breakdown);

    } catch (error) {
        console.error("Error loading analytics:", error);
        showToast("Unable to load analytics.", "error");
    }
}
function renderHighestCategory(breakdown){
    const el=document.getElementById("highestCategory");
    if(!breakdown==breakdown===0){
        el.textContent="_";
        return;
    }
    el.textContent=breakdown[0].category;
}
function renderComparisonChart(summary) {
    const ctx = document.getElementById("comparisonChart");

    new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Income", "Expense"],
            datasets: [{
                data: [summary.totalIncome, summary.totalExpense],
                backgroundColor: ["#5fa876", "#d9829a"],
                borderRadius: 10,
                barThickness: 60
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function renderCategoryChart(breakdown) {
    const ctx = document.getElementById("categoryChart");
    const emptyText = document.getElementById("categoryEmptyText");

    if (!breakdown || breakdown.length === 0) {
        ctx.style.display = "none";
        emptyText.style.display = "block";
        return;
    }

    const labels = breakdown.map(item => item.category);
    const amounts = breakdown.map(item => parseFloat(item.total));

    new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: labels,
            datasets: [{
                data: amounts,
                backgroundColor: CHART_COLORS,
                borderWidth: 2,
                borderColor: "#fbf7f1"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: { boxWidth: 10, font: { size: 11 } }
                }
            }
        }
    });
}

function renderBreakdownList(breakdown) {
    const container = document.getElementById("breakdownList");

    if (!breakdown || breakdown.length === 0) {
        container.innerHTML = '<p class="loading-text">No expenses yet.</p>';
        return;
    }

    const total = breakdown.reduce((sum, item) => sum + parseFloat(item.total), 0);

    container.innerHTML = breakdown.map((item, index) => {
        const percent = ((parseFloat(item.total) / total) * 100).toFixed(1);
        const color = CHART_COLORS[index % CHART_COLORS.length];

         return `
            <div class="breakdown-row">
                <div class="breakdown-top">
                    <div class="breakdown-left">
                        <div class="breakdown-dot" style="background: ${color};"></div>
                        <div class="breakdown-name">${item.category}</div>
                    </div>
                    <div class="breakdown-right">
                        <span class="breakdown-percent">${percent}%</span>
                        <span class="breakdown-amount">₹${item.total}</span>
                    </div>
                </div>
                <div class="breakdown-bar-track">
                    <div class="breakdown-bar-fill" style="width: ${percent}%; background: ${color};"></div>
                </div>
            </div>
        `;
    }).join("");
}