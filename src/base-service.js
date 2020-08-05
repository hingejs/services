import Debounce from './debounce.js'
import Observable from './observable.js'
import ReadyState from './ready-state.js'
export default class BaseService extends Observable {

  constructor() {
    super()
    if (this.instance) {
      return this.instance
    }
    this.instance = this
    this.ReadyState = new ReadyState()
    this._subjectModel = this.observe({ data: this.defaultModel })
    Object.seal(this._subjectModel)
    this.resetPayload()
  }

  /**
   * Reset the stored payload function to the default state/value
   */
  resetPayload() {
    this._payload = null
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

  get model() {
    return this._subjectModel.data
  }

  set model(value) {
    this._subjectModel.data = value
  }

  get defaultModel() {
    return {}
  }

  resetModel() {
    this.model = this.defaultModel
    return this
  }

  //work on getting this to be the way to update the model payload
  updateModel(...args) {
    const target = {}
    const isObject = (variable) => Object.prototype.toString.call(variable) === '[object Object]'

    // Merge the object into the target object
    const merger = (obj) => {
      Object.entries(obj).forEach(([prop, value]) => {
          target[prop] = isObject(value) ? merge(target[prop], value) : value
      })
    }
    //Loop through each object and conduct a merge
    args.unshift(this.model)
    args.filter(objArg => undefined !== objArg).forEach(arg => merger(arg))
    this.model = target
  }

  observe(obj, key = 'data') {
    const debounceModelUpdate = Debounce((...args) => {
      this.notify(...args)
      this.ReadyState.ready()
    })
    const handler = {
      get: (target, prop) => {
        const value = target[prop]
        if (!value) {
          return '' /* return empty string instead of null/undefined */
        }
        const isObject = variable => Object.prototype.toString.call(variable) === '[object Object]'
        if (isObject(value)) {
          return new Proxy(target[prop], handler)
        }
        return value /* it's not null and not an object, return it */
      },
      set: (target, prop, newValue) => {
        if (JSON.stringify(target[prop]) !== JSON.stringify(newValue)) {
          target[prop] = newValue
          debounceModelUpdate(obj[key])
        }
        return true
      }
    }
    return new Proxy(obj, handler)
  }

}
