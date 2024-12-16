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

const DB = client.db('GET_IT_DONE')
const serviceCollection = DB.collection('services')

async function run () {
  try {
    // await client.connect()
    // await client.db('admin').command({ ping: 1 })
    console.log('Pinged your deployment. Successfully connected to MongoDB!')

    app.get('/services', async (req, res) => {
      const limit = parseInt(req.query.limit)
      const page = parseInt(req.query.page) || 1

      if (limit > 0) {
        const skip = (page - 1) * limit
        const totalCount = await serviceCollection.countDocuments()
        const totalPages = Math.ceil(totalCount/limit)
        const result = await serviceCollection
          .find()
          .skip(skip)
          .limit(limit)
          .toArray()
        res.send({ result, totalCount, totalPages })
      } else {
        const result = await serviceCollection.find().toArray()
        res.send([result.length, result])
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
