const registeredusers = require('../models/registeredusers')
const eligiblevoters = require('../models/eligiblevoters')
const bcrypt = require('bcrypt')

const handleRegistration = async (req,res)=>{
    try {
    const {id,voterName,password} = req.body

    //checks to see if the req.body came with the required parameters
    if(!id || !voterName || !password){
       return res.status(400).json({"message":"Missing valuable credential"})
    }

    //check to see if users are eligible... will crosscheck from the eligiblevoters collection...
    const eligibleVoter = await eligiblevoters.findOne({id:id}).exec()
    if(!eligibleVoter){
       return res.status(403).json({"Message":"not eligible to vote"})
    }

    //check to see if user does not already exist.
    const existingUser = await registeredusers.findOne({id:id})
    if(existingUser){
       return res.status(409).json({"message":"user already existss"})
    }
    
        const hashedPassword = await bcrypt.hash(password,10)
        await registeredusers.create({
            "id":id,
            "voterName":voterName,
            "password":hashedPassword
        })
        
          return  res.status(201).json({
            "message":"user created successfully"
        })
        
    } catch (error) {
        console.log(error)
    }

}
module.exports = handleRegistration