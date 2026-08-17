const mongoose = require('mongoose')
const {Schema} = mongoose

const studentschema = new Schema({
    id:Number,
    userName:String,
})

module.exports = mongoose.model('students',studentschema)