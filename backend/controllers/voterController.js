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
        const { electionId, votes } = req.body

        // Find election
        const election = await elections.findById(electionId)

        if (!election) {
            return res.status(404).json({
                message: "Election not found"
            })
        }

        // Make sure this election has a blockchain contract
        if (!election.contractAddress) {
            return res.status(500).json({
                message: "Election has no blockchain contract"
            })
        }

        // Find voter
        const voter = await registeredusers.findOne({
            id: req.id
        })

        if (!voter) {
            return res.status(400).json({
                message: "Could not find user"
            })
        }

        // Validate votes
        if (!Array.isArray(votes) || votes.length === 0) {
            return res.status(400).json({
                message: "No votes provided"
            })
        }

        // Make sure every vote contains positionId and candidateId
        const invalidVote = votes.some(
            vote => !vote.positionId || !vote.candidateId
        )

        if (invalidVote) {
            return res.status(400).json({
                message: "Each vote must contain a position and candidate"
            })
        }

        const {
            getElectionContract,
            getElectionContractWithSigner
        } = await import(
            "../blockchain/services/electionservice.js"
        )

        // Get the contract belonging to THIS election
        const contract = getElectionContract(
            election.contractAddress
        )

        const contractWithSigner =
            getElectionContractWithSigner(
                election.contractAddress
            )

        // Check whether blockchain election is open
        const votingOpen = await contract.votingOpen()

        if (!votingOpen) {
            return res.status(400).json({
                message: "Voting is currently closed"
            })
        }

        // Create voter hash
        const voterHash = ethers.keccak256(
            ethers.toUtf8Bytes(
                voter.id.toString()
            )
        )

        // Validate every selected candidate
        for (const vote of votes) {
            const validCandidate = await candidates.findOne({
                candidateId: vote.candidateId,
                electionId: electionId,
                positionId: vote.positionId
            })

            if (!validCandidate) {
                return res.status(400).json({
                    message:
                        "One or more selected candidates do not belong to this election or position"
                })
            }
        }

        // Get candidate IDs
        const candidateMongoIds = votes.map(
            vote => vote.candidateId.toString()
        )

        // Hash candidate IDs for blockchain
        const candidateIds = candidateMongoIds.map(
            candidateId =>
                ethers.keccak256(
                    ethers.toUtf8Bytes(candidateId)
                )
        )

        // Submit ONE blockchain transaction
        const tx = await contractWithSigner.vote(
            voterHash,
            candidateIds
        )

        // Wait for blockchain confirmation
        await tx.wait()

        console.log("Vote recorded on blockchain")
        console.log("Transaction hash:", tx.hash)

        return res.status(200).json({
            message: "Successfully voted",
            transactionHash: tx.hash
        })

    } catch (error) {
        console.error("Voting error:", error)

        if (
            error.reason === "Already voted" ||
            error.shortMessage?.includes("Already voted")
        ) {
            return res.status(409).json({
                message: "You have already voted in this election"
            })
        }

        if (
            error.reason === "Voting is closed" ||
            error.shortMessage?.includes("Voting is closed")
        ) {
            return res.status(400).json({
                message: "Voting is currently closed"
            })
        }

        if (
            error.reason === "No candidates selected" ||
            error.shortMessage?.includes("No candidates selected")
        ) {
            return res.status(400).json({
                message: "No candidates were selected"
            })
        }

        if (
            error.code === "NETWORK_ERROR" ||
            error.code === "SERVER_ERROR"
        ) {
            return res.status(503).json({
                message: "Blockchain service is currently unavailable"
            })
        }

        return res.status(500).json({
            message:
                "An unexpected error occurred while recording your vote"
        })
    }
}

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