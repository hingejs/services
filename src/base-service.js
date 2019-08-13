import Observable from './observable.js'
export default class BaseService extends Observable {

  constructor() {
    super()
    if (this.instance) {
      return this.instance
    }
    this.instance = this
    this._payload
    this._mutatedPayload
  }

  /**
   * Sends out data to registered callback functions
   */
  announcePayload() {
    this.notify(this._mutatedPayload)
  }

  /**
   * Reset the stored payload function to the default state/value
   */
  resetPayload() {
    this._payload = null
    this._mutatedPayload = null
    return this
  }

  _isNewPayload(payload) {
    return !!(JSON.stringify(payload) !== JSON.stringify(this._payload))
  }

  _modelPayload(payload) {
    let model = []
    model = Array.from(payload)
    return model
  }

  subscribe(f) {
    const subscription = super.subscribe(f)
    if(this._mutatedPayload) {
      const next = this.observers.get(subscription.uid)
      if(next) {
        next(this._mutatedPayload)
      }
    }
    return subscription
  }

}
