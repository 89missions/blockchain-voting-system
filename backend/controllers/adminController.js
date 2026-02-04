const elections = require('../models/elections')
const positions = require('../models/positions')
const candidates = require('../models/candidates')

const createElection = async (req, res) => {
    const { title, description, startDate, endDate } = req.body
    
    if (!title || !startDate || !endDate) {
        return res.status(400).json({ message: "Missing required fields" })
    }
    
    try {
        const election = await elections.create({
            title,
            description,
            startDate,
            endDate
        })
        
        res.status(201).json({
            message: "Election created",
            electionId: election._id,
            election
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server error" })
    }
}

const addPosition = async (req, res) => {
    const { name, electionId, order } = req.body
    
    if (!name || !electionId) {
        return res.status(400).json({ message: "Missing required fields" })
    }
    
    try {
        const position = await positions.create({
            name,
            electionId,
            order
        })
        
        res.status(201).json({
            message: "Position added",
            positionId: position._id,
            position
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server error" })
    }
}

const addCandidate = async (req, res) => {
    const { name, photo, bio, positionId, electionId } = req.body
    
    if (!name || !positionId || !electionId) {
        return res.status(400).json({ message: "Missing required fields" })
    }
    
    try {
        const candidate = await candidates.create({
            name,
            photo,
            bio,
            positionId,
            electionId
        })
        
        res.status(201).json({
            message: "Candidate added",
            candidate
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server error" })
    }
}

const getElections = async (req, res) => {
    try {
        const elections = await Election.find({ isActive: true })
        res.status(200).json({ elections })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server error" })
    }
}

const getElectionDetails = async (req, res) => {
    const { electionId } = req.params
    
    try {
        const election = await Election.findById(electionId)
        const positions = await Position.find({ electionId }).sort({ order: 1 })
        
        const positionsWithCandidates = await Promise.all(
            positions.map(async (position) => {
                const candidates = await Candidate.find({ positionId: position._id })
                return {
                    ...position.toObject(),
                    candidates
                }
            })
        )
        
        res.status(200).json({
            election,
            positions: positionsWithCandidates
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server error" })
    }
}

module.exports = {
    createElection,
    addPosition,
    addCandidate,
    getElections,
    getElectionDetails
}