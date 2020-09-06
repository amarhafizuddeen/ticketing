import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'

declare global {
  namespace NodeJS {
    interface Global {
      getCookie(id?: string): string[]
    }
  }
}

jest.mock('../nats-wrapper')

process.env.STRIPE_KEY =
  'sk_test_51HNezMCLyKMlA7SnEaPzS7mXvIH1nhDBW5Qg3LWH56lbDsp0h1xs87omarXEPMP5HprJJriAbZUrPvruqO4GLYjW00XpYcm3Ss'

let mongo: any
beforeAll(async () => {
  process.env.JWT_KEY = 'whateversecret'
  mongo = new MongoMemoryServer()
  const mongoUri = await mongo.getUri()

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
})

beforeEach(async () => {
  jest.clearAllMocks()
  const collections = await mongoose.connection.db.collections()

  for (let collection of collections) {
    await collection.deleteMany({})
  }
})

afterAll(async () => {
  await mongo.stop()
  await mongoose.connection.close()
})

global.getCookie = (id?: string) => {
  const token = jwt.sign(
    {
      id: id || new mongoose.Types.ObjectId().toHexString(),
      email: 'fake@email.com'
    },
    process.env.JWT_KEY!
  )

  const sessionJSON = JSON.stringify({ jwt: token })
  const base64 = Buffer.from(sessionJSON).toString('base64')

  return [`express:sess=${base64}`]
}
