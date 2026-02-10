const candidates = require('../models/candidates')
const elections = require('../models/elections')
const positions = require('../models/positions')
const registeredusers = require('../models/registeredusers')

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
    const allPositions = await positions.find({electionId:electionId}) //this is to find all the positions right?
    const allPositionsArray = allPositions.map((position)=>{
     return position._id //first step done..
    })
    const allCandidates = await candidates.find({positionId:{$in : allPositionsArray}}).select('-voteCount')//second step done...
    return res.status(200).json({allPositions,allCandidates})
  } catch (error) {
  }
}

const postVote = async (req,res)=>{
  /*first the validations will go on here,
    1.has the voter already voted? will check the votedElectionArray in the voters document to see if it includes the id of the election which is currently being held.....the client is going to send the electionId,positionId,candidateId to know who he voted i will get the votersId from the jwt... 
  */
 const {electionId,positionId,candidateId} = req.body
 const voter = await registeredusers.findById(req.id) //gets the user..
 if(!voter){
  return res.status(400).json({"message":"could not find user.."})
 }
 const votedArray = voter.votedArray
 const stringifiedVotedArray = votedArray.map(election=>election.toString())

 if(stringifiedVotedArray.includes(req.body.electionId)){
  return res.status(401).json({"message":"you have already voted in this election"})
 }
}
module.exports = {getActiveElections,getCandidates,postVote}