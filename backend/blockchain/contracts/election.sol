// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Election {

    // =========================
    // STATE VARIABLES
    // =========================

    address public admin;

    bool public votingOpen;

    // voterHash => whether the voter has already voted
    mapping(bytes32 => bool) private voted;

    // candidateId => number of votes
    mapping(bytes32 => uint256) private voteCounts;


    // =========================
    // EVENTS
    // =========================

    event ElectionStarted();

    event ElectionEnded();

    event VoteCast(
        bytes32 indexed voterHash,
        bytes32 indexed candidateId
    );


    // =========================
    // CONSTRUCTOR
    // =========================

    constructor() {
        admin = msg.sender;
        votingOpen = false;
    }


    // =========================
    // ACCESS CONTROL
    // =========================

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not authorized");
        _;
    }


    // =========================
    // ADMIN FUNCTIONS
    // =========================

    function startElection() external onlyAdmin {
        require(!votingOpen, "Election already open");

        votingOpen = true;

        emit ElectionStarted();
    }


    function endElection() external onlyAdmin {
        require(votingOpen, "Election is not open");

        votingOpen = false;

        emit ElectionEnded();
    }


    // =========================
    // VOTING
    // =========================

    function vote(
        bytes32 voterHash,
        bytes32[] calldata candidateIds
    ) external {

        require(votingOpen, "Voting is closed");

        require(!voted[voterHash], "Already voted");

        require(candidateIds.length > 0, "No candidates selected");


        // Increase vote count for every selected candidate
        for (uint256 i = 0; i < candidateIds.length; i++) {

            voteCounts[candidateIds[i]]++;

            emit VoteCast(
                voterHash,
                candidateIds[i]
            );
        }


        // Mark voter as having voted
        voted[voterHash] = true;
    }


    // =========================
    // READ FUNCTIONS
    // =========================

    function getVoteCount(
        bytes32 candidateId
    ) external view returns (uint256) {

        return voteCounts[candidateId];
    }


    function hasVoted(
        bytes32 voterHash
    ) external view returns (bool) {

        return voted[voterHash];
    }
}