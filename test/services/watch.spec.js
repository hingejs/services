import { Watch } from 'services'

class Test {
  test(...arg) {
      return arg
  }
}

class Test2 {
  test(...arg) {
      return arg
  }
}

describe('Watch', () => {

  const expect = chai.expect
  const testClass = new Test()
  const testClass2 = new Test2()
  const METHOD_KEY = 'test'

  afterEach(() => {
    Watch.clear(testClass, METHOD_KEY)
    Watch.clear(testClass2, METHOD_KEY)
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

    it('should allow you to register and unregister with the same method but different objects', () => {
      let notUpdated = true
      let notUpdated2 = true
      Watch.register(testClass, METHOD_KEY, () => {
        notUpdated = false
      })
      Watch.register(testClass2, METHOD_KEY, () => {
        notUpdated2 = false
      })
      testClass.test()
      expect(notUpdated).to.be.false
      expect(notUpdated2).to.be.true
    })

  })
})
