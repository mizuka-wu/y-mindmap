export enum Priority {
  BEFORE_EACH = 'before-each',
  BEFORE_LAYOUT = 'before-layout',
  LAYOUT = 'layout',
  AFTER_LAYOUT = 'after-layout',
  BEFORE_RENDER = 'before-render',
  RENDER = 'render',
  AFTER_RENDER = 'after-render',
  BEFORE_EACH_SELECTION = 'before-each-selection',
  SELECTION = 'selection',
  AFTER_EACH = 'after-each',
}

const SORTED_PRIORITIES = [
  Priority.BEFORE_EACH,
  Priority.BEFORE_LAYOUT,
  Priority.LAYOUT,
  Priority.AFTER_LAYOUT,
  Priority.BEFORE_RENDER,
  Priority.RENDER,
  Priority.AFTER_RENDER,
  Priority.BEFORE_EACH_SELECTION,
  Priority.SELECTION,
  Priority.AFTER_EACH,
]

export interface Task {
  execute(): void
  canExecute?(): boolean
  isDisposed?(): boolean
}

export class LazyRunner {
  private _running: boolean = false
  private _tasks: Map<Priority, Task[]> = new Map()
  
  constructor() {
    for (const priority of SORTED_PRIORITIES) {
      this._tasks.set(priority, [])
    }
  }
  
  work(priority: Priority, task: Task | Task[]): void {
    const tasks = this._tasks.get(priority)
    if (!tasks) return
    
    if (Array.isArray(task)) {
      tasks.push(...task)
    } else {
      tasks.push(task)
    }
    
    if (!this._running) {
      this._running = true
      this.flush()
    }
  }
  
  private async flush(): Promise<void> {
    await Promise.resolve()
    
    for (const priority of SORTED_PRIORITIES) {
      const tasks = this._tasks.get(priority) || []
      const executableTasks = tasks.filter(t => this.canExecute(t))
      
      for (const task of executableTasks) {
        if (this.canExecute(task)) {
          task.execute()
        }
      }
      
      this._tasks.set(priority, tasks.filter(t => !this.canExecute(t) && !this.isDisposed(t)))
    }
    
    this._running = false
    
    const hasRemainingTasks = SORTED_PRIORITIES.some(priority => {
      const tasks = this._tasks.get(priority) || []
      return tasks.some(t => this.canExecute(t))
    })
    
    if (hasRemainingTasks) {
      this._running = true
      this.flush()
    }
  }
  
  private canExecute(task: Task): boolean {
    return !task.canExecute || task.canExecute()
  }
  
  private isDisposed(task: Task): boolean {
    return task.isDisposed ? task.isDisposed() : false
  }
  
  clearPriority(priority: Priority): void {
    this._tasks.set(priority, [])
  }
  
  clearAll(): void {
    for (const priority of SORTED_PRIORITIES) {
      this._tasks.set(priority, [])
    }
  }
  
  getTaskCount(priority?: Priority): number {
    if (priority) {
      return this._tasks.get(priority)?.length || 0
    }
    
    let total = 0
    for (const tasks of this._tasks.values()) {
      total += tasks.length
    }
    return total
  }
}

export const lazyRunner = new LazyRunner()

export default lazyRunner
