const registeredusers = require('../models/electionparticipants')
const eligiblevoters = require('../models/students')
const admins = require('../models/admins')
const bcrypt = require('bcrypt')

const handleRegistration = async (req, res) => {
    try {
        const roles = ["admin", "voter"]

        const { id, userName, password } = req.body

        // Check for missing credentials
        if (!id || !userName || !password) {
            return res.status(400).json({
                message: "Missing valuable credential"
            })
        }

        // Check if user already exists
        const existingUser = await registeredusers.findOne({
            id: Number(id)
        })

        console.log("Existing user:", existingUser)

        if (existingUser) {
            return res.status(409).json({
                message: "User already exists"
            })
        }

        // Check if the ID belongs to an admin
        const isAdmin = await admins.findOne({
            id: Number(id)
        })

        console.log("Admin found:", isAdmin)

        if (isAdmin) {
            const hashedPassword = await bcrypt.hash(password, 10)

            await registeredusers.create({
                id: Number(id),
                userName: userName,
                role: roles[0],
                password: hashedPassword
            })

            return res.status(201).json({
                message: "Admin registered successfully",
                role: "admin"
            })
        }

        // Show the database being used
        console.log("Database:", eligiblevoters.db.name)

        // Show the collection being used
        console.log("Collection:", eligiblevoters.collection.name)

        // Get all eligible voters
        const allVoters = await eligiblevoters.find({}).lean()

        console.log("Total eligible voters:", allVoters.length)

        console.log(
            "All eligible voters:",
            JSON.stringify(allVoters, null, 2)
        )

        // Convert ID to Number
        const voterId = Number(id)

        console.log("Searching for voter ID:", voterId)
        console.log("Searching ID type:", typeof voterId)

        // Find voter
        const eligibleVoter = await eligiblevoters.findOne({
            id: voterId
        }).lean()

        console.log("Eligible voter found:", eligibleVoter)


        // Voter is not eligible
        if (!eligibleVoter) {
            console.log("❌ VOTER NOT FOUND")
            console.log("ID searched:", voterId)

            return res.status(403).json({
                message: "Not eligible to vote"
            })
        }

        console.log("✅ ELIGIBLE VOTER FOUND")
        console.log(eligibleVoter)

        // ==========================================
        // REGISTER VOTER
        // ==========================================

        const hashedPassword = await bcrypt.hash(password, 10)

        const newUser = await registeredusers.create({
            id: voterId,
            userName: userName,
            role: roles[1],
            password: hashedPassword
        })

        console.log("✅ VOTER REGISTERED")
        console.log(newUser)

        return res.status(201).json({
            message: "Voter registered successfully",
            role: "voter"
        })

    } catch (error) {
        console.log("=================================")
        console.log("❌ REGISTRATION ERROR")
        console.log(error)
        console.log("=================================")

        return res.status(500).json({
            message: "Server error"
        })
    }
}

module.exports = handleRegistration