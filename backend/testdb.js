require('dotenv').config()

const mongoose = require('mongoose')

const testDatabase = async () => {
    try {
        console.log("=================================")
        console.log("DATABASE TEST")
        console.log("=================================")

        console.log("DB_URI:", process.env.DB_URI)

        await mongoose.connect(process.env.DB_URI)

        console.log("")
        console.log("MongoDB connected successfully")
        console.log("Host:", mongoose.connection.host)
        console.log("Port:", mongoose.connection.port)
        console.log("Database:", mongoose.connection.name)

        console.log("")
        console.log("Checking collections...")

        const collections = await mongoose.connection.db
            .listCollections()
            .toArray()

        console.log("Collections:")

        collections.forEach((collection) => {
            console.log("-", collection.name)
        })

        console.log("")
        console.log("Checking eligiblevoters collection...")

        const collectionExists = collections.some(
            collection => collection.name === "eligiblevoters"
        )

        if (!collectionExists) {
            console.log("❌ eligiblevoters collection DOES NOT EXIST")
        } else {
            console.log("✅ eligiblevoters collection EXISTS")

            const voters = await mongoose.connection.db
                .collection("eligiblevoters")
                .find({})
                .toArray()

            console.log("")
            console.log("Number of documents:", voters.length)

            console.log("")
            console.log("Documents:")

            console.log(JSON.stringify(voters, null, 2))
        }

        console.log("")
        console.log("=================================")

        await mongoose.disconnect()

        console.log("Database connection closed")

    } catch (error) {
        console.log("")
        console.log("❌ DATABASE ERROR")
        console.log(error)

        process.exit(1)
    }
}

testDatabase()