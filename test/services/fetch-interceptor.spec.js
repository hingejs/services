import { FetchInterceptor } from '../../index.js'

describe('FetchInterceptor', () => {

  const expect = chai.expect

  beforeEach(() => {
    FetchInterceptor.clear()
  })

  describe('functions', () => {

    it('should intercept fetch calls', (done) => {
      let requestIntercepted = false
      let responseIntercepted = false

      FetchInterceptor.register({
        request: (url, config) => {
          requestIntercepted = true
          return [url, config]
        },
        response: response => {
          responseIntercepted = true
          return response
        }
      })

      fetch('http://example.com/', {
        mode: 'no-cors'
      }).then(() => {
        expect(requestIntercepted).to.be.true
        expect(responseIntercepted).to.be.true
        done()
      })

    })

    it('should clear registered interceptor functions', () => {

      FetchInterceptor.register({
        request: (url, config) => {
          return [url, config]
        },
        response: response => {
          return response
        }
      })

      FetchInterceptor.clear()
      expect(FetchInterceptor.interceptors.size).to.equal(0)

    })

    it('should allow registered interceptor to unregister', () => {

      const subscription = FetchInterceptor.register({
        request: (url, config) => {
          return [url, config]
        },
        response: response => {
          return response
        }
      })

      subscription.unregister()
      expect(FetchInterceptor.interceptors.size).to.equal(0)

    })

    it('should intercept response errors', (done) => {
      let responseInterceptedError = false

      FetchInterceptor.register({
        responseError: error => {
          responseInterceptedError = true
          return Promise.reject(error)
        }
      })

      fetch('http://404', {
        mode: 'no-cors'
      }).catch(() => {
        expect(responseInterceptedError).to.be.true
        done()
      })

    })

    it('should intercept request errors', (done) => {
      let requestInterceptedError = false

      FetchInterceptor.register({
        request: () => {
          throw new Error('Error')
        }
      })
      FetchInterceptor.register({
        requestError: error => {
          requestInterceptedError = true
          return Promise.reject(error)
        }
      })

      fetch('http://example.com/', {
        mode: 'no-cors'
      }).catch(() => {
        expect(requestInterceptedError).to.be.true
        done()
      })

    })

  })

})
