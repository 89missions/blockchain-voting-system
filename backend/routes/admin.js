const express = require('express')
const router = express.Router()
const {
    createElection,
    addPosition,
    addCandidate,
    getElectionDetails,
    getElections
} = require('../controllers/adminController')
const allowedRole = require('../middlewares/allowedRole')


router.get('/election', allowedRole('admin'), getElections)
router.post('/election', allowedRole('admin'), createElection)
router.post('/position', allowedRole('admin'), addPosition)
router.post('/candidate', allowedRole('admin'), addCandidate)

router.get('/election/:electionId', allowedRole('admin'), getElectionDetails)

module.exports = router