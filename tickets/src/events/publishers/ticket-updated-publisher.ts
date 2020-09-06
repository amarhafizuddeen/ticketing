import { Publisher, TicketUpdatedEvent, Subjects } from '@amartickets/common'

export class TicketUpdatedPublisher extends Publisher<TicketUpdatedEvent> {
  readonly subject = Subjects.TicketUpdated
}
