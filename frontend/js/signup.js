import { api } from "./config.js";

const form = document.getElementById("signupForm");
const msg = document.getElementById("msg");

form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const id = parseInt(form.id.value.trim(), 10);
    const userName = form.userName.value.trim();
    const password = form.password.value;
    const confirm = form.confirm.value;

    // Validate
    if (!id || !userName) {
        msg.textContent =
            "Please fill in all required fields.";
        return;
    }

    if (password.length < 6) {
        msg.textContent =
            "Password must be at least 6 characters.";
        return;
    }

    if (password !== confirm) {
        msg.textContent =
            "Passwords do not match.";
        return;
    }

    try {
        const data = await api("/register", {
            method: "POST",

            body: JSON.stringify({
                id: id,
                userName: userName,
                password: password
            })
        });

        msg.textContent =
            data.message || "Registration successful.";

        // Clear form
        form.reset();

        // Redirect to signin
        setTimeout(function () {
            window.location.href = "signin.html";
        }, 1000);

    } catch (error) {
        console.error("Registration error:", error);

        msg.textContent =
            error.message || "Registration failed.";
    }
});