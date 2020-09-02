export default class Observable {

  constructor() {
    this.reset()
  }

  reset() {
    this.observers = new Map()
    this.errors = new Map()
    this.completes = new Map()
    this.counter = new Map()
    this.maxLife = new Map()
    this._currentSubject = undefined
  }

  isFunction(f) {
    return typeof f === 'function'
  }

  subscribe(f) {
    let complete, error, next = f
    if (!this.isFunction(f)) {
      ({ next, error, complete } = f)
    }
    const uid = new Date().getTime().toString(36) + performance.now().toString().replace(/[^0-9]/g, '')
    if (this.isFunction(next)) {
      const nextModified = (...subjects) => {
        const count = ~~this.counter.get(uid) + 1
        this.counter.set(uid, count)
        next.apply(null, subjects)
        this.only(uid)
      }
      this.observers.set(uid, nextModified)
      this.counter.set(uid, 0)
      if(undefined !== this._currentSubject) {
        nextModified.apply(null, this._currentSubject)
      }
    }
    if (this.isFunction(error)) {
      this.errors.set(uid, error)
    }
    if (this.isFunction(complete)) {
      this.completes.set(uid, complete)
    }
    const methods = {
      only: (times) => {
        this.only(uid, times)
        return methods
      },
      uid,
      unsubscribe: this.unsubscribe.bind(this, uid),
    }

    return methods
  }

  unsubscribe(uid) {
    const complete = this.completes.get(uid)
    if (this.isFunction(complete)) {
      complete()
    }
    this.observers.delete(uid)
    this.errors.delete(uid)
    this.completes.delete(uid)
    this.counter.delete(uid)
    this.maxLife.delete(uid)
  }

  complete() {
    this.completes.forEach(observer => observer())
    this.reset()
  }

  notify() {
    const subject = Array.from(arguments)
    this._currentSubject = subject
    this.observers.forEach(observer => observer.apply(null, subject))
  }

  notifyError() {
    const subject = Array.from(arguments)
    this.errors.forEach(observer => observer.apply(null, subject))
  }

  /**
   * The maximum number of times to notify
   * @param {string} uid - subscription id
   * @param {number} times - max number, must be greater than zero(0)
   */
  only(uid, times) {
    if (!isNaN(times) && times > 0) {
      this.maxLife.set(uid, times)
    }
    if (this.maxLife.has(uid)) {
      const maxCount = ~~this.maxLife.get(uid)
      const count = ~~this.counter.get(uid)
      if (maxCount > 0 && count >= maxCount) {
        this.unsubscribe(uid)
      }
    }
  }
}
