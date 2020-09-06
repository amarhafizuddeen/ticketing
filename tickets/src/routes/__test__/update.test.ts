import request from 'supertest'
import { app } from '../../app'
import mongoose from 'mongoose'
import { natsWrapper } from '../../nats-wrapper'
import { Ticket } from '../../models/ticket'

it('returns a 404 if the provided id does not exist', async () => {
  const id = new mongoose.Types.ObjectId().toHexString()
  await request(app)
    .put(`/api/tickets/${id}`)
    .set('Cookie', global.getCookie())
    .send({
      title: 'valid title',
      price: 30
    })
    .expect(404)
})

it('returns a 401 if the user is not authenticated', async () => {
  const id = new mongoose.Types.ObjectId().toHexString()
  await request(app)
    .put(`/api/tickets/${id}`)
    .send({
      title: 'valid title',
      price: 30
    })
    .expect(401)
})

it('returns a 401 if the user does not own the ticket', async () => {
  const response = await request(app).post('/api/tickets').set('Cookie', global.getCookie()).send({
    title: 'Good concert',
    price: 100
  })

  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', global.getCookie())
    .send({
      title: 'Bad concert',
      price: 1
    })
    .expect(401)
})

it('returns a 400 if the user provided an invalid title or price', async () => {
  const cookie = global.getCookie()
  const response = await request(app).post('/api/tickets').set('Cookie', cookie).send({
    title: 'Good concert',
    price: 100
  })

  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', cookie)
    .send({
      title: '',
      price: 100
    })
    .expect(400)

  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', cookie)
    .send({
      title: 'Good concert',
      price: -100
    })
    .expect(400)
})

it('updates the ticket provided valid inputs', async () => {
  const cookie = global.getCookie()
  const response = await request(app).post('/api/tickets').set('Cookie', cookie).send({
    title: 'Good concert',
    price: 100
  })

  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', cookie)
    .send({
      title: 'New concert',
      price: 200
    })
    .expect(200)

  const ticketResponse = await request(app).get(`/api/tickets/${response.body.id}`).send()

  expect(ticketResponse.body.title).toEqual('New concert')
  expect(ticketResponse.body.price).toEqual(200)
})

it('publishes an event', async () => {
  const cookie = global.getCookie()
  const response = await request(app).post('/api/tickets').set('Cookie', cookie).send({
    title: 'Good concert',
    price: 100
  })

  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', cookie)
    .send({
      title: 'New concert',
      price: 200
    })
    .expect(200)

  expect(natsWrapper.client.publish).toHaveBeenCalled()
})

it('rejects update if the ticket is reserved', async () => {
  const cookie = global.getCookie()
  const response = await request(app).post('/api/tickets').set('Cookie', cookie).send({
    title: 'Good concert',
    price: 100
  })

  const ticket = await Ticket.findById(response.body.id)
  ticket!.set({ orderId: mongoose.Types.ObjectId().toHexString() })
  await ticket!.save()

  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', cookie)
    .send({
      title: 'New concert',
      price: 200
    })
    .expect(400)
})
