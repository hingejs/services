const PARAM_REGEX = /[:](\w+)/
class Router {

  constructor() {
    if (this.instance) {
      return this.instance
    }
    this.instance = this
    this._paths = new Map()
    this._allPathHandlers = new Set()
    this._basePath = window.location.origin
    this._currentHistoryState = ''
    this._canExitFn = null
    this._exitFn = null
    this.lastRoutePath = window.sessionStorage.getItem('last-route-path') || ''
    this.historyChangeBind = this.historyChange.bind(this)
    this.routeChangeEventName = 'route-change'
    window.addEventListener('popstate', this.historyChangeBind)
    this.$defaultPath = ''

    const path = this.urlFullPath()
    window.addEventListener('load', this.goto.bind(this, path))
  }

  set routeChangeEventName(eventName) {
    if(eventName.length) {
      window.removeEventListener(this._routeChangeEventName, this.historyChangeBind)
      this._routeChangeEventName = eventName
      window.addEventListener(this._routeChangeEventName, this.historyChangeBind)
    }
  }

  getCurrentPath() {
    return window.decodeURIComponent(window.location.pathname)
  }

  getRoute() {
    const currentPath = this.getAdjustedPath(this.getCurrentPath())
    return [...this._paths.keys()]
      .map(this.fromBase64.bind(this))
      .find(routeRE => this._pathToRegex(routeRE).test(currentPath))
  }

  getAdjustedPath(path = '') {
    return path.trim() === '/' ? path : path.trim().split('/')
      .filter(pathName => pathName.length)
      .join('/')
  }

  _safeDefaultPath() {
    let safePath = ''
    if (this.$defaultPath === '/') {
      safePath = this.$defaultPath
    } else if (this.$defaultPath) {
      safePath = this.$defaultPath.split('/').shift().replace(/[^\w]/g, '')
    }
    return safePath
  }

  _defaultPathOption() {
    const safePath = this._safeDefaultPath()
    return this.$defaultPath ? this._pathToRegex(this.$defaultPath).test(safePath) : false
  }

  async historyChange() {
    if (this.isFunction(this._canExitFn)) {
      const canExit = await this._canExitFn()

      if (!canExit) {
        if(window.history.state !== this._currentHistoryState) {
          window.history.pushState(this._currentHistoryState, document.title, this._currentHistoryState)
        }
        return
      } else {
        this._canExitFn = null
      }
    }

    if (this.isFunction(this._exitFn)) {
      await this._exitFn()
    }
    this._exitFn = null

    const route = this.getRoute()
    if ((!route || !this.hasPath(route)) && this._defaultPathOption()) {
      this.goto(this._safeDefaultPath())
    }

    const fullPath = window.decodeURIComponent(this.urlFullPath())
    if (this.lastRoutePath !== fullPath) {
      window.sessionStorage.setItem('last-route-path', this.lastRoutePath)
    }
    this.lastRoutePath = fullPath

    const handlers = this.getPath(route)
    const req = {
      canExit: this._canExit.bind(this),
      exit: this._exit.bind(this),
      params: this._pathParams(route),
      route,
      search: new URLSearchParams(window.location.search)
    }
    const pipeNext = callbacks => {
      if (Array.isArray(callbacks) && callbacks.length) {
        const next = callbacks.shift()
        if (this.isFunction(next)) {
          next(req, pipeNext.bind(this, callbacks))
        }
      }
    }
    if (Array.isArray(handlers)) {
      const allHandlers = [...this._allPathHandlers].concat(handlers)
      pipeNext(allHandlers.slice())
    }
    this._currentHistoryState = window.history.state
  }

  get basePath() {
    return this._basePath
  }

  goto(path, title = '') {
    window.history.pushState(path, title, `${this.basePath}${this.urlFullPath(path)}`)
    window.dispatchEvent(new CustomEvent(this._routeChangeEventName, { detail: path }))
    return this
  }

