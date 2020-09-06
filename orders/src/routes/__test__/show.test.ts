import request from 'supertest'
import { app } from '../../app'
import { Ticket } from '../../models/ticket'
import mongoose from 'mongoose'

it('returns a 401 when user is not signed in', async () => {
  const orderId = await mongoose.Types.ObjectId()
  await request(app).get(`/api/orders/${orderId}`).expect(401)
})

it('returns a 404 when fetching a non existing order', async () => {
  const orderId = await mongoose.Types.ObjectId()
  await request(app).get(`/api/orders/${orderId}`).set('Cookie', global.getCookie()).expect(404)
})

it(`returns a 401 if user tries to fetch another user's order`, async () => {
  // Create a ticket
  const ticket = Ticket.build({
    id: mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 20
  })
  await ticket.save()

  // Make a request to build an order with this ticket
  const { body: order } = await request(app)
    .post('/api/orders')
    .set('Cookie', global.getCookie())
    .send({ ticketId: ticket.id })
    .expect(201)

  // Make request to fetch the order
  await request(app).get(`/api/orders/${order.id}`).set('Cookie', global.getCookie()).expect(401)
})

it('fetches the order', async () => {
  // Create a ticket
  const ticket = Ticket.build({
    id: mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 20
  })
  await ticket.save()

  const user = global.getCookie()

  // Make a request to build an order with this ticket
  const { body: order } = await request(app)
    .post('/api/orders')
    .set('Cookie', user)
    .send({ ticketId: ticket.id })
    .expect(201)

  // Make request to fetch the order
  const { body: fetchedOrder } = await request(app)
    .get(`/api/orders/${order.id}`)
    .set('Cookie', user)
    .expect(200)

  expect(fetchedOrder.id).toEqual(order.id)
})
