const express = require('express')
const router = express.Router()
const getLiveResults = require('../controllers/resultController')
const allowedRole = require('../middlewares/allowedRole')

router.post('/results',allowedRole('voter','admin'),getLiveResults)
module.exports = router