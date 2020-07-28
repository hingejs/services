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
    this.resetPayload()
  }

  /**
   * Reset the stored payload function to the default state/value
   */
  resetPayload() {
    this._payload = null
    this._mutatedPayload = this.observe({data: null})
    Object.seal(this._mutatedPayload)
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


   deepMerge(...args) {
    let target = {};
    const isObject = (variable) => Object.prototype.toString.call(variable) === '[object Object]'

    // Merge the object into the target object
    let merger = (obj) => {
        for (let prop in obj) {
          if (obj.hasOwnProperty(prop)) {
            if (isObject(obj[prop])){
              // If we're doing a deep merge
              // and the property is an object
              target[prop] = merge(target[prop], obj[prop]);
            } else {
              // Otherwise, do a regular merge
              target[prop] = obj[prop];
            }
           }
        }
    };
     //Loop through each object and conduct a merge
     for (let i = 0; i < args.length; i++) {
        merger(args[i]);
     }
       return target;
  };


  observe(obj) {
    const debounceModelUpdate = Debounce((...args) => {
      this.notify(...args)
      this.ReadyState.ready()
    })
      const handler = {
        get: (target, prop) => {
            // get the value of the property
            const value = target[prop];
            if (!value) {
              return '' // return empty string instead of null/undefined
            }
            if (typeof value === 'object') {
              // if the target is also an object, proxy that too
              return new Proxy(target[prop], handler)
            }
            return value; // it's not null and not an object, return it
          },
        set: (target, prop, newValue) => {
          if (target[prop] !== newValue) {
            target[prop] = newValue
            debounceModelUpdate(obj.data)
          }
          return true
        }
      }
      return new Proxy(obj, handler)
  }

}
