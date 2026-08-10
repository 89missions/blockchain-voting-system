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
  const { electionId, positionId, votes } = req.body;

  // Validate request
  if (!electionId || !votes || votes.length === 0) {
      return res.status(400).json({
          message: "Incomplete voting information"
      });
  }

  // Find voter
  const voter = await registeredusers.findById(req.id);

  if (!voter) {
      return res.status(404).json({
          message: "User not found"
      });
  }

  // Prevent duplicate voting
  const hasVoted = voter.votedArray
      .map(id => id.toString())
      .includes(electionId);

  if (hasVoted) {
      return res.status(400).json({
          message: "You have already voted in this election"
      });
  }

  // Check election exists
  const election = await elections.findById(electionId);

  if (!election) {
      return res.status(404).json({
          message: "Election not found"
      });
  }

  // Verify submitted candidates belong to this election
  const candidateIds = votes.map(v => v.candidateId);

  const validCandidates = await candidates.find({
      _id: { $in: candidateIds },
      electionId
  });

  if (validCandidates.length !== candidateIds.length) {
      return res.status(400).json({
          message: "One or more selected candidates are invalid"
      });
  }

  // Blockchain integration will be inserted here

  const session = await mongoose.startSession();

  try {

      session.startTransaction();

      await registeredusers.updateOne(
          { _id: req.id },
          {
              $push: {
                  votedArray: electionId
              }
          },
          { session }
      );

      await session.commitTransaction();

      return res.status(200).json({
          message: "Successfully voted"
      });

  } catch (err) {

      await session.abortTransaction();

      return res.status(500).json({
          message: "Internal server error"
      });

  } finally {

      session.endSession();

  }
};
module.exports = {getActiveElections,getCandidates,postVote}