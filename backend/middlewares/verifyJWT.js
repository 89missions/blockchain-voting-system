const jwt = require('jsonwebtoken')
const handleVerification = (req,res,next)=>{
    //get the authorization headers
    const authHeader = req.headers.authorization || req.headers.Authorization

    //return unauthorized when there isnt any authorization header
    if(!authHeader || !authHeader.startsWith('Bearer ')){
        return res.status(401).json({"message":"not authorized"})
    }

    //extract the token from the authorization header
    const token = authHeader.split(' ')[1]

    //verifying the token.
    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(error,decoded)=>{
        if(error){
            return res.sendStatus(401)
        }
        req.id = decoded.userInfo.id
        req.role = decoded.userInfo.role
        next()
    })
}

module.exports = handleVerification