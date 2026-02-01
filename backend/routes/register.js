const express = require('express')
const router = express.Router()
const handleregistration = require('../controllers/registrationController')

router.post('/',handleregistration)
module.exports = router