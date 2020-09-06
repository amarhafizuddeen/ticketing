import { Publisher, PaymentCreatedEvent, Subjects } from '@amartickets/common'

export class PaymentCreatedPublisher extends Publisher<PaymentCreatedEvent> {
  readonly subject = Subjects.PaymentCreated
}
