import Observable from './observable.js'

const PREPARING = Symbol('PREPARING')
const READY = Symbol('READY')

export default class ReadyState extends Observable {

  constructor() {
    super()
    if (this.instance) {
      return this.instance
    }
    this.instance = this
    this._currentState = this.READY
  }

  get PREPARING() {
    return PREPARING
  }

  get READY() {
    return READY
  }

  get CurrentState() {
    return this._currentState
  }

  changeState(state) {
    if (this._currentState !== state && (state === this.PREPARING || state === this.READY)) {
      this._currentState = state
      this.notify(this._currentState)
    }
  }

  preparing() {
    this.changeState(this.PREPARING)
  }

  ready() {
    this.changeState(this.READY)
  }

}
