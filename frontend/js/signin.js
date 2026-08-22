import {
    api,
    saveToken,
    getUserFromToken
} from "./config.js";

const form = document.getElementById("signinForm");
const msg = document.getElementById("msg");

form.addEventListener("submit", async function (e) {

    e.preventDefault();

    const id = parseInt(
        form.studentid.value.trim(),
        10
    );

    const password = form.password.value;

    if (!id || !password) {
        msg.textContent =
            "Please enter your student number and password.";
        return;
    }

    try {

        const data = await api("/login", {
            method: "POST",

            body: JSON.stringify({
                id: id,
                password: password
            })
        });

        // Save JWT
        saveToken(data.accessToken);

        // Read role from JWT
        const user = getUserFromToken();

        if (!user || !user.role) {
            msg.textContent =
                "Login failed: user role could not be determined.";
            return;
        }

        msg.textContent =
            data.message || "Login successful.";

        // Redirect based on role
        setTimeout(function () {

            if (user.role === "admin") {
                window.location.href = "admin.html";

            } else if (user.role === "voter") {
                window.location.href = "voterdashboard.html";

            } else {
                msg.textContent =
                    "Login failed: invalid user role.";
            }

        }, 500);

    } catch (error) {

        console.error("Login error:", error);

        msg.textContent =
            error.message || "Login failed.";
    }
});