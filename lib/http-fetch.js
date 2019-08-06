import Observable from './observable.js'
export default class HttpFetch extends Observable {

  constructor(requestHeaders = {}) {
    super()
    this.requestHeaders = requestHeaders
  }

  async _httpFetch(url, body, verb) {
    const myHeaders = new Headers()

    if (typeof this.requestHeaders === 'object') {
      Object.entries(this.requestHeaders).forEach(([key, value]) => {
        myHeaders.set(key, value)
      })
    }

    let myInit = { cache: 'default', method: verb, mode: 'cors' }
    myInit.body = body
    if (body && !(body instanceof FormData)) {
      myInit.body = JSON.stringify(body)
      myHeaders.set('Content-Type', 'application/json')
    }
    myInit.headers = myHeaders

    try {
      const response = await fetch(url, myInit)
      const responseText = await response.clone().text()
      const json = responseText.length ? JSON.parse(responseText) : {}
      if (response.ok) {
        this.notify(json)
      } else {
        this.notifyError(response)
      }
    } catch (error) {
      this.notifyError(error)
    }
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

  generateUrlParams(params = {}) {
    return `?${Object.entries(params).map(param => param.map(window.encodeURIComponent).join('=')).join('&')}`
  }

  get(url, params = null) {
    if (params) {
      url = this.constructor.addParamsToURL(url, params)
    }
    return {
      subscribe: f => {
        const unsubscribe = this.subscribe.call(this, f)
        this._httpFetch(url, null, 'GET')
        return unsubscribe
      }
    }
  }

  post(url, body) {
    return {
      subscribe: f => {
        const unsubscribe = this.subscribe.call(this, f)
        this._httpFetch(url, body, 'POST')
        return unsubscribe
      }
    }
  }

  put(url, body) {
    return {
      subscribe: f => {
        const unsubscribe = this.subscribe.call(this, f)
        this._httpFetch(url, body, 'PUT')
        return unsubscribe
      }
    }
  }

  delete(url) {
    return {
      subscribe: f => {
        const unsubscribe = this.subscribe.call(this, f)
        this._httpFetch(url, null, 'DELETE')
        return unsubscribe
      }
    }
  }

}
