const express = require('express')
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb')

const app = express()
const port = process.env.PORT

//middlewares
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Hello from the server side....')
})

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@clustermuntasir.bwzlexy.mongodb.net/?retryWrites=true&w=majority&appName=clusterMuntasir`

// Create a MongoClient with a MongoClientOptions object
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
})

// all collections
const DB = client.db('GET_IT_DONE')
const serviceCollection = DB.collection('services')
const userCollection = DB.collection('users')

async function run () {
  try {
    // await client.connect()
    // await client.db('admin').command({ ping: 1 })
    console.log('Pinged your deployment. Successfully connected to MongoDB!')

    //get all services or by page
    app.get('/services', async (req, res) => {
      const limit = parseInt(req.query.limit)
      const page = parseInt(req.query.page) || 1
      const totalCount = await serviceCollection.countDocuments()
      try {
        if (limit > 0) {
          const skip = (page - 1) * limit
          const totalPages = Math.ceil(totalCount / limit)
          const result = await serviceCollection
            .find()
            .skip(skip)
            .limit(limit)
            .toArray()
          res.status(200).send({ result, totalCount, totalPages })
        } else {
          const result = await serviceCollection.find().toArray()
          res.status(200).send({ services: result, totalCount })
        }
      } catch (error) {
        res.status(500).send({ message: 'Server Error' })
      }
    })

    // post a new user
    app.post('/user', async (req, res) => {
      const {
        displayName,
        email,
        photoURL,
        phoneNumber,
        createdAt,
        lastLoginAt,
        password
      } = req.body
      try {
        const existingUser = await userCollection.findOne({ email })
        // console.log(updatedUser)
        const usersCount = await userCollection.countDocuments()
        let updatedUser
        // if the user is New
        if (!existingUser) {
          updatedUser = {
            id: usersCount + 1,
            name: displayName,
            email,
            isAvailable: true,
            title: '',
            bio: '',
            photoURL,
            coverPhotoURL: '',
            phoneNumber,
            address: '',
            fbAddress: '',
            linkedInAddress: '',
            twitterAddress: '',
            isVerified: false,
            createdAt,
            loggedInData: [lastLoginAt],
            services: [],
            bookedServices: [],
            earningHistory: [],
            spendingHistory: [],
            password
          }
          const result = await userCollection.insertOne(updatedUser)
          res.status(200).send(result)
        } else {
          updatedUser = {
            ...existingUser,
            name: existingUser.name || displayName,
            photoURL: existingUser.photoURL || photoURL,
            createdAt: createdAt,
            loggedInData: [...existingUser.loggedInData, lastLoginAt],
            password: existingUser.password || password
          }
          const filter = { email }
          const updatedDoc = { $set: updatedUser }
          const options = { upsert: true }
          const result = await userCollection.updateOne(
            filter,
            updatedDoc,
            options
          )
          res.status(200).send(result)
        }
      } catch (err) {
        res.status(500).send({ err, message: 'server error' })
      }
    })

    // get a user data
    app.get('/users/:email', async (req, res) => {
      const email = req.params.email
      try {
        const result = await userCollection.findOne({ email })
        res.status(200).send(result)
      } catch (err) {
        console.log('Error occurred responding email get api')
        res.status(500).send(err)
      }
    })

    // patch with previous user or create new one
    app.patch('/users', async (req, res) => {
      const {
        email,
        displayName,
        photoURL,
        title,
        bio,
        coverPhotoURL,
        address,
        phoneNumber,
        fbAddress,
        linkedInAddress,
        twitterAddress
      } = req.body
      try {
        const filter = { email }
        const updatedDoc = {
          $set: {
            email,
            displayName,
            photoURL,
            title,
            bio,
            coverPhotoURL,
            address,
            phoneNumber,
            fbAddress,
            linkedInAddress,
            twitterAddress
          }
        }
        const options = { upsert: true }
        const result = await userCollection.updateOne(
          filter,
          updatedDoc,
          options
        )
        res.status(200).send(result)
      } catch (err) {
        res.status(500).send(err)
      }
    })
  } finally {
    // Uncomment this line if you want to keep the connection open
    // await client.close();
  }
}

run().catch(console.dir)

app.listen(port, () => {
  console.log('This server is running in the port no: ', port)
})
