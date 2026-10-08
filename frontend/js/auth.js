
const authCard = document.getElementById("authCard");
const showSignupBtn = document.getElementById("showSignup");
const showLoginBtn = document.getElementById("showLogin");

showSignupBtn.addEventListener("click", () => {
    authCard.classList.add("show-signup");
});

showLoginBtn.addEventListener("click", () => {
    authCard.classList.remove("show-signup");
});
document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();

    // 2. Password toggle logic
    const passwordToggles = document.querySelectorAll(".password-toggle");

    passwordToggles.forEach(toggle => {
        toggle.addEventListener("click", () => {
            const targetId = toggle.getAttribute("data-target");
            const input = document.getElementById(targetId);
            
            const eyeOpen = toggle.querySelector(".eye-open");
            const eyeClosed = toggle.querySelector(".eye-closed");

            if (!input) return;

            if (input.type === "password") {
                input.type = "text";
                eyeOpen.style.display = "none";
                eyeClosed.style.display = "inline-block";
            } else {
                input.type = "password";
                eyeOpen.style.display = "inline-block";
                eyeClosed.style.display = "none";
            }
        });
    });
});
document.getElementById("signupForm")
    .addEventListener("submit", async event => {
        event.preventDefault();

        const name = document.getElementById("signupName").value.trim();
        const email =  document.getElementById("signupEmail").value.trim();
        const password = document.getElementById("signupPassword").value;
        if (name === "") {
            alert("Please enter your name");
            return;
        }

        if (email === "") {
            alert("Please enter your email");
            return;
        }

        if (!email.includes("@")) {
            alert("Please enter a valid email");
            return;
        }

        if (password === "") {
            alert("Please enter your password");
            return;
        }

        if (password.length < 6) {
            alert("Password must be at least 6 characters.");
            return;
        }

        try {
            const response = await fetch(
                "http://localhost:5000/api/auth/signup",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name: name,
                        email: email,
                        password: password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                alert(data.message);
                return;
            }

            alert("Account created successfully!");

            signupForm.reset();

            showLogin.click();

        } catch (error) {
            console.error("Signup error:", error);
            alert("Unable to connect to the server.");
        }
    });
  document.getElementById("loginForm")
    .addEventListener("submit", async event => {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        if (email === "") {
            alert("Please enter your email");
            return;
        }

        if (password === "") {
            alert("Please enter your password");
            return;
        }

        try {
            const response = await fetch(
                "http://localhost:5000/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                alert(data.message);
                return;
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            alert("Login successful!");

            window.location.href = "dashboard.html";

        } catch (error) {
            console.error("Login error:", error);
            alert("Unable to connect to the server.");
        }
    });