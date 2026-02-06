const jwt = require('jsonwebtoken');
const registeredusers = require('../models/registeredusers');
const crypto = require('crypto');

const handleRefreshToken = async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(401);
    
    const refreshToken = cookies.jwt;

    // 1. Hash the incoming cookie token to compare with the DB
    const hashedToken = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

    try {
        // 2. Find user with that hashed token
        const foundUser = await registeredusers.findOne({ refreshToken: hashedToken });
        if (!foundUser) return res.sendStatus(403); // Forbidden

        // 3. Verify the actual JWT
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {
                // Check if error or if the user IDs don't match
                if (err || foundUser.id !== decoded.userInfo.id) return res.sendStatus(403);
                
                // 4. Generate new Access Token
                const accessToken = jwt.sign(
                    { "userInfo": { "id": decoded.userInfo.id, "role": decoded.userInfo.role } },
                    process.env.ACCESS_TOKEN_SECRET,
                    { expiresIn: '15m' }
                );
                
                res.json({ accessToken });
            }
        );
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
}

module.exports = handleRefreshToken;