import mongoose from 'mongoose'
import { OrderStatus } from '@amartickets/common'
import { updateIfCurrentPlugin } from 'mongoose-update-if-current'

export { OrderStatus }

interface OrderAttrs {
  id: string
  version: number
  userId: string
  price: number
  status: OrderStatus
}

interface OrderDoc extends mongoose.Document {
  version: number
  userId: string
  price: number
  status: OrderStatus
}

interface OrderModel extends mongoose.Model<OrderDoc> {
  build(attrs: OrderAttrs): OrderDoc
  findByEvent(event: { id: string; version: number }): Promise<OrderDoc | null>
}

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      required: true
    }
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id
        delete ret._id
      }
    }
  }
)
orderSchema.set('versionKey', 'version')
orderSchema.plugin(updateIfCurrentPlugin)

orderSchema.statics.findByEvent = (event: { id: string; version: number }) => {
  return Order.findOne({
    _id: event.id,
    version: event.version - 1
  })
}

orderSchema.statics.build = (attrs: OrderAttrs) => {
  const order = new Order(attrs)
  order._id = attrs.id
  delete order.id
  return order
}

const Order = mongoose.model<OrderDoc, OrderModel>('Order', orderSchema)

export { Order }
