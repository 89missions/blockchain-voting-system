import { api, getToken, logout } from "./config.js";


// =========================================================
// AUTH
// =========================================================

function parseJwt(token) {
    try {
        const payload = token.split(".")[1];

        return JSON.parse(
            atob(
                payload
                    .replace(/-/g, "+")
                    .replace(/_/g, "/")
            )
        );
    } catch (error) {
        return null;
    }
}


function getCurrentUser() {

    const token = getToken();

    if (!token) {
        window.location.href = "signin.html";
        return null;
    }

    const payload = parseJwt(token);

    if (!payload) {
        logout();
        return null;
    }

    return payload.userInfo || null;
}


const user = getCurrentUser();

if (!user) {
    throw new Error("User not authenticated.");
}

if (user.role !== "admin") {
    window.location.href = "voter.html";
    throw new Error("Admin access required.");
}


// =========================================================
// STATE
// =========================================================

let elections = [];

let currentElection = null;


// =========================================================
// ELEMENTS
// =========================================================

const dashboardSection =
    document.getElementById("dashboardSection");

const electionsSection =
    document.getElementById("electionsSection");

const resultsSection =
    document.getElementById("resultsSection");

const pageTitle =
    document.getElementById("pageTitle");

const dashboardElections =
    document.getElementById("dashboardElections");

const electionsList =
    document.getElementById("electionsList");

const resultsElectionList =
    document.getElementById("resultsElectionList");

const resultsContainer =
    document.getElementById("resultsContainer");

const resultsContent =
    document.getElementById("resultsContent");


// =========================================================
// USER INFORMATION
// =========================================================

const userId =
    user.id || "Admin";

document.getElementById("topUserId").textContent =
    "ID: " + userId;

document.getElementById("sidebarName").textContent =
    "Admin " + userId;

document.getElementById("sidebarAvatar").textContent =
    String(userId).slice(-1);

document.getElementById("topAvatar").textContent =
    String(userId).slice(-1);


// =========================================================
// NAVIGATION
// =========================================================

document.querySelectorAll(".nav-item").forEach(function (button) {

    button.addEventListener("click", function () {

        const section =
            button.dataset.section;

        showSection(section);

    });

});


function showSection(section) {

    document.querySelectorAll(".nav-item").forEach(function (item) {

        item.classList.toggle(
            "active",
            item.dataset.section === section
        );

    });


    dashboardSection.classList.remove("active");
    electionsSection.classList.remove("active");
    resultsSection.classList.remove("active");


    if (section === "dashboard") {

        dashboardSection.classList.add("active");

        pageTitle.textContent = "Dashboard";

    }


    if (section === "elections") {

        electionsSection.classList.add("active");

        pageTitle.textContent = "Elections";

        renderElections();

    }


    if (section === "results") {

        resultsSection.classList.add("active");

        pageTitle.textContent = "Results";

        resultsContainer.classList.add("hidden");

        resultsElectionList.classList.remove("hidden");

        renderResultElectionList();

    }

}


// =========================================================
// MODALS
// =========================================================

function openModal(id) {

    document
        .getElementById(id)
        .classList.remove("hidden");

}


function closeModal(id) {

    document
        .getElementById(id)
        .classList.add("hidden");

}


document.querySelectorAll("[data-close]").forEach(function (button) {

    button.addEventListener("click", function () {

        closeModal(button.dataset.close);

    });

});


document.querySelectorAll(".modal").forEach(function (modal) {

    modal.addEventListener("click", function (event) {

        if (event.target === modal) {

            modal.classList.add("hidden");

        }

    });

});


// =========================================================
// CREATE ELECTION BUTTONS
// =========================================================

document
    .getElementById("createElectionBtn")
    .addEventListener("click", function () {

        openModal("electionModal");

    });


document
    .getElementById("createElectionBtn2")
    .addEventListener("click", function () {

        openModal("electionModal");

    });


document
    .getElementById("viewAllBtn")
    .addEventListener("click", function () {

        showSection("elections");

    });


document
    .getElementById("logoutBtn")
    .addEventListener("click", logout);


// =========================================================
// DATE FORMATTER
// =========================================================

