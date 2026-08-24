const candidates = require('../models/candidates')
const elections = require('../models/elections')
const positions = require('../models/positions')
const registeredusers = require('../models/electionparticipants.js')
const mongoose = require('mongoose')
const { ethers } = require('ethers')


const getActiveElections = async (req, res) => {
    try {

        const activeElections = await elections
            .find({ isActive: true })
            .select('title description startDate _id contractAddress')

        return res.json(activeElections)

    } catch (error) {

        console.log(error)

        return res.status(500).json({
            message: "internal server error"
        })
    }
}


const getCandidates = async (req, res) => {
    try {

        const { electionId } = req.params

        const allPositions = await positions.find({
            electionId: electionId
        })

        const allPositionsArray = allPositions.map((position) => {
            return position._id
        })

        const allCandidates = await candidates
            .find({
                positionId: {
                    $in: allPositionsArray
                }
            })
            .select('-voteCount')

        return res.status(200).json({
            allPositions,
            allCandidates
        })

    } catch (error) {

        console.error("Get candidates error:", error)

        return res.status(500).json({
            message: "internal server error"
        })
    }
}


const postVote = async (req, res) => {
    try {
        const { electionId, votes } = req.body;

        const election = await elections.findById(electionId);

        if (!election) {
            return res.status(404).json({
                message: "Election not found"
            });
        }

        if (!election.contractAddress) {
            return res.status(500).json({
                message: "Election has no blockchain contract"
            });
        }

        const voter = await registeredusers.findOne({
            id: req.id
        });

        if (!voter) {
            return res.status(400).json({
                message: "Could not find user"
            });
        }

        if (!Array.isArray(votes) || votes.length === 0) {
            return res.status(400).json({
                message: "No votes provided"
            });
        }

        // Make sure every vote contains a position and candidate
        for (const vote of votes) {
            if (!vote.positionId || !vote.candidateId) {
                return res.status(400).json({
                    message: "Each vote must contain a position and candidate"
                });
            }
        }

        // Prevent selecting more than one candidate for the same position
        const positionIds = votes.map(
            vote => vote.positionId.toString()
        );

        if (new Set(positionIds).size !== positionIds.length) {
            return res.status(400).json({
                message: "Only one candidate can be selected per position"
            });
        }

        const {
            getElectionContract,
            getElectionContractWithSigner
        } = await import(
            "../blockchain/services/electionservice.js"
        );

        // Get the contract belonging to THIS election
        const contract = getElectionContract(
            election.contractAddress
        );

        const contractWithSigner =
            getElectionContractWithSigner(
                election.contractAddress
            );

        const votingOpen = await contract.votingOpen();

        if (!votingOpen) {
            return res.status(400).json({
                message: "Voting is currently closed"
            });
        }

        // Hash voter ID
        const voterHash = ethers.keccak256(
            ethers.toUtf8Bytes(
                voter.id.toString()
            )
        );

        const candidateMongoIds = votes.map(
            vote => vote.candidateId.toString()
        );

        // Prevent duplicate candidate IDs
        if (
            new Set(candidateMongoIds).size !==
            candidateMongoIds.length
        ) {
            return res.status(400).json({
                message: "Duplicate candidates are not allowed"
            });
        }

        // Find all selected candidates
        const validCandidates = await candidates.find({
            candidateId: {
                $in: candidateMongoIds
            },
            electionId: electionId
        });

        // Make sure every selected candidate exists
        if (
            validCandidates.length !==
            candidateMongoIds.length
        ) {
            return res.status(400).json({
                message:
                    "One or more candidates do not belong to this election"
            });
        }

        // Make sure each candidate belongs to the
        // position the voter selected it for
        for (const vote of votes) {
            const candidate = validCandidates.find(
                candidate =>
                    candidate.candidateId.toString() ===
                    vote.candidateId.toString()
            );

            if (!candidate) {
                return res.status(400).json({
                    message: "Invalid candidate selected"
                });
            }

            if (
                candidate.positionId.toString() !==
                vote.positionId.toString()
            ) {
                return res.status(400).json({
                    message:
                        "Candidate does not belong to the selected position"
                });
            }
        }

        // Hash every candidate ID
        const candidateIds = candidateMongoIds.map(
            candidateId =>
                ethers.keccak256(
                    ethers.toUtf8Bytes(candidateId)
                )
        );

        // ONE blockchain transaction for the entire ballot
        const tx = await contractWithSigner.vote(
            voterHash,
            candidateIds
        );

        // Wait for blockchain confirmation
        await tx.wait();

        console.log("Vote recorded on blockchain");
        console.log("Transaction hash:", tx.hash);

        return res.status(200).json({
            message: "Successfully voted",
            transactionHash: tx.hash
        });

    } catch (error) {
        console.error("Voting error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


const getLiveResults = async (req, res) => {

    try {

        const {
            electionId
        } = req.params

        const election = await elections.findById(
            electionId
        )


        if (!election) {

            return res.status(404).json({
                message: "Election not found"
            })
        }


        // Make sure the election has a blockchain contract

        if (!election.contractAddress) {

            return res.status(500).json({
                message: "Election has no blockchain contract"
            })
        }

        const allPositions = await positions.find({
            electionId
        })


        if (
            !allPositions ||
            allPositions.length === 0
        ) {

            return res.status(404).json({
                message:
                    "No positions found for this election."
            })
        }

        const allCandidates = await candidates.find({
            electionId: electionId
        })

        const {
            getElectionContract
        } = await import(
            "../blockchain/services/electionservice.js"
        )


        const contract = getElectionContract(
            election.contractAddress
        )

        const candidateResults = []


        for (const candidate of allCandidates) {
            const candidateHash =
                ethers.keccak256(
                    ethers.toUtf8Bytes(
                        candidate.candidateId.toString()
                    )
                )

            // Get vote count from THIS election's contract

            const voteCount =
                await contract.getVoteCount(
                    candidateHash
                )


            candidateResults.push({

                candidate,

                voteCount: Number(
                    voteCount
                )

            })
        }

        const stats = allPositions.map(
            pos => {

                const posCandidates =
                    candidateResults

                        .filter(
                            item =>
                                item.candidate.positionId
                                    .toString() ===
                                pos._id.toString()
                        )

                        .sort(
                            (a, b) =>
                                b.voteCount -
                                a.voteCount
                        )


                // Total votes for this position

                const totalVotesForPosition =
                    posCandidates.reduce(
                        (sum, item) =>
                            sum + item.voteCount,
                        0
                    )


                return {

                    positionName: pos.name,

                    positionId: pos._id,

                    totalVotes:
                        totalVotesForPosition,

                    candidates:
                        posCandidates.map(
                            item => ({

                                ...item.candidate.toObject(),

                                voteCount:
                                    item.voteCount

                            })
                        )

                }
            }
        )


        return res.status(200).json(
            stats
        )
    } catch (error) {
        console.error(
            "Results error:",
            error
        )
        return res.status(500).json({
            message:
                "Internal server error while fetching results"
        })
    }
}
module.exports = {
    getActiveElections,
    getCandidates,
    postVote,
    getLiveResults
}