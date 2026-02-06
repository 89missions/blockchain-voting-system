const mongoose = require('mongoose')

const electionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type:String },
    createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('elections', electionSchema)