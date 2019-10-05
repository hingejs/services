class Watch {

  constructor() {
    if (this.instance) {
      return this.instance
    }
    this.instance = this
    this.watchers = {}
  }

  register(obj, method, invoke) {
      if(!this.watchers.hasOwnProperty(method)) {
          this.watchers[method] = new Map()
          const original = obj[method]
          obj[method] = (...args) => {
              this.watchers[method].forEach(invoke => invoke())
              return original.apply(obj, args)
          }
      }
      const uid = new Date().getTime().toString(36) + performance.now()
      if (typeof invoke === 'function') {
          this.watchers[method].set(uid, invoke)
      }
    return { unregister: this.unregister.bind(this, method, uid) }
  }

  unregister(method, uid) {
    this.watchers[method].delete(uid)
  }

  clear(method) {
    this.watchers[method] = {}
  }

}

export default new Watch()
