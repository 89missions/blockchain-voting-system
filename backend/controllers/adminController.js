const elections = require('../models/elections')
const positions = require('../models/positions')
const candidates = require('../models/candidates')
const mongoose = require('mongoose')

const createElection = async (req, res) => {
    try {
        const { title, description, startDate, endDate } = req.body;

        if (!title || !startDate || !endDate) {
            return res.status(400).json({
                message: "Missing required fields"
            });
        }

        // Convert dates to Unix timestamps (seconds)
        const startTime = Math.floor(
            new Date(startDate).getTime() / 1000
        );

        const endTime = Math.floor(
            new Date(endDate).getTime() / 1000
        );

        // Make sure the dates are valid
        if (
            Number.isNaN(startTime) ||
            Number.isNaN(endTime)
        ) {
            return res.status(400).json({
                message: "Invalid election dates"
            });
        }

        // Make sure election starts before it ends
        if (startTime >= endTime) {
            return res.status(400).json({
                message: "End date must be after start date"
            });
        }

        // Deploy blockchain contract
        const deployElectionContract =
            (await import("../blockchain/services/deployElection.js"))
                .default;

        const contractAddress =
            await deployElectionContract(
                startTime,
                endTime
            );

        // Save election + blockchain contract address
        const newElection = await elections.create({
            title,
            description,
            startDate,
            endDate,
            createdBy: req.id,
            contractAddress
        });

        return res.status(201).json({
            message: "Election created",
            electionId: newElection._id,
            contractAddress
        });

    } catch (error) {

        console.error("Create election error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};
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
            positionid: newPosition._id
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Server error" })
    }
}

const addCandidate = async (req, res) => {
    try {
        const { name, photo, bio, positionId, electionId } = req.body
        
        if (!name || !positionId || !electionId) {
            return res.status(400).json({ message: "Missing required fields" })
        }

        const newCandidate = await candidates.create({
            candidateId: new mongoose.Types.ObjectId(),
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

const getElections = async (req, res) => {
    try {
        const list = await elections.find({ isActive: true })
        res.status(200).json({ elections: list })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Server error" })
    }
}

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