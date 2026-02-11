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
    const allPositions = await positions.find({electionId:electionId})
    const allPositionsArray = allPositions.map((position)=>{
     return position._id
    })
    const allCandidates = await candidates.find({positionId:{$in : allPositionsArray}}).select('-voteCount')
    return res.status(200).json({allPositions,allCandidates})
  } catch (error) {
  }
}

const postVote = async (req,res)=>{
  /*running checks 
  1. check if the user has already voted...
  2. check if the postion is from a different election.. it might have been tampered with...
  3. run the whole operation as an atomic property...

  algorithm for the whole project.. the voting part charley..
  when the fronted clicks on the candidate, the electionId,positionid and candidateId is captured..
  when the user clicks on submit ballot button. it sends it to the post vote route..
  [
  
    {
      electionId: electionId,
      positionId: positionId,
      candidateId: candidateId
  },
  {
      electionId: electionId,
      positionId: positionId,
      candidateId: candidateId
  },
  {
      electionId: electionId,
      positionId: positionId,
      candidateId: candidateId
  }
  ]
  sends it all as vote 
  my plan is to get the candidateids and put them in an array,
  then after i will look in the candidates collection and find ids

  this part is where the atomicity starts
  i will then increase the candidat's votecount by 1
  and it ends here..
  */
 const {electionId,positionId,votes} = req.body
 const voter = await registeredusers.findById(req.id) //gets the user..
 if(!voter){
  return res.status(400).json({"message":"could not find user.."})
 }
 const votedArray = voter.votedArray
 const stringifiedVotedArray = votedArray.map(election=>election.toString())

 if(stringifiedVotedArray.includes(req.body.electionId)){
  return res.status(401).json({"message":"you have already voted in this election"})
 }

 const checkPositionAuthenticity = await positions.findOne({electionId:electionId})
 if(!checkPositionAuthenticity){
  res.status(400).json({"message":"position does not belong to this election"})
 }

 //to get the individual candidate, i will map throught the votes array
 const idofcan = votes.map((canId)=>canId.candidateId)

 //find the candidates in the candidates collection..
 //increase the vote counts... 
}
module.exports = {getActiveElections,getCandidates,postVote}