  urlFullPath(path = window.location.href) {
    return this.urlPathname(path) + this.urlHash(path) + this.urlParams(path)
  }

  urlPathname(path) {
    return new URL(path, this.basePath).pathname
  }

  urlHash(path) {
    return new URL(path, this.basePath).hash
  }

  urlParams(path) {
    const pathURL = Array.from(new URL(path, this.basePath).searchParams.entries())
    const searchParams = new URLSearchParams(window.location.search)
    pathURL.forEach(([key, value]) => {
      if (!searchParams.has(key)) {
        searchParams.append(key, value)
      }
    })
    const params = searchParams.toString()
    return params.length ? `?${params}` : ''
  }

  toBase64(str) {
    return window.btoa(window.unescape(window.encodeURIComponent(str)))
  }

  fromBase64(str) {
    return window.decodeURIComponent(window.escape(window.atob(str)))
  }

  setPath(path, ...callbacks) {
    path = this.getAdjustedPath(path)
    if (path.length) {
      this._paths.set(this.toBase64(path), callbacks)
    }
    return this
  }

  defaultPath(path) {
    path = this.getAdjustedPath(path)
    if (path.length) {
      this.$defaultPath = path
    }
    return this
  }

  getPath(path) {
    return this._paths.get(this.toBase64(path))
  }

  hasPath(path) {
    return this._paths.has(this.toBase64(path))
  }

  reload() {
    this.goto(this.urlFullPath())
  }

  _exit(fn) {
    this._exitFn = fn
  }

  _canExit(fn) {
    this._canExitFn = fn
  }

  _pathToRegex(path = '') {
    const pattern = this.getAdjustedPath(path).split('/')
      .filter(pathName => pathName.length)
      .map(pathName => PARAM_REGEX.test(pathName) ? `([\\w\\s&!$*:\\-+]+)${pathName.includes('?') ? '?' : ''}` : pathName)
      .join('/?')
    return new RegExp(`^/?${pattern || '/'}/?$`)
  }

  _pathParams(path = '') {
    const PARAM_REGEX_GLOBAL = new RegExp(PARAM_REGEX, 'g')
    const matches = path.match(PARAM_REGEX_GLOBAL)
    const currentPath = this.getAdjustedPath(this.getCurrentPath())
    const routeParams = currentPath.match(this._pathToRegex(path))
    const params = new Map()
    if (matches && routeParams) {
      routeParams.shift()
      matches.map(param => param.replace(':', '')).forEach(param => {
        params.set(param, routeParams.shift())
      })
    }
    return params
  }

  removeURLSearchParams() {
    window.history.replaceState({}, document.title, window.location.pathname)
  }

  updateURLSearchParams(params = {}) {
    const searchParams = new URLSearchParams(window.location.search)

    Object.entries(params)
      .map(param => param.map(window.encodeURIComponent))
      .forEach(([key, value]) => {
        if (searchParams.has(key)) {
          searchParams.delete(key)
        }
        searchParams.append(key, value)
      })
    const finalParams = searchParams.toString()
    window.history.pushState({}, document.title, `${this.getCurrentPath()}?${finalParams}`)
    return this
  }


  /**
   * Executes for all routes as pre-middleware
   * @param {function} fn (req, next) => { }
   */
  use(fn) {
    if(this.isFunction(fn)) {
      this._allPathHandlers.add(fn)
    }
  }

  isFunction(f) {
    return typeof f === 'function'
  }

  async customElementsReady(req, next) {
    const undefinedElements = document.querySelectorAll(':not(:defined)')
    const warnUser = window.setTimeout(() => {
      const remaining = [...document.querySelectorAll(':not(:defined)')]
        .map(elem => elem.localName)
        .join()
      throw new Error(`Timeout: Custom Elements are not defined. ${remaining}`)
    }, 5000)
    await Promise.all([...undefinedElements].map(
      elem => window.customElements.whenDefined(elem.localName)
    ))
    window.clearTimeout(warnUser)
    next()
  }

}

export default new Router()
