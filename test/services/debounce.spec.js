import { Debounce } from 'services'

describe('Debounce', () => {

  const assert = sinon.assert

  describe('functions', () => {

    it('should wait 50 milliseconds to run a function', (done) => {
      const wait = Debounce(() => {
        done()
      })
      wait()
    })

    it('should cancel first call if called within 50 milliseconds', (done) => {
      const subscribeSpy = sinon.spy()
      const wait = Debounce(subscribeSpy)
      wait()
      wait()
      assert.notCalled(subscribeSpy)
      setTimeout(()=> {
        assert.calledOnce(subscribeSpy)
        done()
      }, 1000)
    })

  })

})
