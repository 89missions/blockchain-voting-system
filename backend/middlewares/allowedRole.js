const allowRole = (...allowedRole)=>{
    return (req,res,next)=>{
        if(!req.role)return res.sendStatus(401)
            const allowed = allowedRole.includes(req.role) 
        if(!allowed){
            return res.sendStatus(403)
        }
        next()
    }
}
module.exports = allowRole