class Watch {

  constructor() {
    this.invokers = {}
  }

  register(obj, method, invoke) {
    const hash = this._generateHash(obj, method)
    if (!this.invokers.hasOwnProperty(hash)) {
      this.invokers[hash] = new Map()
      const original = obj[method]
      obj[method] = (...args) => {
        this.invokers[hash].forEach(invoke => invoke())
        return original.apply(obj, args)
      }
    }
    const uid = new Date().getTime().toString(36) + performance.now()
    if (typeof invoke === 'function') {
      this.invokers[hash].set(uid, invoke)
    }
    return { uid, unregister: this.invokers[hash].delete.bind(this.invokers[hash], uid) }
  }

  _generateHash(obj, method) {
    return window.btoa(obj.constructor.name + method)
  }

  clear(obj, method) {
    const hash = this._generateHash(obj, method)
    this.invokers[hash] = new Map()
  }

}

export default new Watch()
