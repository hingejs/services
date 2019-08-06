class FetchInterceptor {

  constructor() {
    this.interceptors = new Map()
    window.fetch = (fetch => (...args) => this.interceptor(fetch, ...args))(window.fetch)
  }

  register(interceptFunctions) {
    const uid = new Date().getTime().toString(36) + performance.now()
    this.interceptors.set(uid, interceptFunctions)
    return { unregister: this.unregister.bind(this, uid) }
  }

  unregister(uid) {
    this.interceptors.delete(uid)
  }

  clear() {
    this.interceptors = new Map()
  }

  interceptor(fetch, ...args) {
    let promise = Promise.resolve(args)

    /* Register request interceptors */
    this.interceptors.forEach(({ request, requestError }) => {
      if (request || requestError) {
        promise = promise.then(args => request(...args), requestError)
      }
    })

    /* Register fetch call */
    promise = promise.then(args => fetch(...args))

    /* Register response interceptors */
    this.interceptors.forEach(({ response, responseError }) => {
      if (response || responseError) {
        promise = promise.then(response, responseError)
      }
    })

    return promise
  }

}

export default new FetchInterceptor()