function formatDate(date) {

    if (!date) return "—";

    return new Date(date).toLocaleString(
        undefined,
        {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    );

}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHtml(value) {

    return String(value ?? "").replace(
        /[&<>"']/g,
        function (character) {

            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[character];

        }
    );

}


// =========================================================
// LOAD ELECTIONS
// =========================================================

async function loadElections() {

    dashboardElections.innerHTML =
        '<div class="loading">Loading elections...</div>';

    electionsList.innerHTML =
        '<div class="loading">Loading elections...</div>';

    try {

        const data =
            await api("/admin/election");

        elections =
            Array.isArray(data)
                ? data
                : data.elections || [];

        updateStatistics();

        renderDashboardElections();

        renderElections();

    } catch (error) {

        console.error("Could not load elections:", error);

        dashboardElections.innerHTML =
            '<div class="empty error">Could not load elections.</div>';

        electionsList.innerHTML =
            '<div class="empty error">Could not load elections.</div>';

    }

}


// =========================================================
// STATISTICS
// =========================================================

async function updateStatistics() {

    document.getElementById("electionCount").textContent =
        elections.length;

    let positions = 0;

    let candidates = 0;

    let votes = 0;


    for (const election of elections) {

        try {

            const data =
                await api(
                    "/admin/election/" +
                    election._id
                );

            const electionPositions =
                data.positions || [];

            positions += electionPositions.length;

            electionPositions.forEach(function (position) {

                candidates +=
                    (position.candidates || []).length;

            });


            try {

                const results =
                    await api(
                        "/voter/results/" +
                        election._id
                    );

                results.forEach(function (position) {

                    votes +=
                        Number(position.totalVotes || 0);

                });

            } catch (error) {

                console.warn(
                    "Could not load results for statistics.",
                    error
                );

            }

        } catch (error) {

            console.warn(
                "Could not load election details.",
                error
            );

        }

    }


    document.getElementById("positionCount").textContent =
        positions;

    document.getElementById("candidateCount").textContent =
        candidates;

    document.getElementById("voteCount").textContent =
        votes;

}


// =========================================================
// DASHBOARD ELECTIONS
// =========================================================

function renderDashboardElections() {

    if (elections.length === 0) {

        dashboardElections.innerHTML =
            '<div class="empty">No active elections available.</div>';

        return;

    }


    dashboardElections.innerHTML =
        elections
            .slice(0, 4)
            .map(createElectionCard)
            .join("");

}


// =========================================================
// ELECTION LIST
// =========================================================

function renderElections() {

    if (elections.length === 0) {

        electionsList.innerHTML =
            '<div class="empty">No active elections available.</div>';

        return;

    }


    electionsList.innerHTML =
        elections
            .map(createElectionCard)
            .join("");

}


// =========================================================
// ELECTION CARD
// =========================================================

function createElectionCard(election) {

    return `
        <article class="election-card">

            <span class="status active">
                Active
            </span>

            <h3>
                ${escapeHtml(election.title)}
            </h3>

            <p class="election-description">
                ${escapeHtml(
                    election.description ||
                    "No description provided."
                )}
            </p>


            <div class="election-meta">

                <div class="meta-box">

                    <span>STARTS</span>

                    <strong>
                        ${formatDate(election.startDate)}
                    </strong>

                </div>


                <div class="meta-box">

                    <span>ENDS</span>

                    <strong>
                        ${formatDate(election.endDate)}
                    </strong>

                </div>

            </div>


            <div class="election-actions">

                <button
                    class="card-btn manage-btn"
                    data-action="manage"
                    data-id="${election._id}"
                >
                    Manage
                </button>

                <button
                    class="card-btn result-btn"
                    data-action="results"
                    data-id="${election._id}"
                >
                    Results
                </button>

            </div>

        </article>
    `;

}


// =========================================================
// CARD ACTIONS
// =========================================================

document.addEventListener("click", function (event) {

    const button =
        event.target.closest("[data-action]");

    if (!button) return;


    const electionId =
        button.dataset.id;

    const action =
        button.dataset.action;


    if (action === "manage") {

        openManageElection(electionId);

    }


    if (action === "results") {

        showSection("results");

        openResults(electionId);

    }

});


// =========================================================
// CREATE ELECTION
// =========================================================

document
    .getElementById("electionForm")
    .addEventListener("submit", async function (event) {

        event.preventDefault();


        const message =
            document.getElementById("electionFormMsg");

        const button =
            document.getElementById("saveElectionBtn");


        message.className = "form-message";

        button.disabled = true;

        button.textContent = "Creating...";


        const title =
            document.getElementById("electionTitle").value.trim();

        const description =
            document.getElementById("electionDescription").value.trim();

        const startDate =
            document.getElementById("startDate").value;

        const endDate =
            document.getElementById("endDate").value;


        if (
            !title ||
            !startDate ||
            !endDate
        ) {

            message.textContent =
                "Please complete all required fields.";

            message.className =
                "form-message error";

            button.disabled = false;

            button.textContent =
                "Create Election";

            return;

        }


        if (
            new Date(endDate) <=
            new Date(startDate)
        ) {

            message.textContent =
                "End date must be after the start date.";

            message.className =
                "form-message error";

            button.disabled = false;

            button.textContent =
                "Create Election";

            return;

        }


        try {

            await api(
                "/admin/election",
                {
                    method: "POST",

                    body: JSON.stringify({
                        title,
                        description,
                        startDate,
                        endDate
                    })
                }
            );


            message.textContent =
                "Election created successfully.";

            message.className =
                "form-message success";


            document
                .getElementById("electionForm")
                .reset();


            await loadElections();


            setTimeout(function () {

                closeModal("electionModal");

                message.textContent = "";

            }, 700);


        } catch (error) {

            message.textContent =
                error.message ||
                "Could not create election.";

            message.className =
                "form-message error";

        }


        button.disabled = false;

        button.textContent =
            "Create Election";

    });


// =========================================================
// OPEN MANAGE ELECTION
// =========================================================

async function openManageElection(electionId) {

    openModal("manageModal");


    const content =
        document.getElementById("manageContent");

    content.innerHTML =
        '<div class="loading">Loading election...</div>';


    try {

        const data =
            await api(
                "/admin/election/" +
                electionId
            );


        currentElection =
            data.election;


        document.getElementById("manageTitle").textContent =
            data.election.title;


        renderManageElection(
            data.election,
            data.positions || []
        );


    } catch (error) {

        console.error(error);

        content.innerHTML =
            '<div class="empty error">Could not load election details.</div>';

    }

}


// =========================================================
// RENDER MANAGE ELECTION
// =========================================================

function renderManageElection(election, positions) {

    const content =
        document.getElementById("manageContent");


    let positionsHtml = "";


    if (positions.length === 0) {

        positionsHtml =
            '<div class="empty">No positions have been added yet.</div>';

    } else {

        positionsHtml =
            positions.map(function (position) {

                const candidates =
                    position.candidates || [];


                let candidatesHtml = "";


                if (candidates.length === 0) {

                    candidatesHtml =
                        '<div class="no-candidates">No candidates added to this position.</div>';

                } else {

                    candidatesHtml =
                        candidates.map(function (candidate) {

                            const photo =
                                candidate.photo
                                    ? `<img
                                        class="candidate-photo"
                                        src="${escapeHtml(candidate.photo)}"
                                        alt=""
                                      >`
                                    : `<div class="candidate-photo">
                                        ${escapeHtml(
                                            (candidate.name || "?")
                                                .charAt(0)
                                        )}
                                      </div>`;


                            return `
                                <div class="candidate">

                                    ${photo}

                                    <div class="candidate-info">

                                        <strong>
                                            ${escapeHtml(candidate.name)}
                                        </strong>

                                        <span>
                                            ${escapeHtml(
                                                candidate.bio ||
                                                "No biography provided."
                                            )}
                                        </span>

                                    </div>

                                </div>
                            `;

                        }).join("");

                }


                return `
                    <div class="position">

                        <div class="position-header">

                            <h4>
                                ${escapeHtml(position.name)}
                            </h4>

                            <span class="position-order">
                                Order: ${position.order || 0}
                            </span>

                        </div>

                        <div class="candidates">

                            ${candidatesHtml}

                        </div>

                    </div>
                `;

            }).join("");

    }


    content.innerHTML = `

        <div class="manage-info">

            <p>
                ${escapeHtml(
                    election.description ||
                    "No description provided."
                )}
            </p>


            <div class="manage-info-grid">

                <div class="manage-info-item">

                    <span>START DATE</span>

                    <strong>
                        ${formatDate(election.startDate)}
                    </strong>

                </div>


                <div class="manage-info-item">

                    <span>END DATE</span>

                    <strong>
                        ${formatDate(election.endDate)}
                    </strong>

                </div>


                <div class="manage-info-item">

                    <span>STATUS</span>

                    <strong>
                        ${election.isActive ? "Active" : "Inactive"}
                    </strong>

                </div>

            </div>

        </div>


        <div class="manage-actions">

            <button
                class="primary-btn"
                id="addPositionBtn"
            >
                + Add Position
            </button>


            <button
                class="secondary-btn"
                id="addCandidateBtn"
                ${positions.length === 0 ? "disabled" : ""}
            >
                + Add Candidate
            </button>

        </div>


        <div>

            ${positionsHtml}

        </div>
    `;


    document
        .getElementById("addPositionBtn")
        .addEventListener(
            "click",
            openPositionModal
        );


    document
        .getElementById("addCandidateBtn")
        .addEventListener(
            "click",
            function () {

                if (positions.length === 0) return;

                populateCandidatePositions(positions);

                openModal("candidateModal");

            }
        );

}


// =========================================================
// ADD POSITION
// =========================================================

function openPositionModal() {

    document
        .getElementById("positionForm")
        .reset();


    document.getElementById("positionFormMsg").textContent =
        "";


    openModal("positionModal");

}


document
    .getElementById("positionForm")
    .addEventListener("submit", async function (event) {

        event.preventDefault();


        if (!currentElection) return;


        const name =
            document
                .getElementById("positionName")
                .value
                .trim();


        const order =
            Number(
                document
                    .getElementById("positionOrder")
                    .value
            );


        const message =
            document.getElementById("positionFormMsg");


        if (!name) {

            message.textContent =
                "Enter a position name.";

            message.className =
                "form-message error";

            return;

        }


        try {

            await api(
                "/admin/position",
                {
                    method: "POST",

                    body: JSON.stringify({

                        name,

                        electionId:
                            currentElection._id,

                        order

                    })
                }
            );


            message.textContent =
                "Position added successfully.";

            message.className =
                "form-message success";


            setTimeout(async function () {

                closeModal("positionModal");

                await openManageElection(
                    currentElection._id
                );

            }, 500);


        } catch (error) {

            message.textContent =
                error.message ||
                "Could not add position.";

            message.className =
                "form-message error";

        }

    });


// =========================================================
// POPULATE CANDIDATE POSITIONS
// =========================================================

function populateCandidatePositions(positions) {

    const select =
        document.getElementById(
            "candidatePosition"
        );


    select.innerHTML =
        '<option value="">Select position</option>';


    positions.forEach(function (position) {

        const option =
            document.createElement("option");


        option.value =
            position._id;

        option.textContent =
            position.name;


        select.appendChild(option);

    });

}


// =========================================================
// ADD CANDIDATE
// =========================================================

document
    .getElementById("candidateForm")
    .addEventListener("submit", async function (event) {

        event.preventDefault();


        if (!currentElection) return;


        const name =
            document
                .getElementById("candidateName")
                .value
                .trim();


        const photo =
            document
                .getElementById("candidatePhoto")
                .value
                .trim();


        const bio =
            document
                .getElementById("candidateBio")
                .value
                .trim();


        const positionId =
            document
                .getElementById("candidatePosition")
                .value;


        const message =
            document.getElementById(
                "candidateFormMsg"
            );


        if (!name || !positionId) {

            message.textContent =
                "Candidate name and position are required.";

            message.className =
                "form-message error";

            return;

        }


        try {

            await api(
                "/admin/candidate",
                {
                    method: "POST",

                    body: JSON.stringify({

                        name,

                        photo,

                        bio,

                        positionId,

                        electionId:
                            currentElection._id

                    })
                }
            );


            message.textContent =
                "Candidate added successfully.";

            message.className =
                "form-message success";


            document
                .getElementById("candidateForm")
                .reset();


            setTimeout(async function () {

                closeModal("candidateModal");

                await openManageElection(
                    currentElection._id
                );

            }, 500);


        } catch (error) {

            message.textContent =
                error.message ||
                "Could not add candidate.";

            message.className =
                "form-message error";

        }

    });


// =========================================================
// RESULTS ELECTION LIST
// =========================================================

function renderResultElectionList() {

    if (elections.length === 0) {

        resultsElectionList.innerHTML =
            '<div class="empty">No active elections available.</div>';

        return;

    }


    resultsElectionList.innerHTML =
        elections.map(function (election) {

            return `
                <article class="election-card">

                    <span class="status active">
                        Active
                    </span>

                    <h3>
                        ${escapeHtml(election.title)}
                    </h3>

                    <p class="election-description">
                        ${escapeHtml(
                            election.description ||
                            "No description provided."
                        )}
                    </p>

                    <div class="election-meta">

                        <div class="meta-box">

                            <span>STARTS</span>

                            <strong>
                                ${formatDate(election.startDate)}
                            </strong>

                        </div>

                        <div class="meta-box">

                            <span>ENDS</span>

                            <strong>
                                ${formatDate(election.endDate)}
                            </strong>

                        </div>

                    </div>

                    <div class="election-actions">

                        <button
                            class="card-btn result-btn"
                            data-result-election="${election._id}"
                        >
                            View Results
                        </button>

                    </div>

                </article>
            `;

        }).join("");

}


// =========================================================
// RESULT ELECTION CLICK
// =========================================================

document.addEventListener("click", function (event) {

    const button =
        event.target.closest(
            "[data-result-election]"
        );


    if (!button) return;


    openResults(
        button.dataset.resultElection
    );

});


// =========================================================
// LOAD RESULTS
// =========================================================

async function openResults(electionId) {

    const election =
        elections.find(function (item) {

            return String(item._id) ===
                String(electionId);

        });


    if (!election) return;


    resultsElectionList.classList.add("hidden");

    resultsContainer.classList.remove("hidden");


    document.getElementById("resultsTitle").textContent =
        election.title;


    resultsContent.innerHTML =
        '<div class="loading">Loading live results...</div>';


    try {

        const results =
            await api(
                "/voter/results/" +
                electionId
            );


        renderResults(results);


    } catch (error) {

        console.error(error);

        resultsContent.innerHTML =
            '<div class="empty error">Could not load results.</div>';

    }

}


// =========================================================
// RENDER RESULTS
// =========================================================

function renderResults(results) {

    if (!Array.isArray(results) || results.length === 0) {

        resultsContent.innerHTML =
            '<div class="empty">No results available yet.</div>';

        return;

    }


    resultsContent.innerHTML =
        results.map(function (position) {

            const candidates =
                position.candidates || [];


            const counts =
                candidates.map(function (candidate) {

                    return Number(
                        candidate.voteCount || 0
                    );

                });


            const highest =
                counts.length
                    ? Math.max(...counts)
                    : 0;


            const rows =
                candidates.map(function (candidate) {

                    const votes =
                        Number(
                            candidate.voteCount || 0
                        );


                    const total =
                        Number(
                            position.totalVotes || 0
                        );


                    const percentage =
                        total > 0
                            ? Math.round(
                                votes / total * 100
                            )
                            : 0;


                    const leader =
                        highest > 0 &&
                        votes === highest;


                    return `

                        <div class="result-row">

                            <div class="result-row-top">

                                <span class="result-name">

                                    ${escapeHtml(
                                        candidate.name
                                    )}

                                    ${
                                        leader
                                            ? '<span class="leading">LEADING</span>'
                                            : ""
                                    }

                                </span>


                                <span class="result-votes">

                                    ${votes}
                                    vote${votes === 1 ? "" : "s"}
                                    (${percentage}%)

                                </span>

                            </div>


                            <div class="result-bar">

                                <span
                                    style="width:${percentage}%"
                                ></span>

                            </div>

                        </div>

                    `;

                }).join("");


            return `

                <div class="result-position">

                    <div class="result-position-header">

                        <h3>
                            ${escapeHtml(
                                position.positionName
                            )}
                        </h3>

                        <span class="total-votes">

                            ${position.totalVotes || 0}
                            total vote${
                                position.totalVotes === 1
                                    ? ""
                                    : "s"
                            }

                        </span>

                    </div>


                    ${
                        rows ||
                        '<div class="empty">No candidates.</div>'
                    }

                </div>

            `;

        }).join("");

}


// =========================================================
// BACK TO RESULTS
// =========================================================

document
    .getElementById("backToResultsBtn")
    .addEventListener("click", function () {

        resultsContainer.classList.add("hidden");

        resultsElectionList.classList.remove("hidden");

    });


loadElections();