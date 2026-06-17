/* eslint-disable @typescript-eslint/no-unused-vars */
import backbone from 'backbone';

export class BaseEvent {
  on(eventName?, callback?, context?) {}
  off(eventName?, callback?, context?) {}
  trigger(eventName?, ...args) {}
  bind(eventName?, callback?, context?) {}
  unbind(eventName?, callback?, context?) {}
  once(events?, callback?, context?) {}
  listenTo(object?, events?, callback?) {}
  listenToOnce(object?, events?, callback?) {}
  stopListening(object?, events?, callback?) {}
}
Object.assign(BaseEvent.prototype, backbone.Events);

export default BaseEvent;
