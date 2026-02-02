const mongoose = require('mongoose')
const {Schema} = mongoose

const registereduserschema = new Schema({
    id:Number,
    voterName:String,
    password:String,
    refreshToken:String
})

module.exports = mongoose.model('registeredusers',registereduserschema)