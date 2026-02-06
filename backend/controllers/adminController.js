const elections = require('../models/elections')
const positions = require('../models/positions')
const candidates = require('../models/candidates')

// 1. Create a New Election
const createElection = async (req, res) => {
    try {
        const { title, description, startDate, endDate } = req.body
        
        if (!title || !startDate || !endDate) {
            return res.status(400).json({ message: "Missing required fields" })
        }

        const newElection = await elections.create({
            title,
            description,
            startDate,
            endDate,
            createdBy: req.id
        })
        
        res.status(201).json({
            message: "Election created",
            election: newElection
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Server error" })
    }
}

// 2. Add a Position
const addPosition = async (req, res) => {
    try {
        const { name, electionId, order } = req.body
        
        if (!name || !electionId) {
            return res.status(400).json({ message: "Missing required fields" })
        }

        const newPosition = await positions.create({
            name,
            electionId,
            order: order || 0
        })
        
        res.status(201).json({
            message: "Position added",
            position: newPosition
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Server error" })
    }
}

// 3. Add a Candidate
const addCandidate = async (req, res) => {
    try {
        const { name, photo, bio, positionId, electionId } = req.body
        
        if (!name || !positionId || !electionId) {
            return res.status(400).json({ message: "Missing required fields" })
        }

        const newCandidate = await candidates.create({
            name,
            photo,
            bio,
            positionId,
            electionId
        })
        
        res.status(201).json({
            message: "Candidate added",
            candidate: newCandidate
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Server error" })
    }
}

// 4. Get All Active Elections
const getElections = async (req, res) => {
    try {
        // We use 'list' here so we don't overwrite the 'elections' model
        const list = await elections.find({ isActive: true })
        res.status(200).json({ elections: list })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Server error" })
    }
}

// 5. Get Election Details (Positions + Candidates)
const getElectionDetails = async (req, res) => {
    try {
        const { electionId } = req.params
        
        const foundElection = await elections.findById(electionId)
        if (!foundElection) {
            return res.status(404).json({ message: "Election not found" })
        }

        const foundPositions = await positions.find({ electionId }).sort({ order: 1 })
        
        const data = await Promise.all(
            foundPositions.map(async (pos) => {
                const candidateList = await candidates.find({ positionId: pos._id })
                return {
                    ...pos.toObject(),
                    candidates: candidateList
                }
            })
        )
        
        res.status(200).json({
            election: foundElection,
            positions: data
        })
    } catch (error) {
        console.error(error)
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