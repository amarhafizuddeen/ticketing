import request from 'supertest'
import { app } from '../../app'
import { Ticket } from '../../models/ticket'
import mongoose from 'mongoose'
import { OrderStatus, Order } from '../../models/order'
import { natsWrapper } from '../../nats-wrapper'

it('returns a 401 when user is not signed in', async () => {
  const orderId = await mongoose.Types.ObjectId()
  await request(app).delete(`/api/orders/${orderId}`).expect(401)
})

it('returns a 404 when deleting a non existing order', async () => {
  const orderId = await mongoose.Types.ObjectId()
  await request(app).delete(`/api/orders/${orderId}`).set('Cookie', global.getCookie()).expect(404)
})

it(`returns a 401 if user tries to cancel another user's order`, async () => {
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

  // Make request to cancel the order
  await request(app).delete(`/api/orders/${order.id}`).set('Cookie', global.getCookie()).expect(401)
})

it('marks an order as cancelled', async () => {
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

  // Make request to cancel the order
  await request(app).delete(`/api/orders/${order.id}`).set('Cookie', user).expect(204)

  // Expectation to make sure the thing is cancelled
  const updatedOrder = await Order.findById(order.id)

  expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled)
})

it('emits a order cancelled event', async () => {
  const ticket = Ticket.build({
    id: mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 20
  })
  await ticket.save()

  const user = global.getCookie()

  const { body: order } = await request(app)
    .post('/api/orders')
    .set('Cookie', user)
    .send({ ticketId: ticket.id })
    .expect(201)

  await request(app).delete(`/api/orders/${order.id}`).set('Cookie', user).expect(204)

  expect(natsWrapper.client.publish).toHaveBeenCalled()
})
