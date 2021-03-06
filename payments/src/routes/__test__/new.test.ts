import request from 'supertest'
import { app } from '../../app'
import mongoose from 'mongoose'
import { Order, OrderStatus } from '../../models/order'
import { stripe } from '../../stripe'
import { Payment } from '../../models/payment'

it('returns a 404 when purchasing an order that does not exist', async () => {
  await request(app)
    .post('/api/payments')
    .set('Cookie', global.getCookie())
    .send({
      token: 'asdasdvrw',
      orderId: mongoose.Types.ObjectId().toHexString()
    })
    .expect(404)
})

it('returns a 401 when purchasing an order that does not belong to the user', async () => {
  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    version: 0,
    price: 30,
    userId: mongoose.Types.ObjectId().toHexString(),
    status: OrderStatus.Created
  })
  await order.save()

  await request(app)
    .post('/api/payments')
    .set('Cookie', global.getCookie())
    .send({
      token: 'asdasdvrw',
      orderId: order.id
    })
    .expect(401)
})

it('returns a 400 when purchasing a cancelled order', async () => {
  const userId = mongoose.Types.ObjectId().toHexString()
  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    version: 0,
    price: 30,
    userId,
    status: OrderStatus.Cancelled
  })
  await order.save()

  await request(app)
    .post('/api/payments')
    .set('Cookie', global.getCookie(userId))
    .send({
      token: 'asdasdvrw',
      orderId: order.id
    })
    .expect(400)
})

it('returns a 204 with valid inputs', async () => {
  const userId = mongoose.Types.ObjectId().toHexString()
  const price = Math.floor(Math.random() * 100000)
  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    version: 0,
    price,
    userId,
    status: OrderStatus.Created
  })
  await order.save()

  await request(app)
    .post('/api/payments')
    .set('Cookie', global.getCookie(userId))
    .send({
      token: 'tok_visa',
      orderId: order.id
    })
    .expect(201)

  const stripeCharges = await stripe.charges.list({ limit: 50 })
  const stripeCharge = stripeCharges.data.find(charge => {
    return charge.amount === price * 100
  })

  expect(stripeCharge).toBeDefined()
  expect(stripeCharge!.currency).toEqual('myr')

  const payment = await Payment.findOne({
    orderId: order.id,
    stripeId: stripeCharge!.id
  })

  expect(payment).not.toBeNull()
})
