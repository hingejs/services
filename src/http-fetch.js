export default class HttpFetch {

  constructor(options = {}) {
    this.ensurePromiseAllSettledPolyFill()
    this.requestOptions = options
  }

  async request({ body = null, params = null, url, method }) {
    const myHeaders = new Headers()
    method = method.toUpperCase()

    if (params && typeof params === 'object' && Object.keys(params).length) {
      url = this.constructor.addParamsToURL(url, params)
    }

    let options = { cache: 'default', method, mode: 'cors', ...this.requestOptions}
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

  /* This should be removed when support for Promise.allSettled is normal */
  ensurePromiseAllSettledPolyFill() {
    if (typeof Promise.allSettled !== 'function') {
      Promise.allSettled = (iterable) => {
        return Promise.all(Array.from(iterable, element => {
          const onResolve = (value) => {
            return { status: 'fulfilled', value }
          }
          const onReject = (reason) => {
            return { reason, status: 'rejected' }
          }
          try {
            const itemPromise = Promise.resolve(element)
            return itemPromise.then(onResolve, onReject)
          } catch (error) {
            return Promise.reject(error)
          }
        }))
      }
    }
  }

  async requestAll(requests, settled = true) {
    return Promise[settled ? 'allSettled' : 'all'](requests.map(async request => this.request(request)))
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

  static async toJSON(response) {
    let result = {}

    if (response instanceof Response) {
      const responseText = await response.clone().text()
      result = responseText.length ? JSON.parse(responseText) : {}
    }

    return result
  }

  static generateUrlParams(params = {}) {
    return `?${Object.entries(params).map(param => param.map(window.encodeURIComponent).join('=')).join('&')}`
  }

  get(url, params = null) {
    return this.request({ method: 'GET', params, url })
  }

  async getAll(requests, settled = true) {
    requests = requests.map(request => ({ ...request, method: 'GET'}))
    return this.requestAll(requests, settled)
  }

  post(url, body) {
    return this.request({ body, method: 'POST', url })
  }

  put(url, body) {
    return this.request({ body, method: 'PUT', url })
  }

  delete(url) {
    return this.request({ method: 'DELETE', url })
  }
}
