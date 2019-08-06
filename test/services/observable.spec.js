import { Observable } from '../../index.js'

describe('Observable', () => {

  const expect = chai.expect

  describe('functions', () => {

    it('should allow you to subscribe', async () => {
      const observable = new Observable()
      const subscription = observable.subscribe({
        complete: () => { },
        error: () => { },
        next: () => { }
      })
      expect(observable.observers.size).to.be.above(0)
      subscription.unsubscribe()
    })

    it('should reset on complete', async () => {
      const observable = new Observable()
      const subscription = observable.subscribe({
        complete: () => { },
        error: () => { },
        next: () => { }
      })
      observable.complete()
      expect(observable.observers).to.be.empty
      subscription.unsubscribe()
    })

    it('should notify subscribers', async () => {
      const observable = new Observable()
      const subscription = observable.subscribe({
        complete: () => { },
        error: () => { },
        next: (msg) => { expect(msg).to.equal('test') }
      })
      observable.notify('test')
      subscription.unsubscribe()
    })

    it('should notify subscribers of an error', async () => {
      const observable = new Observable()
      const subscription = observable.subscribe({
        complete: () => { },
        error: (msg) => { expect(msg).to.equal('test') },
        next: () => { }
      })
      observable.notifyError('test')
      subscription.unsubscribe()
    })

  })
})
