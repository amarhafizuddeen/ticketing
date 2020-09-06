import { Publisher, TicketCreatedEvent, Subjects } from '@amartickets/common'

export class TicketCreatedPublisher extends Publisher<TicketCreatedEvent> {
  readonly subject = Subjects.TicketCreated
}
