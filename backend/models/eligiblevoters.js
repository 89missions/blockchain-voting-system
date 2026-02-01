const mongoose = require('mongoose')
const {Schema} = mongoose

const eligiblevoterschema = new Schema({
    id:Number,
    studentname:String,
})

module.exports = mongoose.model('eligiblevoters',eligiblevoterschema)