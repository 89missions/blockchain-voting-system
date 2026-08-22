import { api, getToken, logout } from "./config.js";


// =========================================================
// CHECK LOGIN
// =========================================================

const token = getToken();

if (!token) {
    window.location.href = "signin.html";
}


// =========================================================
// GET USER FROM TOKEN
// =========================================================

function getUserFromToken() {
    try {
        const payload = JSON.parse(
            atob(
                token.split(".")[1]
                    .replace(/-/g, "+")
                    .replace(/_/g, "/")
            )
        );

        return payload.userInfo || null;

    } catch (error) {
        return null;
    }
}

const user = getUserFromToken();

if (!user) {
    logout();
}


// =========================================================
// HELPERS
// =========================================================

function esc(value) {
    return String(value == null ? "" : value)
        .replace(/[&<>"']/g, function (char) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[char];
        });
}


function formatDate(date) {
    try {
        return new Date(date).toLocaleDateString(
            undefined,
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );
    } catch (error) {
        return date;
    }
}


// =========================================================
// STUDENT CARD
// =========================================================

document.getElementById("whoami").textContent =
    "ID: " + user.id;


document.getElementById("studentCard").innerHTML =
    '<div class="avatar">' +
        esc(String(user.id).slice(-2)) +
    '</div>' +

    '<div class="sinfo">' +
        '<h2>Welcome back</h2>' +

        '<div class="meta">' +
            '<span>ID: ' +
                esc(user.id) +
            '</span>' +
        '</div>' +

        '<span class="rolechip">' +
            esc(user.role) +
        '</span>' +

    '</div>';


document
    .getElementById("logoutBtn")
    .addEventListener("click", logout);


// =========================================================
// ELECTION LISTS
// =========================================================

const activeList =
    document.getElementById("activeList");

const pastList =
    document.getElementById("pastList");


// =========================================================
// ELECTION CARD
// =========================================================

function electionCard(election) {

    const upcoming =
        new Date(election.startDate) > new Date();


    const badge = upcoming

        ? '<span class="badge upcoming">Upcoming</span>'

        : '<span class="badge live">' +
            '<span class="blip"></span>' +
            'Live' +
          '</span>';


    const voteButton = upcoming
        ? ""
        : '<button class="btn gold" ' +
            'data-act="vote" ' +
            'data-id="' + esc(election._id) + '" ' +
            'data-title="' + esc(election.title) + '">' +
            'Vote' +
          '</button>';


    return (

        '<article class="ecard">' +

            '<div class="ecard-strip"></div>' +

            '<div class="ecard-in">' +

                '<div class="ecard-top">' +
                    badge +
                '</div>' +

                '<h3>' +
                    esc(election.title) +
                '</h3>' +

                '<p class="edesc">' +
                    esc(election.description || "") +
                '</p>' +

                '<div class="emeta">' +
                    'Starts ' +
                    formatDate(election.startDate) +
                '</div>' +

                '<div class="eactions">' +

                    voteButton +

                    '<button class="btn ghost" ' +
                        'data-act="results" ' +
                        'data-id="' + esc(election._id) + '" ' +
                        'data-title="' + esc(election.title) + '">' +
                        'Results' +
                    '</button>' +

                '</div>' +

            '</div>' +

        '</article>'
    );
}


// =========================================================
// LOAD ELECTIONS
// =========================================================

async function loadElections() {

    activeList.innerHTML =
        '<div class="loading">Loading elections…</div>';


    try {

        const elections =
            await api("/voter/election");


        // No elections returned
        if (
            !Array.isArray(elections) ||
            elections.length === 0
        ) {

            activeList.innerHTML =
                '<div class="empty">' +
                    'No elections available.' +
                '</div>';

            pastList.innerHTML =
                '<div class="empty">' +
                    'No past elections available.' +
                '</div>';

            return;
        }


        // Only display elections that are active or upcoming
        const availableElections =
            elections.filter(function (election) {

                const endDate =
                    election.endDate
                        ? new Date(election.endDate)
                        : null;

                return !endDate ||
                    endDate >= new Date();

            });


        if (availableElections.length === 0) {

            activeList.innerHTML =
                '<div class="empty">' +
                    'No elections available.' +
                '</div>';

        } else {

            activeList.innerHTML =
                availableElections
                    .map(electionCard)
                    .join("");

        }


        // Past elections
        pastList.innerHTML =
            '<div class="empty">' +
                'Past elections will appear here once closed elections are available.' +
            '</div>';


    } catch (error) {

        console.error(
            "Error loading elections:",
            error
        );


        activeList.innerHTML =
            '<div class="empty">' +
                'Couldn’t load elections.' +
            '</div>';
    }
}


