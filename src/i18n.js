import Debounce from './debounce.js'

const DEFAULT_LOCALE = globalThis.navigator.language.split('-').shift()
const DEFAULT_DATE_TIME_OPTIONS = {
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  month: 'short',
  year: 'numeric'
}

class I18n {

  constructor() {
    this._attributeMap = [
      { attr: 'placeholder', selector: 'data-i18n-placeholder' },
    ]
    this._attributeFilters = new Set(['data-i18n', 'data-i18n-unsafe', 'data-i18n-placeholder'])
    this._localeId = null
    this._observer = null
    this._dictionary = new Map()
    this._loadBasePath = globalThis.location.origin
    this._loadPath = ''
    this._storage_key = 'i18nLocale'
    this._url_param_key = 'locale'
    this._pending = null
  }

  config({attributeMap, loadBasePath, loadPath, storageKey, urlParam}) {
    this._loadBasePath = loadBasePath || globalThis.location.origin
    this._loadPath = loadPath || ''
    this._storage_key = storageKey || 'i18nLocale'
    this._url_param_key = urlParam || 'locale'
    if(Array.isArray(attributeMap)) {
      attributeMap.filter(({selector}) => !this._attributeFilters.has(selector)).forEach(({attr, selector}) => {
        this._attributeMap.push({attr, selector})
        this._attributeFilters.add(selector)
      })
    }
  }

  get localeId() {
    return this._localeId
  }

  set localeId(id) {
    this._localeId = id
    globalThis.sessionStorage.setItem(this.STORAGE_KEY, this.localeId)
    document.documentElement.setAttribute('lang', this.localeId)
  }

  get loadPath() {
    return globalThis.decodeURIComponent(new URL(`${this._loadPath}/${this.localeId}.json`, this._loadBasePath))
  }

  get STORAGE_KEY() {
    return this._storage_key
  }

  get URL_PARAM_KEY() {
    return this._url_param_key
  }

  formatDateTime(date, lng = this.localeId, options = {}) {
    const DATE_TIME_OPTIONS = { ...DEFAULT_DATE_TIME_OPTIONS, ...options }
    return new Date(date).toLocaleDateString(lng, DATE_TIME_OPTIONS)
  }

  formatNumber(number, lng = this.localeId) {
    return new Intl.NumberFormat(lng).format(number)
  }

  initSessionLocale() {
    const searchParams = new URLSearchParams(globalThis.location.search)
    const locale = searchParams.get(this.URL_PARAM_KEY) || globalThis.sessionStorage.getItem(this.STORAGE_KEY)
    if (locale) {
      this.localeId = locale
    }
  }

  async init() {
    this.initSessionLocale()
    return this.setLocale(this.localeId)
  }

  /**
   * Sets the local based on a language key stored in session.
   */
  async setLocale(locale = null) {
    this.localeId = locale || DEFAULT_LOCALE

    this._pending = new Promise(async (resolve, reject) => {
      if (!this._dictionary.get(this.localeId)) {
        const response = await fetch(this.loadPath).catch(reject)
        let responseJSON = null
        if (response.ok) {
          responseJSON = await response.clone().json().catch(() => null)
        }
        if (null !== responseJSON) {
          this._dictionary.set(this.localeId, responseJSON)
        } else if (this.localeId !== DEFAULT_LOCALE) {
          await this.setLocale(DEFAULT_LOCALE)
        }
      }
      this.translatePage()
      resolve(this._translator.bind(this))
    })

    return this._pending
  }

  _translator(i18lKey) {
    const keys = this._dictionary.get(this.localeId)
    return keys && keys.hasOwnProperty(i18lKey) ? keys[i18lKey] : ''
  }

  setPageTitle(i18lKey) {
    const titleTag = document.head.querySelector('title')
    if (titleTag && i18lKey) {
      titleTag.dataset.i18n = i18lKey
    }
  }

  translateAttribute({ attr, selector }) {
    const elements = Array.from(document.querySelectorAll(`[${selector}]`))
    elements.forEach(element => {
      const attribute = element.getAttribute(selector)
      element.setAttribute(attr, this._translator(attribute))
      this._ensureDirAttribute(element)
    })
  }

  /* One way to do 'static' HTML page translations is with client-side code that scans for a data attribute.
     This is an alternative to performing the translations on the back end.
  */
  translatePage() {
    const elements = Array.from(document.querySelectorAll('[data-i18n]'))
    elements.forEach(element => {
      const i18nKey = element.dataset.i18n
      element.textContent = this._translator(i18nKey)
      this._ensureDirAttribute(element)
    })
    const elementsUnsafe = Array.from(document.querySelectorAll('[data-i18n-unsafe]'))
    elementsUnsafe.forEach(element => {
      const i18nKey = element.dataset.i18nUnsafe
      element.innerHTML = this._translator(i18nKey)
      this._ensureDirAttribute(element)
    })
    this._attributeMap.forEach(def => this.translateAttribute(def))
  }

  /* Ensure the text displayed is shown in the correct direction */
  _ensureDirAttribute(element) {
    if (!element.getAttribute('dir')) {
      element.setAttribute('dir', 'auto')
    }
  }

  async enableDocumentObserver() {
    if (!this.isObserverEnabled()) {
      await this.init()
      const observerConfig = { attributeFilter: [...this._attributeFilters], attributes: true, characterData: false, characterDataOldValue: false, childList: true, subtree: true }
      const translateDebounce = Debounce(() => {
        this._observer.disconnect()
        this.translatePage()
        this._observer.observe(document, observerConfig)
      })
      this._observer = new MutationObserver(translateDebounce.bind(this))
      this._observer.observe(document, observerConfig)
      this.translatePage()
    }
  }

  disconnectObserver() {
    if (this.isObserverEnabled()) {
      this._observer.disconnect()
    }
    this._observer = null
    return this
  }

  isObserverEnabled() {
    return this._observer instanceof MutationObserver
  }

}

export default new I18n()
