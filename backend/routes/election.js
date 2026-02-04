const express = require('express')
const router = express.Router()
const handleElections = require('../controllers/electionsController')

router.get('/', handleElections)

module.exports = router