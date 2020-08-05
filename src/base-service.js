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
    this._pipeModel = new Set()
    this._subjectModel = this.defaultModel
    Object.seal(this._subjectModel)
  }

  _isObject(variable) {
    return variable instanceof Object
  }

  get model() {
    return this._subjectModel
  }

  set model(value) {
    if (this._isObject(value)) {
      const target = JSON.parse(JSON.stringify(this._subjectModel))
      this._subjectModel = value
      //const pipeReduce = (prevMessage, curr) => prevMessage ? prevMessage : curr(target)
      //target = [...this._pipeModel].reduce(pipeReduce, '')
      if (JSON.stringify(target) !== JSON.stringify(value)) {
        this.notify(this.model)
        this.ReadyState.ready()
      }
    }
  }

  get defaultModel() {
    return {}
  }

  resetModel() {
    this.model = this.defaultModel
    return this
  }


  _objectMerger(...args) {
    const target = {}
    // Merge the object into the target object
    const merger = (obj) => {
      Object.entries(obj).map(([prop, value]) => {
        target[prop] = this._isObject(value) ? this._objectMerger(target[prop], value) : value
      })
    }
    //Loop through each object and conduct a merge
    args.filter(objArg => this._isObject(objArg)).forEach(arg => merger(arg))
    return target
  }

  updateModel(...args) {
    args.unshift(this.model)
    const target = this._objectMerger(...args)
     console.log('target merged', target)
    this.model = target
  }

}
