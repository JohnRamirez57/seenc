// const express = require('express')
// const app = express()

// const { connect: connectRedis, getConnectionStatus } = require('./redisServ')

// // Connect to Redis on demand
// app.get('/api/connectRedis', async (req, res, next) => {
//     try {
//         await connectRedis()
//         res.json({ message: 'Connected' })
//     } catch (err) {
//         next(err)
//     }
// })

// app.get('/api', (req, res) => {
//     res.send({ message: 'Home Page!' })
// })

// app.get('/api/ping', (req, res) => {
//     res.json({ message: 'Server is running' })
// })

// // Explicit status endpoint — keep before the catch-all numeric route
// app.get('/api/getStatus', (req, res) => {
//     const status = getConnectionStatus()
//     res.json({ connected: Boolean(status) })
// })

// app.use('/api/:number', (req, res) => {
//     const givenNum = req.params.number
//     res.send({ message: `Inputted num: ${givenNum}` })
// })

// // Basic error handler
// app.use((err, req, res, next) => {
//     console.error(err)
//     res.status(500).json({ message: 'Server error' })
// })

// app.listen(3000, () => {
//     console.log('Running on port 3000!')
// })