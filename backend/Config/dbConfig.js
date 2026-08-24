const mongoose = require('mongoose')

const connectDb = async () => {
    try {
        await mongoose.connect(process.env.DB_URI)
    } catch (error) {
        console.log('MongoDB connection error:', error)
    }
}

module.exports = connectDb