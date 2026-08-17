const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const registeredusers = require('../models/electionparticipants')
const crypto = require('crypto')

const handleLogin = async (req, res) => {

    try {

        const { id, password } = req.body

        // Check credentials
        if (!id || !password) {
            return res.status(400).json({
                message: "missing credential"
            })
        }

        // Find user
        const foundUser = await registeredusers.findOne({
            id: id
        })

        if (!foundUser) {
            return res.status(401).json({
                message: "Invalid credentials"
            })
        }

        // Compare password
        const compare = await bcrypt.compare(
            password,
            foundUser.password
        )

        if (!compare) {
            return res.status(401).json({
                message: "Invalid credentials"
            })
        }

        // ==============================
        // CREATE ACCESS TOKEN
        // ==============================

        const accessToken = jwt.sign(
            {
                userInfo: {
                    id: foundUser.id,
                    role: foundUser.role
                }
            },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn: "15m"
            }
        )

        // ==============================
        // CREATE REFRESH TOKEN
        // ==============================

        const refreshToken = jwt.sign(
            {
                userInfo: {
                    id: foundUser.id,
                    role: foundUser.role
                }
            },
            process.env.REFRESH_TOKEN_SECRET,
            {
                expiresIn: "2d"
            }
        )

    
        const hashedRefreshToken = crypto
            .createHash('sha256')
            .update(refreshToken)
            .digest('hex')

        // ==============================
        // SAVE REFRESH TOKEN
        // ==============================

        foundUser.refreshToken = hashedRefreshToken

        await foundUser.save()

        console.log("User logged in:", foundUser.id)
        console.log("Access token generated")
        console.log("Refresh token generated")

        // ==============================
        // SEND TOKENS IN RESPONSE
        // ==============================

        return res.status(200).json({
            message: "Login successful",
            accessToken: accessToken,
            refreshToken: refreshToken
        })

    } catch (err) {

        console.error("Login error:", err)

        return res.status(500).json({
            message: "Internal server error"
        })
    }
}

module.exports = handleLogin