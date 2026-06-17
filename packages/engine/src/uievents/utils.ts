import { MODULE_NAME, UI_STATUS, VIEW_TYPE } from '../common/constants/index';
import type { SheetEditor, Semaphore } from '../type.d';
import type { UiEventsManager } from './events';
export function registerEvents(
  eventManager: UiEventsManager,
  events: Record<string, string>,
  selector: (typeof VIEW_TYPE)[keyof typeof VIEW_TYPE],
  target: Record<string, (e: Event) => void>
) {
  Object.keys(events).forEach(eventName => {
    const handlerName = events[eventName];
    const handler = target[handlerName];
    if (handler === undefined) {
      return;
    } else {
      eventManager.on(eventName, selector, handler);
    }
  });
}
export function isDragUIStatusActive(context: SheetEditor) {
  const semaphore = context.getModule<Semaphore>(MODULE_NAME.SEMAPHORE);
  if (semaphore === null || semaphore === undefined) {
    return undefined;
  } else {
    return semaphore.isStatusActive(UI_STATUS.DRAG);
  }
}
