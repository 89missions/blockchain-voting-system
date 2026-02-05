const mongoose = require('mongoose')
const { Schema } = mongoose

const adminSchema = new Schema({
    id:Number,
    name:String
})

module.exports = mongoose.model('admins',adminSchema)