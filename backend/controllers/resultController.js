const candidates = require('../models/candidates')
const positions = require('../models/positions')

const getLiveResults = async (req, res) => {
    try {
      const { electionId } = req.params;
  
      // 1. Fetch all positions belonging to this election
      const allPositions = await positions.find({ electionId });
      
      if (!allPositions || allPositions.length === 0) {
        return res.status(404).json({ "message": "No positions found for this election." });
      }
  
      // 2. Extract Position IDs to find related candidates
      const allPositionsArray = allPositions.map(pos => pos._id);
  
      // 3. Fetch candidates and sort by voteCount (descending)
      const allCandidates = await candidates.find({ 
        positionId: { $in: allPositionsArray } 
      }).sort({ voteCount: -1 });
  
      // 4.Calculate total votes per position 
      const stats = allPositions.map(pos => {
        const posCandidates = allCandidates.filter(c => 
          c.positionId.toString() === pos._id.toString() 
        );
        
        const totalVotesForPosition = posCandidates.reduce((sum, c) => sum + c.voteCount, 0);
  
        return {
          positionName: pos.name,
          positionId: pos._id,
          totalVotes: totalVotesForPosition,
          candidates: posCandidates
        };
      });
  
      return res.status(200).json(stats);
  
    } catch (error) {
      console.error(error);
      return res.status(500).json({ "message": "Internal server error while fetching results" });
    }
  };

  module.exports  = getLiveResults