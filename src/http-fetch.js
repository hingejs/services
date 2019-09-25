export default class HttpFetch {

  constructor(options = {}) {
    this.ensurePromiseAllSettledPolyFill()
    this.requestOptions = options
  }

  /* This should be removed when support for Promise.allSettled is normal */
  ensurePromiseAllSettledPolyFill() {
    if (typeof Promise.allSettled !== 'function') {
      Promise.allSettled = (iterable) => {
        return Promise.all(Array.from(iterable, item => {
          const onResolve = (value) => {
            return { status: 'fulfilled', value }
          }
          const onReject = (reason) => {
            return { status: 'rejected', reason }
          }
          try {
            const itemPromise = Promise.resolve(item)
            return itemPromise.then(onResolve, onReject)
          } catch (error) {
            return Promise.reject(error);
          }
        }))
      }
    }
  }

  async request({ body = null, params = null, url, method }) {
    const myHeaders = new Headers()
    method = method.toUpperCase()

    if (params && typeof params === 'object' && Object.keys(params).length) {
      url = this.constructor.addParamsToURL(url, params)
    }

    let options = Object.assign({}, { cache: 'default', method, mode: 'cors' }, this.requestOptions)
    options.body = body
    if (body && !(body instanceof FormData)) {
      options.body = JSON.stringify(body)
      myHeaders.set('Content-Type', 'application/json')
    }
    if (typeof this.requestOptions === 'object' && this.requestOptions.hasOwnProperty('headers')) {
      Object.entries(this.requestOptions.headers).forEach(([key, value]) => {
        myHeaders.set(key, value)
      })
    }
    options.headers = myHeaders

    return fetch(url, options)
  }

  async requestAll(requests, settled = true) {
    return Promise[settled ? 'allSettled' : 'all'](requests.map(async request => this.request(request)))
  }

  get(url, params = null) {
    return this.request({ params, url, method: 'GET' })
  }

  async getAll(requests, settled = true) {
    requests = requests.map(request => Object.assign({}, request, { method: 'GET' }))
    return this.requestAll(requests, settled)
  }

  post(url, body) {
    return this.request({ body, url, method: 'POST' })
  }

  put(url, body) {
    return this.request({ body, url, method: 'PUT' })
  }

  delete(url) {
    return this.request({ url, method: 'DELETE' })
  }

  static addParamsToURL(url, params = {}) {
    let result = url
    try {
      const pathURL = new URL(url)
      const searchParams = pathURL.searchParams
      Object.entries(params)
        .map(param => param.map(window.encodeURIComponent))
        .forEach(([key, value]) => {
          if (!searchParams.has(key)) {
            searchParams.append(key, value)
          }
        })
      result = `${pathURL.origin}${pathURL.pathname}?${searchParams.toString()}`
    } catch (error) {
      result = url
    }

    return result
  }

  static generateUrlParams(params = {}) {
    return `?${Object.entries(params).map(param => param.map(window.encodeURIComponent).join('=')).join('&')}`
  }

  static async toJSON(response) {
    let result = {}
    if (response instanceof Response) {
      const responseText = await response.clone().text()
      result = responseText.length ? JSON.parse(responseText) : {}
    }

    return result
  }
}
