import { Publisher, OrderCancelledEvent, Subjects } from '@amartickets/common'

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
  readonly subject = Subjects.OrderCancelled
}
