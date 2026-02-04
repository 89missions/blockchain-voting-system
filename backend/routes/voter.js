const express = require('express')
const router = express.Router()
const { getElections, getElectionDetails } = require('../controllers/adminController')

router.get('/elections', getElections)
router.get('/election/:electionId', getElectionDetails)

module.exports = router