// =========================================================
// MODAL
// =========================================================

const modal =
    document.getElementById("modal");

const modalTitle =
    document.getElementById("modalTitle");

const ballotPane =
    document.getElementById("ballotPane");

const resultsPane =
    document.getElementById("resultsPane");

const tabBallot =
    document.getElementById("tabBallot");

const tabResults =
    document.getElementById("tabResults");


let currentElection = null;
let resultsLoadedFor = null;


// =========================================================
// MODAL EVENTS
// =========================================================

document
    .getElementById("modalClose")
    .addEventListener("click", closeModal);


modal.addEventListener("click", function (event) {

    if (event.target === modal) {
        closeModal();
    }

});


tabBallot.addEventListener(
    "click",
    function () {
        switchTab("ballot");
    }
);


tabResults.addEventListener(
    "click",
    function () {
        switchTab("results");
    }
);


// =========================================================
// ELECTION BUTTONS
// =========================================================

document.addEventListener(
    "click",
    function (event) {

        const button =
            event.target.closest("[data-act]");


        if (!button) {
            return;
        }


        openElection(
            button.getAttribute("data-id"),
            button.getAttribute("data-title"),
            button.getAttribute("data-act")
        );

    }
);


// =========================================================
// SWITCH TAB
// =========================================================

function switchTab(tab) {

    const showingBallot =
        tab === "ballot";


    tabBallot.classList.toggle(
        "active",
        showingBallot
    );

    tabResults.classList.toggle(
        "active",
        !showingBallot
    );


    ballotPane.hidden =
        !showingBallot;

    resultsPane.hidden =
        showingBallot;


    if (!showingBallot) {
        loadResults();
    }
}


// =========================================================
// OPEN ELECTION
// =========================================================

function openElection(
    id,
    title,
    action
) {

    currentElection = id;

    resultsLoadedFor = null;

    modalTitle.textContent = title;

    ballotPane.innerHTML =
        '<div class="loading">' +
            'Loading ballot…' +
        '</div>';

    resultsPane.innerHTML = "";

    modal.hidden = false;

    document.body.style.overflow =
        "hidden";


    loadCandidates(id);


    switchTab(
        action === "results"
            ? "results"
            : "ballot"
    );
}


