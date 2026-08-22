// =========================================================
// API CONFIGURATION
// =========================================================

const API_URL = "http://localhost:3000";


// =========================================================
// AUTH
// =========================================================

export function getToken() {
    return localStorage.getItem("accessToken");
}

export function saveToken(token) {
    localStorage.setItem("accessToken", token);
}

export function logout() {
    localStorage.removeItem("accessToken");
    window.location.href = "signin.html";
}


// =========================================================
// JWT
// =========================================================

export function getUserFromToken() {
    const token = getToken();

    if (!token) {
        return null;
    }

    try {
        const payload = JSON.parse(
            atob(token.split(".")[1])
        );

        return payload.userInfo || payload;

    } catch (error) {
        console.error("Invalid token:", error);
        return null;
    }
}


// =========================================================
// API REQUEST
// =========================================================

export async function api(endpoint, options = {}) {

    const token = getToken();

    const headers = {
        "Content-Type": "application/json",
        ...options.headers
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
        `${API_URL}${endpoint}`,
        {
            ...options,
            headers
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || "Something went wrong."
        );
    }

    return data;
}