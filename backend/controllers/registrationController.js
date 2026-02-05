const registeredusers = require('../models/registeredusers')
const eligiblevoters = require('../models/eligiblevoters')
const admins = require('../models/admins')
const bcrypt = require('bcrypt')

const handleRegistration = async (req, res) => {
    try {
        const roles = ["admin", "voter"]
        const { id, userName, password } = req.body

        if (!id || !userName || !password) {
            return res.status(400).json({ "message": "Missing valuable credential" })
        }

        const existingUser = await registeredusers.findOne({ id: id })
        if (existingUser) {
            return res.status(409).json({ "message": "User already exists" })
        }

        const isAdmin = await admins.findOne({ id: id })

        if (isAdmin) {
            const hashedPassword = await bcrypt.hash(password, 10)
            await registeredusers.create({
                "id": id,
                "userName": userName,
                "role": roles[0],
                "password": hashedPassword
            })
            
            return res.status(201).json({
                "message": "Admin registered successfully",
                "role": "admin"
            })
        }

        const eligibleVoter = await eligiblevoters.findOne({ id: id })
        
        if (!eligibleVoter) {
            return res.status(403).json({ "message": "Not eligible to vote" })
        }

        // Register as voter
        const hashedPassword = await bcrypt.hash(password, 10)
        await registeredusers.create({
            "id": id,
            "userName": userName,
            "role": roles[1],
            "password": hashedPassword
        })

        return res.status(201).json({
            "message": "Voter registered successfully",
            "role": "voter"
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ "message": "Server error" })
    }
}
module.exports = handleRegistration