// =========================================================
// CLOSE MODAL
// =========================================================

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

    const alreadyVoted =
        localStorage.getItem(
            "voted_" + id
        ) === "1";


    try {

        const data =
            await api(
                "/voter/candidates/" + id
            );


        const positions =
            data.allPositions || [];

        const candidates =
            data.allCandidates || [];


        positions.sort(function (a, b) {

            return (
                (a.order || 0) -
                (b.order || 0)
            );

        });


        if (positions.length === 0) {

            ballotPane.innerHTML =
                '<div class="empty">' +
                    'No positions or candidates have been set up for this election yet.' +
                '</div>';

            return;
        }


        let html = "";


        if (alreadyVoted) {

            html +=
                '<div class="voted-note">' +
                    '&#10003; You have already voted in this election (recorded on this device).' +
                '</div>';

        }


        positions.forEach(function (position) {

            const positionCandidates =
                candidates.filter(function (candidate) {

                    return String(
                        candidate.positionId
                    ) === String(
                        position._id
                    );

                });


            html +=
                '<div class="position-block">' +

                    '<h4>' +
                        esc(position.name) +
                    '</h4>';


            if (
                positionCandidates.length === 0
            ) {

                html +=
                    '<p class="cand-info cb">' +
                        'No candidates for this position.' +
                    '</p>';

            }


            positionCandidates.forEach(
                function (candidate) {

                    const photo =
                        candidate.photo

                        ? '<img class="cand-photo" ' +
                            'src="' +
                                esc(candidate.photo) +
                            '" alt="">'

                        : '<div class="cand-photo">' +
                            esc(
                                String(
                                    candidate.name || "?"
                                ).charAt(0)
                            ) +
                          '</div>';


                    html +=
                        '<label class="cand-option">' +

                            '<input ' +
                                'type="radio" ' +
                                'name="pos_' +
                                    esc(position._id) +
                                '" ' +
                                'value="' +
                                    esc(candidate.candidateId) +
                                '"' +
                                (
                                    alreadyVoted
                                        ? " disabled"
                                        : ""
                                ) +
                            '>' +

                            photo +

                            '<div class="cand-info">' +

                                '<div class="cn">' +
                                    esc(candidate.name) +
                                '</div>' +

                                (
                                    candidate.bio

                                    ? '<div class="cb">' +
                                        esc(candidate.bio) +
                                      '</div>'

                                    : ""
                                ) +

                            '</div>' +

                        '</label>';

                }
            );


            html +=
                '</div>';

        });


        if (!alreadyVoted) {

            html +=
                '<div class="vote-actions">' +

                    '<button ' +
                        'class="btn gold full" ' +
                        'id="submitVote">' +
                        'Submit my vote' +
                    '</button>' +

                '</div>';

        }


        ballotPane.innerHTML =
            html;


        // Highlight selected candidate
        ballotPane
            .querySelectorAll(
                'input[type="radio"]'
            )
            .forEach(function (radio) {

                radio.addEventListener(
                    "change",
                    function () {

                        ballotPane
                            .querySelectorAll(
                                'input[name="' +
                                    radio.name +
                                '"]'
                            )
                            .forEach(
                                function (input) {

                                    input
                                        .closest(
                                            ".cand-option"
                                        )
                                        .classList
                                        .remove(
                                            "selected"
                                        );

                                }
                            );


                        radio
                            .closest(".cand-option")
                            .classList
                            .add("selected");

                    }
                );

            });


        const submit =
            document.getElementById(
                "submitVote"
            );


        if (submit) {

            submit.addEventListener(
                "click",
                function () {

                    submitVote(
                        id,
                        positions
                    );

                }
            );

        }


    } catch (error) {

        console.error(
            "Error loading ballot:",
            error
        );


        ballotPane.innerHTML =
            '<div class="empty">' +
                'Couldn’t load the ballot.' +
            '</div>';
    }
}


async function submitVote(
    electionId,
    positions
) {

    const selections = [];


    // Get one candidate per position
    positions.forEach(function (position) {

        const checked =
            ballotPane.querySelector(
                'input[name="pos_' +
                    position._id +
                '"]:checked'
            );


        if (checked) {

            selections.push({
                positionId: position._id,
                candidateId: checked.value
            });

        }

    });


    if (selections.length === 0) {

        const note =
            document.createElement("div");

        note.className =
            "error-note";

        note.textContent =
            "Please select a candidate before submitting.";

        ballotPane.prepend(note);

        return;
    }


    const submit =
        document.getElementById(
            "submitVote"
        );


    submit.disabled = true;

    submit.textContent =
        "Submitting to the blockchain…";


    const transactionHashes = [];


    try {

        // Submit one position at a time
        for (
            const selection of selections
        ) {

            const data =
                await api(
                    "/voter/postVote",
                    {
                        method: "POST",

                        body: JSON.stringify({
                            electionId:
                                electionId,

                            positionId:
                                selection.positionId,

                            votes: [
                                {
                                    candidateId:
                                        selection.candidateId
                                }
                            ]
                        })
                    }
                );


            if (data.transactionHash) {

                transactionHashes.push(
                    data.transactionHash
                );

            }

        }


        localStorage.setItem(
            "voted_" + electionId,
            "1"
        );


        showReceipt(
            transactionHashes
        );


    } catch (error) {

        console.error(
            "Vote submission error:",
            error
        );


        submit.disabled = false;

        submit.textContent =
            "Submit my vote";


        const note =
            document.createElement("div");

        note.className =
            "error-note";

        note.textContent =
            "Could not submit: " +
            error.message;

        ballotPane.prepend(note);
    }
}

