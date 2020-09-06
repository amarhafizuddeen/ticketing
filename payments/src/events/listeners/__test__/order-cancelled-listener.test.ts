import { OrderCancelledListener } from '../order-cancelled-listener'
import { natsWrapper } from '../../../nats-wrapper'
import { OrderCancelledEvent, OrderStatus } from '@amartickets/common'
import mongoose from 'mongoose'
import { Message } from 'node-nats-streaming'
import { Order } from '../../../models/order'

const setup = async () => {
  const listener = new OrderCancelledListener(natsWrapper.client)

  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    version: 0,
    status: OrderStatus.Created,
    userId: '123fasf',
    price: 30
  })
  await order.save()

  const data: OrderCancelledEvent['data'] = {
    id: order.id,
    version: 1,
    ticket: {
      id: '123asgwfw'
    }
  }

  // @ts-ignore
  const msg: Message = {
    ack: jest.fn()
  }

  return { listener, data, msg, order }
}

it('updates the status of the order', async () => {
  const { listener, data, msg, order } = await setup()

  await listener.onMessage(data, msg)

  const updatedOrder = await Order.findById(order.id)
  expect(updatedOrder!.id).toEqual(data.id)
  expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled)
})

it('acks the message', async () => {
  const { listener, data, msg } = await setup()

  await listener.onMessage(data, msg)

  expect(msg.ack).toHaveBeenCalled()
})