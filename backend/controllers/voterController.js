const candidates = require('../models/candidates')
const elections = require('../models/elections')
const positions = require('../models/positions')
const registeredusers = require('../models/registeredusers')
const mongoose = require('mongoose')

const getActiveElections = async(req,res)=>{
    try {
      const activeElections = await elections.find({isActive:true}).select('title description startDate _id')
      return res.json(activeElections)
    } catch (error) {
        console.log(error)
        return res.status(500).json({"message":"internal server error"})
    }
}
const getCandidates = async(req,res)=>{
  try {
    const {electionId} = req.params
    const allPositions = await positions.find({electionId:electionId})
    const allPositionsArray = allPositions.map((position)=>{
     return position._id
    })
    const allCandidates = await candidates.find({positionId:{$in : allPositionsArray}}).select('-voteCount')
    return res.status(200).json({allPositions,allCandidates})
  } catch (error) {
    res.status(500).json({"message":"internal server error"})
  }
}

const postVote = async (req, res) => {
    try {
        const { electionId, positionId, votes } = req.body;

        // Find the voter
        const voter = await registeredusers.findById(req.id);

        if (!voter) {
            return res.status(400).json({
                message: "could not find user"
            });
        }

        // Make sure votes were provided
        if (!Array.isArray(votes) || votes.length === 0) {
            return res.status(400).json({
                message: "no votes provided"
            });
        }

        // Import ethers and blockchain contract
        const { ethers } = await import("ethers");

        const { contractWithSigner } =
            await import("../blockchain/services/electionservice.js");

        // --------------------------------
        // 1. Create voter hash
        // --------------------------------

        const voterHash = ethers.keccak256(
            ethers.toUtf8Bytes(voter.id.toString())
        );

        // --------------------------------
        // 2. Get candidate MongoDB IDs
        // --------------------------------

        const candidateMongoIds = votes.map(
            (vote) => vote.candidateId.toString()
        );

        // --------------------------------
        // 3. Verify candidates and position belong
        //    to this election
        // --------------------------------

        const validCandidates = await candidates.find({
            candidateId: { $in: candidateMongoIds },
            electionId: electionId,
            positionId: positionId
        });
        
        if (validCandidates.length !== candidateMongoIds.length) {
            return res.status(400).json({
                message: "one or more candidates do not belong to this election or position"
            });
        }

        // --------------------------------
        // 4. Hash candidate IDs
        // --------------------------------

        const candidateIds = candidateMongoIds.map(
            (candidateId) =>
                ethers.keccak256(
                    ethers.toUtf8Bytes(candidateId)
                )
        );

        // --------------------------------
        // 5. Send vote to blockchain
        // --------------------------------

        const tx = await contractWithSigner.vote(
            voterHash,
            candidateIds
        );

        // Wait for confirmation
        await tx.wait();

        console.log("Vote recorded on blockchain");
        console.log("Transaction hash:", tx.hash);

        // --------------------------------
        // 6. Respond to voter
        // --------------------------------

        return res.status(200).json({
            message: "successfully voted",
            transactionHash: tx.hash
        });

    } catch (error) {

        console.error("Voting error:", error);

        return res.status(500).json({
            message: "internal server error"
        });
    }
};
module.exports = {getActiveElections,getCandidates,postVote}