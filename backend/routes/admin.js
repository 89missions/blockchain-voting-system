const express = require('express')
const router = express.Router()
const {
    createElection,
    addPosition,
    addCandidate
} = require('../controllers/adminController')

router.post('/election', createElection)
router.post('/position', addPosition)
router.post('/candidate', addCandidate)

module.exports = router