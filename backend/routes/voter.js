const express = require('express')
const router = express.Router()
const  {getCandidates,getActiveElections,postVote}= require('../controllers/voterController')
const verifyJWT = require('../middlewares/verifyJWT')
const allowedRole = require('../middlewares/allowedRole')

router.use(verifyJWT)

router.get('/election',allowedRole('voter'), getActiveElections)
router.get('/candidates/:id',allowedRole('voter'), getCandidates)
router.post('/postVote',allowedRole('voter'), postVote)

module.exports = router