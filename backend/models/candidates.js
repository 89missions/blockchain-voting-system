// models/Candidate.js
const mongoose = require('mongoose')

const candidateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    photo: String,
    bio: String,
    positionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Position', required: true },
    electionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
    votes: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('candidates', candidateSchema)