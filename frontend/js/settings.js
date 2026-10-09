document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();
    loadUserData();
});

function loadUserData() {
    const userData = localStorage.getItem("user");

    if (!userData) {
        window.location.href = "login.html";
        return;
    }

    const user = JSON.parse(userData);

    document.getElementById("settingsName").textContent = user.name;
    document.getElementById("settingsEmail").textContent = user.email;
    document.getElementById("settingsNameInput").value = user.name;
    document.getElementById("settingsEmailInput").value = user.email;
    document.getElementById("settingsAvatar").textContent = user.name.charAt(0).toUpperCase();
}

document.getElementById("settingsLogoutBtn").addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
});
document.getElementById("saveProfileBtn").addEventListener("click", async () => {
    const name = document.getElementById("settingsNameInput").value.trim();

    if (!name) {
        showToast("Name cannot be empty.", "error");
        return;
    }

    try {
        const response = await fetch("https://expense-flow-58wi.onrender.com/api/auth/name", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify({ name })
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.message, "error");
            return;
        }

        const userData = JSON.parse(localStorage.getItem("user"));
        userData.name = name;
        localStorage.setItem("user", JSON.stringify(userData));

        document.getElementById("settingsName").textContent = name;
        document.getElementById("settingsAvatar").textContent = name.charAt(0).toUpperCase();

        showToast("Name updated!");

    } catch (error) {
        console.error("Save profile error:", error);
        showToast("Unable to update name.", "error");
    }
});
document.getElementById("updatePasswordBtn").addEventListener("click", async () => {
    const currentPassword = document.getElementById("currentPasswordInput").value;
    const newPassword = document.getElementById("newPasswordInput").value;
    const confirmPassword = document.getElementById("confirmPasswordInput").value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        showToast("Please fill all password fields.", "error");
        return;
    }

    if (newPassword.length < 6) {
        showToast("New password must be at least 6 characters.", "error");
        return;
    }

    if (newPassword !== confirmPassword) {
        showToast("New passwords do not match.", "error");
        return;
    }

    try {
        const response = await fetch("https://expense-flow-58wi.onrender.com/api/auth/password", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.message, "error");
            return;
        }

        showToast("Password updated!");
        document.getElementById("currentPasswordInput").value = "";
        document.getElementById("newPasswordInput").value = "";
        document.getElementById("confirmPasswordInput").value = "";

    } catch (error) {
        console.error("Update password error:", error);
        showToast("Unable to update password.", "error");
    }
});
document.getElementById("exportCsvBtn").addEventListener("click", async () => {
    try {
        const response = await fetch("https://expense-flow-58wi.onrender.com/api/export/csv", {
            headers: { Authorization: "Bearer " + localStorage.getItem("token") }
        });

        if (!response.ok) {
            showToast("Unable to export data.", "error");
            return;
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "expenseflow-transactions.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        showToast("Export downloaded!");

    } catch (error) {
        console.error("Export error:", error);
        showToast("Unable to export data.", "error");
    }
});
document.getElementById("clearDataBtn").addEventListener("click", async () => {
    const confirmed = confirm("This will permanently delete all your transactions and budgets. This cannot be undone. Continue?");
    if (!confirmed) return;

    try {
        const response = await fetch("https://expense-flow-58wi.onrender.com/api/clear-data", {
            method: "DELETE",
            headers: { Authorization: "Bearer " + localStorage.getItem("token") }
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.message, "error");
            return;
        }

        showToast("All data cleared.");

    } catch (error) {
        console.error("Clear data error:", error);
        showToast("Unable to clear data.", "error");
    }
});