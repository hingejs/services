export default class Observable {

  constructor() {
    this.observers = new Map()
    this.errors = new Map()
    this.completes = new Map()
  }

  subscribe(f) {
    let complete, error, next = f
    if (typeof f !== 'function') {
      ({ next, error, complete } = f)
    }
    const uid = new Date().getTime().toString(36) + performance.now().toString().replace(/[^0-9]/g, '')
    if (next) {
      this.observers.set(uid, next)
    }
    if (error) {
      this.errors.set(uid, error)
    }
    if (complete) {
      this.completes.set(uid, complete)
    }
    return { uid, unsubscribe: this.unsubscribe.bind(this, uid) }
  }

  unsubscribe(uid) {
    this.observers.delete(uid)
    this.errors.delete(uid)
  }

  complete() {
    this.completes.forEach(observer => observer())
    this.observers = new Map()
    this.errors = new Map()
    this.completes = new Map()
  }

  notify(msg) {
    this.observers.forEach(observer => observer(msg))
  }

  notifyError(msg) {
    this.errors.forEach(observer => observer(msg))
  }

}
