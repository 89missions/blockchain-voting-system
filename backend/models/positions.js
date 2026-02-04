// models/Position.js
const mongoose = require('mongoose')

const positionSchema = new mongoose.Schema({
    name: { type: String, required: true }, // e.g., "SRC President"
    electionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
    order: { type: Number, default: 0 }, // To control display order
    createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('positions', positionSchema)