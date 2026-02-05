const mongoose = require('mongoose')
const {Schema} = mongoose

const registereduserschema = new Schema({
    id:Number,
    userName:String,
    password:String,
    role:String,
    refreshToken:String
})

module.exports = mongoose.model('registeredusers',registereduserschema)