function showReceipt(hashes) {

    const list =
        hashes
            .filter(Boolean)
            .map(function (hash) {

                return (
                    '<div class="tx">' +
                        esc(hash) +
                    '</div>'
                );

            })
            .join("");


    ballotPane.innerHTML =

        '<div class="receipt-box">' +

            '<div class="rok">' +

                '<svg viewBox="0 0 24 24" ' +
                    'width="28" height="28" ' +
                    'fill="none" ' +
                    'stroke="currentColor" ' +
                    'stroke-width="2.6" ' +
                    'stroke-linecap="round" ' +
                    'stroke-linejoin="round">' +

                    '<path d="M20 6L9 17l-5-5"/>' +

                '</svg>' +

            '</div>' +

            '<h4>Vote recorded!</h4>' +

            '<p>' +
                'Your vote is on the blockchain and can\'t be changed. ' +
                'Keep your transaction reference' +
                (
                    hashes.length > 1
                        ? "s"
                        : ""
                ) +
                ':' +
            '</p>' +

            (
                list

                    ? list

                    : '<p class="cand-info cb">' +
                        'No transaction hash was returned.' +
                      '</p>'
            ) +

        '</div>';
}

async function loadResults() {

    const id =
        currentElection;


    if (!id) {
        return;
    }


    if (resultsLoadedFor === id) {
        return;
    }


    resultsPane.innerHTML =
        '<div class="loading">' +
            'Loading results…' +
        '</div>';


    try {

        const stats =
            await api(
                "/voter/results/" + id
            );


        if (
            !Array.isArray(stats) ||
            stats.length === 0
        ) {

            resultsPane.innerHTML =
                '<div class="empty">' +
                    'No results to show yet.' +
                '</div>';

            return;
        }


        resultsLoadedFor = id;


        resultsPane.innerHTML =
            stats
                .map(function (position) {

                    const counts =
                        (position.candidates || [])
                            .map(function (candidate) {

                                return candidate.voteCount || 0;

                            });


                    const max =
                        counts.length
                            ? Math.max.apply(
                                null,
                                counts
                            )
                            : 0;


                    const rows =
                        (position.candidates || [])
                            .map(function (candidate) {

                                const votes =
                                    candidate.voteCount || 0;


                                const percentage =
                                    position.totalVotes > 0

                                        ? Math.round(
                                            votes /
                                            position.totalVotes *
                                            100
                                        )

                                        : 0;


                                const leader =
                                    votes === max &&
                                    max > 0;


                                return (

                                    '<div class="rcand' +
                                        (
                                            leader
                                                ? " leader"
                                                : ""
                                        ) +
                                    '">' +

                                        '<div class="rc-top">' +

                                            '<span class="rc-name">' +

                                                esc(
                                                    candidate.name
                                                ) +

                                                (
                                                    leader

                                                        ? ' <span class="win">' +
                                                            'Leading' +
                                                          '</span>'

                                                        : ""
                                                ) +

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

                                '<h4>' +
                                    esc(
                                        position.positionName
                                    ) +
                                '</h4>' +

                                '<span class="tot">' +
                                    (position.totalVotes || 0) +

                                    ' vote' +

                                    (
                                        position.totalVotes === 1
                                            ? ""
                                            : "s"
                                    ) +

                                '</span>' +

                            '</div>' +

                            rows +

                        '</div>'
                    );

                })
                .join("");
    } catch (error) {

        console.error(
            "Error loading results:",
            error
        );

        resultsPane.innerHTML =
            '<div class="empty">' +
                'Couldn’t load results.' +
            '</div>';
    }
}

loadElections();