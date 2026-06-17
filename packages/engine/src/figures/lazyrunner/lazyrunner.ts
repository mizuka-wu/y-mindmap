import { executors } from "./executors";
import constants from "./constants";

const SORTTED_PRIORITIES = [
  constants.PRIORITY.BEFORE_EACH,
  constants.PRIORITY.BEFORE_LAYOUT,
  constants.PRIORITY.LAYOUT,
  constants.PRIORITY.AFTER_LAYOUT,
  constants.PRIORITY.BEFORE_RENDER,
  constants.PRIORITY.RENDER,
  constants.PRIORITY.AFTER_RENDER,
  constants.PRIORITY.BEFORE_SELECT_SELECTION,
  constants.PRIORITY.SELECT_SELECTION,
  constants.PRIORITY.AFTER_EACH,
];
export class LazyRunner {
  _running: boolean;
  _abortedPriority: string;
  _tasks: any;
  constructor() {
    this._running = false;
    this._abortedPriority = constants.ABORTED_PRIORITY.NONE;
    this._tasks = {};
    SORTTED_PRIORITIES.forEach((priority) => (this._tasks[priority] = []));
  }
  work(priority?, task?) {
    if (task) {
      this._tasks[priority] = this._tasks[priority]
        ? this._tasks[priority]
        : [];
      if (Array.isArray(task)) {
        this._tasks[priority].push(...task);
      } else {
        this._tasks[priority].push(task);
      }
    }
    if (!this._running) {
      this._running = true;
      this._work().then((result: any) => {
        this._running = false;
        if (result === "Aborted") {
          return;
        }
        if (
          this._tasks[constants.PRIORITY.LAYOUT].filter((f) =>
            taskCanExecute(f),
          ).length > 0 ||
          this._tasks[constants.PRIORITY.RENDER].filter((f) =>
            taskCanExecute(f),
          ).length > 0
        ) {
          this.work();
        }
      });
    }
  }
  _work() {
    return Promise.resolve().then(() => {
      SORTTED_PRIORITIES.forEach((priority) => {
        if (
          priority === this._abortedPriority ||
          this._abortedPriority === constants.ABORTED_PRIORITY.ALL
        ) {
          return "Aborted";
        }
        let tasks = this._tasks[priority].filter((f) => taskCanExecute(f));
        do {
          this._tasks[priority] = this._tasks[priority].filter(
            (f) => !taskCanExecute(f) && !f.isDisposed(),
          );
          executors(priority, tasks);
          tasks = this._tasks[priority].filter((f) => taskCanExecute(f));
        } while (tasks.length > 0);
      });
    });
  }
  skip(abortedPriority) {
    this._abortedPriority = abortedPriority;
  }
  clearPriority(priority) {
    this._tasks[priority] = [];
  }
}
function taskCanExecute(task) {
  return !task.canExecute || task.canExecute();
}
