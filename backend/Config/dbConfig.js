const mongoose = require('mongoose')

const connectDb = async () => {
    try {
        await mongoose.connect(process.env.DB_URI)

        console.log('=================================')
        console.log('MongoDB connection successful')
        console.log('Database:', mongoose.connection.name)
        console.log('Host:', mongoose.connection.host)
        console.log('=================================')

    } catch (error) {
        console.log('MongoDB connection error:', error)
    }
}

module.exports = connectDb