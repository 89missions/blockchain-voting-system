const express = require('express')
const router = express.Router()
const  {getCandidates,getActiveElections,postVote,getLiveResults}= require('../controllers/voterController')
const allowedRole = require('../middlewares/allowedRole')

router.get('/election', allowedRole('voter'), getActiveElections)
router.get('/candidates/:electionId', allowedRole('voter'), getCandidates)
router.post('/postVote', allowedRole('voter'), postVote)
router.get('/results/:electionId', allowedRole('voter'), getLiveResults)


module.exports = router