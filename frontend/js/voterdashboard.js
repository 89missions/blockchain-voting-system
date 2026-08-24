import { api, getToken, logout } from "./config.js";

const token = getToken();

if (!token) window.location.href = "signin.html";

function getUserFromToken() {
    try {
        const payload = JSON.parse(
            atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
        );
        return payload.userInfo || null;
    } catch {
        return null;
    }
}

const user = getUserFromToken();

if (!user) logout();

function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[char]));
}

function formatDate(date) {
    try {
        return new Date(date).toLocaleDateString(undefined, {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    } catch {
        return date;
    }
}

// =========================================================
// STUDENT CARD
// =========================================================

document.getElementById("whoami").textContent = "ID: " + user.id;

document.getElementById("studentCard").innerHTML =
    '<div class="avatar">' + esc(String(user.id).slice(-2)) + '</div>' +
    '<div class="sinfo">' +
        '<h2>Welcome back</h2>' +
        '<div class="meta"><span>ID: ' + esc(user.id) + '</span></div>' +
        '<span class="rolechip">' + esc(user.role) + '</span>' +
    '</div>';

document.getElementById("logoutBtn").addEventListener("click", logout);

// =========================================================
// ELECTION LISTS
// =========================================================

const activeList = document.getElementById("activeList");
const pastList = document.getElementById("pastList");

function electionCard(election) {
    const upcoming = new Date(election.startDate) > new Date();

    const badge = upcoming
        ? '<span class="badge upcoming">Upcoming</span>'
        : '<span class="badge live"><span class="blip"></span>Live</span>';

    const voteButton = upcoming
        ? ""
        : '<button class="btn gold" data-act="vote" data-id="' +
          esc(election._id) +
          '" data-title="' +
          esc(election.title) +
          '">Vote</button>';

    return (
        '<article class="ecard">' +
            '<div class="ecard-strip"></div>' +
            '<div class="ecard-in">' +
                '<div class="ecard-top">' + badge + '</div>' +
                '<h3>' + esc(election.title) + '</h3>' +
                '<p class="edesc">' + esc(election.description || "") + '</p>' +
                '<div class="emeta">Starts ' + formatDate(election.startDate) + '</div>' +
                '<div class="eactions">' +
                    voteButton +
                    '<button class="btn ghost" data-act="results" data-id="' +
                    esc(election._id) +
                    '" data-title="' +
                    esc(election.title) +
                    '">Results</button>' +
                '</div>' +
            '</div>' +
        '</article>'
    );
}

async function loadElections() {
    activeList.innerHTML = '<div class="loading">Loading elections…</div>';

    try {
        const elections = await api("/voter/election");

        if (!Array.isArray(elections) || elections.length === 0) {
            activeList.innerHTML = '<div class="empty">No elections available.</div>';
            pastList.innerHTML = '<div class="empty">No past elections available.</div>';
            return;
        }

        const availableElections = elections.filter(election => {
            const endDate = election.endDate ? new Date(election.endDate) : null;
            return !endDate || endDate >= new Date();
        });

        activeList.innerHTML = availableElections.length
            ? availableElections.map(electionCard).join("")
            : '<div class="empty">No elections available.</div>';

        pastList.innerHTML =
            '<div class="empty">Past elections will appear here once closed elections are available.</div>';
    } catch (error) {
        console.error("Error loading elections:", error);
        activeList.innerHTML = '<div class="empty">Couldn’t load elections.</div>';
    }
}

// =========================================================
// MODAL
// =========================================================

const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const ballotPane = document.getElementById("ballotPane");
const resultsPane = document.getElementById("resultsPane");
const tabBallot = document.getElementById("tabBallot");
const tabResults = document.getElementById("tabResults");

let currentElection = null;
let resultsLoadedFor = null;

document.getElementById("modalClose").addEventListener("click", closeModal);

modal.addEventListener("click", event => {
    if (event.target === modal) closeModal();
});

tabBallot.addEventListener("click", () => switchTab("ballot"));
tabResults.addEventListener("click", () => switchTab("results"));

document.addEventListener("click", event => {
    const button = event.target.closest("[data-act]");
    if (!button) return;

    openElection(
        button.getAttribute("data-id"),
        button.getAttribute("data-title"),
        button.getAttribute("data-act")
    );
});

function switchTab(tab) {
    const showingBallot = tab === "ballot";

    tabBallot.classList.toggle("active", showingBallot);
    tabResults.classList.toggle("active", !showingBallot);

    ballotPane.hidden = !showingBallot;
    resultsPane.hidden = showingBallot;

    if (!showingBallot) loadResults();
}

function openElection(id, title, action) {
    currentElection = id;
    resultsLoadedFor = null;
    modalTitle.textContent = title;

    ballotPane.innerHTML = '<div class="loading">Loading ballot…</div>';
    resultsPane.innerHTML = "";
    modal.hidden = false;
    document.body.style.overflow = "hidden";

    loadCandidates(id);
    switchTab(action === "results" ? "results" : "ballot");
}

function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    currentElection = null;
    resultsLoadedFor = null;
}

// =========================================================
// LOAD CANDIDATES
// =========================================================

async function loadCandidates(id) {
    const alreadyVoted = localStorage.getItem("voted_" + id) === "1";

    try {
        const data = await api("/voter/candidates/" + id);
        const positions = data.allPositions || [];
        const candidates = data.allCandidates || [];

        positions.sort((a, b) => (a.order || 0) - (b.order || 0));

        if (positions.length === 0) {
            ballotPane.innerHTML =
                '<div class="empty">No positions or candidates have been set up for this election yet.</div>';
            return;
        }

        let html = "";

        if (alreadyVoted) {
            html +=
                '<div class="voted-note">' +
                '&#10003; You have already voted in this election' +
                '</div>';
        }

        positions.forEach(position => {
            const positionCandidates = candidates.filter(candidate =>
                String(candidate.positionId) === String(position._id)
            );

            html +=
                '<div class="position-block">' +
                '<h4>' + esc(position.name) + '</h4>';

            if (positionCandidates.length === 0) {
                html +=
                    '<p class="cand-info cb">No candidates for this position.</p>';
            }

            positionCandidates.forEach(candidate => {
                const photo = candidate.photo
                    ? '<img class="cand-photo" src="' +
                      esc(candidate.photo) +
                      '" alt="">'
                    : '<div class="cand-photo">' +
                      esc(String(candidate.name || "?").charAt(0)) +
                      '</div>';

                html +=
                    '<label class="cand-option">' +
                    '<input type="radio" name="pos_' +
                    esc(position._id) +
                    '" value="' +
                    esc(candidate.candidateId) +
                    '"' +
                    (alreadyVoted ? " disabled" : "") +
                    '>' +
                    photo +
                    '<div class="cand-info">' +
                    '<div class="cn">' + esc(candidate.name) + '</div>' +
                    (candidate.bio
                        ? '<div class="cb">' + esc(candidate.bio) + '</div>'
                        : "") +
                    '</div>' +
                    '</label>';
            });

            html += '</div>';
        });

        if (!alreadyVoted) {
            html +=
                '<div class="vote-actions">' +
                '<button class="btn gold full" id="submitVote">' +
                'Submit my vote' +
                '</button>' +
                '</div>';
        }

        ballotPane.innerHTML = html;

        ballotPane
            .querySelectorAll('input[type="radio"]')
            .forEach(radio => {
                radio.addEventListener("change", () => {
                    ballotPane
                        .querySelectorAll('input[name="' + radio.name + '"]')
                        .forEach(input => {
                            input.closest(".cand-option").classList.remove("selected");
                        });

                    radio.closest(".cand-option").classList.add("selected");
                });
            });

        const submit = document.getElementById("submitVote");

        if (submit) {
            submit.addEventListener("click", () => {
                submitVote(id, positions);
            });
        }
    } catch (error) {
        console.error("Error loading ballot:", error);

        ballotPane.innerHTML =
            '<div class="empty">Couldn’t load the ballot.</div>';
    }
}

// =========================================================
// SUBMIT VOTE
// =========================================================

async function submitVote(electionId, positions) {
    const selections = [];

    positions.forEach(position => {
        const checked = ballotPane.querySelector(
            'input[name="pos_' + position._id + '"]:checked'
        );

        if (checked) {
            selections.push({
                positionId: position._id,
                candidateId: checked.value
            });
        }
    });

    if (selections.length === 0) {
        const note = document.createElement("div");
        note.className = "error-note";
        note.textContent = "Please select a candidate before submitting.";
        ballotPane.prepend(note);
        return;
    }

    const submit = document.getElementById("submitVote");

    submit.disabled = true;
    submit.textContent = "Submitting to the blockchain…";

    try {
        const data = await api("/voter/postVote", {
            method: "POST",
            body: JSON.stringify({
                electionId,
                votes: selections
            })
        });

        localStorage.setItem("voted_" + electionId, "1");

        showReceipt(data.transactionHash);
    } catch (error) {
        console.error("Vote submission error:", error);

        submit.disabled = false;
        submit.textContent = "Submit my vote";

        const note = document.createElement("div");
        note.className = "error-note";
        note.textContent = "Could not submit: " + error.message;
        ballotPane.prepend(note);
    }
}

// =========================================================
// RECEIPT
// =========================================================

function showReceipt(hash) {
    ballotPane.innerHTML =
        '<div class="receipt-box">' +
        '<div class="rok">' +
        '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M20 6L9 17l-5-5"/>' +
        '</svg>' +
        '</div>' +
        '<h4>Vote recorded!</h4>' +
        '<p>Your vote is on the blockchain and can\'t be changed. Keep your transaction reference:</p>' +
        (hash
            ? '<div class="tx">' + esc(hash) + '</div>'
            : '<p class="cand-info cb">No transaction hash was returned.</p>') +
        '</div>';
}

// =========================================================
// RESULTS
// =========================================================

async function loadResults() {
    const id = currentElection;

    if (!id || resultsLoadedFor === id) return;

    resultsPane.innerHTML = '<div class="loading">Loading results…</div>';

    try {
        const stats = await api("/voter/results/" + id);

        if (!Array.isArray(stats) || stats.length === 0) {
            resultsPane.innerHTML =
                '<div class="empty">No results to show yet.</div>';
            return;
        }

        resultsLoadedFor = id;

        resultsPane.innerHTML = stats.map(position => {
            const counts = (position.candidates || []).map(
                candidate => candidate.voteCount || 0
            );

            const max = counts.length ? Math.max(...counts) : 0;

            const rows = (position.candidates || [])
                .map(candidate => {
                    const votes = candidate.voteCount || 0;

                    const percentage = position.totalVotes > 0
                        ? Math.round(votes / position.totalVotes * 100)
                        : 0;

                    const leader = votes === max && max > 0;

                    return (
                        '<div class="rcand' +
                        (leader ? " leader" : "") +
                        '">' +
                        '<div class="rc-top">' +
                        '<span class="rc-name">' +
                        esc(candidate.name) +
                        (leader
                            ? ' <span class="win">Leading</span>'
                            : "") +
                        '</span>' +
                        '<span class="rc-votes">' +
                        votes +
                        ' (' +
                        percentage +
                        '%)' +
                        '</span>' +
                        '</div>' +
                        '<div class="rbar">' +
                        '<span style="width:' +
                        percentage +
                        '%"></span>' +
                        '</div>' +
                        '</div>'
                    );
                })
                .join("");

            return (
                '<div class="result-position">' +
                '<div class="rp-head">' +
                '<h4>' + esc(position.positionName) + '</h4>' +
                '<span class="tot">' +
                (position.totalVotes || 0) +
                ' vote' +
                (position.totalVotes === 1 ? "" : "s") +
                '</span>' +
                '</div>' +
                rows +
                '</div>'
            );
        }).join("");
    } catch (error) {
        console.error("Error loading results:", error);

        resultsPane.innerHTML =
            '<div class="empty">Couldn’t load results.</div>';
    }
}

loadElections();