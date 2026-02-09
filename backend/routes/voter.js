const express = require('express')
const router = express.Router()
const  {getCandidates,getActiveElections}= require('../controllers/voterController')
const verifyJWT = require('../middlewares/verifyJWT')
const allowedRole = require('../middlewares/allowedRole')

router.use(verifyJWT)

router.get('/election',allowedRole('voter'), getActiveElections)
module.exports = router