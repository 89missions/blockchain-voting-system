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

const postVote = async (req,res)=>{

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

 const session = await mongoose.startSession()

 //find the candidates in the candidates collection..
 session.startTransaction()
 try {
  const update = await candidates.updateMany(
    {_id: {$in : idofcan}}, //get the id for update
    {$inc: {voteCount : 1}}, //function for update
    {session}
  )

  await registeredusers.updateOne({_id:req.id},{$push:{votedArray: electionId}},{session})

  session.commitTransaction()

  res.status(200).json({"message":"successfully voted"})
 } catch (error) {
  session.abortTransaction()
  res.status(500).json({"message":"internal server error"})
 }
 finally{
  session.endSession()
 }
 //increase the vote counts... 
}
module.exports = {getActiveElections,getCandidates,postVote}