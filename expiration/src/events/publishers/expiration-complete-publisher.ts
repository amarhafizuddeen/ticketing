import { Publisher, ExpirationCompleteEvent, Subjects } from '@amartickets/common'

export class ExpirationCompletePublisher extends Publisher<ExpirationCompleteEvent> {
  readonly subject = Subjects.ExpirationComplete
}
