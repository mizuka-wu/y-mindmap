export class StateMachine {
  transitionMap: Map<any, any>;
  stateMap: Map<any, any>;
  eventMap: Map<any, any>;
  stateBase: number;
  eventBase: number;
  curState: { ID: number; name: string };
  constructor() {
    this.transitionMap = new Map();
    this.stateMap = new Map();
    this.eventMap = new Map();
    this.stateBase = 0;
    this.eventBase = 0;
    this.curState = this.newState();
  }
  setCurrentState(state) {
    this.curState = state;
  }
  getCurrentState() {
    return this.curState;
  }
  transition(event) {
    let _a;
    if (!this.transitionMap.has(this.curState.ID)) {
      return;
    }
    if (
      !((_a = this.transitionMap.get(this.curState.ID)) === null ||
      _a === undefined
        ? undefined
        : _a.has(event.ID))
    ) {
      return;
    }
    const transInfo = this.transitionMap.get(this.curState.ID).get(event.ID);
    const destStateID = transInfo.ID;
    const destState = this.stateMap.get(destStateID);
    const callback = transInfo.callback;
    callback(this.curState, destState);
    this.curState = destState;
  }
  addTransition(sourceState, event, destState, callback) {
    const trans = this.transitionMap.has(sourceState.ID)
      ? this.transitionMap.get(sourceState.ID)
      : new Map();
    trans.set(event.ID, {
      ID: destState.ID,
      callback: callback,
    });
    this.transitionMap.set(sourceState.ID, trans);
  }
  newEvent(name = "AStateMachineEvent") {
    const event = {
      ID: ++this.eventBase,
      name: name,
    };
    this.eventMap.set(event.ID, event);
    return event;
  }
  newState(name = "AStateMachineState") {
    const state = {
      ID: ++this.stateBase,
      name: name,
    };
    this.stateMap.set(state.ID, state);
    return state;
  }
}
