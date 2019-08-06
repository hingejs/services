class RouterService {

    constructor() {
      if (this.instance) {
        return this.instance
      }
      this.instance = this
      this._paths = new Map()
      this._basePath = window.location.origin
      this._exitFn = null
      this.paramRegex = /[:](\w+)/
      this.lastRoutePath = window.sessionStorage.getItem('last-route-path') || ''
      this.historyChangeBind = this.historyChange.bind(this)
      window.addEventListener('url-change', this.historyChangeBind)
      window.addEventListener('popstate', this.historyChangeBind)
      this.$routeDisplay = document.querySelector('route-display')
      this.$defaultPath

      const path = this.urlFullPath()
      window.addEventListener('load', this.goto.bind(this, path))
    }

    getCurrentPath() {
      return window.decodeURIComponent(window.location.pathname)
    }

    getRoute() {
      let currentPath = this.getAdjustedPath(this.getCurrentPath())
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

    historyChange() {
      if (typeof this._exitFn === 'function') {
        this._exitFn()
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

      let handlers = this.getPath(route)
      let req = {
        addElementToDisplay: this._addElementToDisplay.bind(this),
        exit: this._exit.bind(this),
        load: this._load.bind(this),
        params: this._pathParams(route),
        search: new URLSearchParams(window.location.search)
      }
      const pipeNext = callbacks => {
        if (Array.isArray(callbacks) && callbacks.length) {
          const next = callbacks.shift()
          if (typeof next === 'function') {
            next(req, pipeNext.bind(this, callbacks))
          }
        }
      }
      if (Array.isArray(handlers)) {
        pipeNext(handlers.slice())
      }
    }

    get basePath() {
      return this._basePath
    }

    goto(path, title = '') {
      window.history.pushState(path, title, `${this.basePath}${this.urlFullPath(path)}`)
      window.dispatchEvent(new CustomEvent('url-change', { detail: path }))
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

    defaultPath(path, ...callbacks) {
      path = this.getAdjustedPath(path)
      if (path.length) {
        this.$defaultPath = path
        this.setPath(this.$defaultPath, ...callbacks)
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

    async _load(content) {
      if (document.body.contains(this.$routeDisplay)) {
        await this.$routeDisplay.insertContent(content)
      }
      return Promise.resolve(this)
    }

    _addElementToDisplay(element, position) {
      this.$routeDisplay.addElementToContent(element, position)
    }

    _exit(fn) {
      this._exitFn = fn
    }

    _pathToRegex(path = '') {
      const pattern = this.getAdjustedPath(path).split('/')
        .filter(pathName => pathName.length)
        .map(pathName => this.paramRegex.test(pathName) ? `([\\w\\s&!$*:\\-+]+)${pathName.includes('?') ? '?' : ''}` : pathName)
        .join('/?')
      return new RegExp(`^/?${pattern || '/'}/?$`)
    }

    _pathParams(path = '') {
      const paramRegexGlobal = /[:](\w+)/g
      const matches = path.match(paramRegexGlobal)
      const currentPath = this.getAdjustedPath(this.getCurrentPath())
      const routeParams = currentPath.match(this._pathToRegex(path))
      let params = new Map()
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
  }

  export default new RouterService()
