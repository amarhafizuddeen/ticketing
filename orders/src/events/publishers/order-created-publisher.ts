import { Publisher, OrderCreatedEvent, Subjects } from '@amartickets/common'

export class OrderCreatedPublisher extends Publisher<OrderCreatedEvent> {
  readonly subject = Subjects.OrderCreated
}
