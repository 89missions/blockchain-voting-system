const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const registeredusers = require('../models/registeredusers')
const crypto = require('crypto')

const handleLogin = async (req,res)=>{
        const {id,password} = req.body

        if (!id || !password){
            return res.status(400).json({"message":"missing credential"})
        }
    
        const foundUser = await registeredusers.findOne({id:id})
        if(!foundUser){
            return res.sendStatus(401)
        }
        
        const compare = await bcrypt.compare(password,foundUser.password)
        if(compare){
           const accessToken = jwt.sign(
                {"userInfo":{id:foundUser.id}},
                process.env.ACCESS_TOKEN_SECRET,
                {expiresIn:"15m"}
            )
            const refreshToken = jwt.sign(
                {id:foundUser.id},
                process.env.REFRESH_TOKEN_SECRET,
                {expiresIn:"2d"}
            )
             //storing refreshToken with the user in the database.. 
        const hashedRefreshToken = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');   
        
        //saved the refresh token in the database
        foundUser.refreshToken = hashedRefreshToken
        const result = await foundUser.save()
        console.log(result)

        //sending the refresh and access token to the user in a cookie.
       res.cookie('jwt',refreshToken,{httpOnly:true,maxAge: 2 * 24 * 60 * 60 * 1000})
       return res.json({accessToken})
        }   else{
            return res.status(401).json({ message: "Invalid credentials" })
        }
}
module.exports = handleLogin