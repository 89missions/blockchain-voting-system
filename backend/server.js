require('dotenv').config()
const express = require('express')
const app = express()
const mongoose = require('mongoose')
const Dbconnection = require('./Config/dbConfig')
const PORT = 3000

Dbconnection()

app.use(express.json())

app.use('/register',require('./routes/register'))
app.use('/login',require('./routes/login'))
app.use('/admin',require('./routes/admin'))
app.use('/voter',require('./routes/voter'))

mongoose.connection.once('open',()=>{
    console.log('connected to mongodb')
    app.listen(PORT,()=>{
        console.log(`Server running on port ${PORT}`)
    })
});
