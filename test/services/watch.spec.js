import { Watch } from 'services'

class Test {
  test(...arg) {
      return arg
  }
}

describe('Watch', () => {

  const expect = chai.expect
  const testClass = new Test()
  const METHOD_KEY = 'test'

  afterEach(() => {
    Watch.clear(METHOD_KEY)
  })

  describe('functions', () => {

    it('should allow you to register', (done) => {
      let notUpdated = true
      Watch.register(testClass, METHOD_KEY, () => {
        notUpdated = false
      })
      Watch.register(testClass, METHOD_KEY, () => {
        expect(notUpdated).to.be.false
        done()
      })
      testClass.test()
    })

    it('should allow you to unregister', () => {
      let notUpdated = true
      const watcher = Watch.register(testClass, METHOD_KEY, () => {
        notUpdated = false
      })
      watcher.unregister()
      testClass.test()
      expect(notUpdated).to.be.true
    })

  })
})
