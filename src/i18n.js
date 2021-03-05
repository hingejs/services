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
    this._attributeFilters = new Set(['data-i18n', 'data-i18n-date', 'data-i18n-number', 'data-i18n-unsafe', 'data-i18n-placeholder'])
    this._decorators = new Map()
    this._localeId = null
    this._observer = null
    this._dictionary = new Map()
    this._loadBasePath = globalThis.location.origin
    this._loadPath = ''
    this._storage_key = 'i18nLocale'
    this._url_param_key = 'locale'
    this._pending = null
  }

  config({attributeMap, decorators, loadBasePath, loadPath, storageKey, urlParam}) {
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
    if(Array.isArray(decorators)) {
      decorators.forEach(({attr, config}) => {
        if(config.callback && this.isFunction(config.callback)) {
          this._decorators.set(attr, config)
          this._attributeFilters.add(attr)
        }
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
    let outputValue = ''
    if (/^[0-9]*$/.test(date)) {
      outputValue = Number(date)
    } else if (date && date.length && !window.isNaN(Date.parse(date))) {
      outputValue = date
    }
    if (outputValue.toString().length) {
      outputValue = new Date(outputValue).toLocaleDateString(lng, DATE_TIME_OPTIONS)
    }
    return outputValue
  }

  formatNumber(number, lng = this.localeId, options = {}) {
    return new Intl.NumberFormat(lng, options).format(number)
  }

  isFunction(f) {
    return typeof f === 'function'
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

  _translator(i18nKey) {
    const dictionary = this._dictionary.get(this.localeId)
    return dictionary && dictionary.hasOwnProperty(i18nKey) ? dictionary[i18nKey] : i18nKey
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
    this.translateDates().translateNumbers().translateDecorators()
  }

  translateDates() {
    const elements = Array.from(document.querySelectorAll('[data-i18n-date]'))
    elements.forEach(element => {
      const i18nKeyValue = element.dataset.i18nDate
      element.textContent = this.formatDateTime(this._translator(i18nKeyValue))
      this._ensureDirAttribute(element)
    })
    return this
  }

  translateNumbers() {
    const elements = Array.from(document.querySelectorAll('[data-i18n-number]'))
    elements.forEach(element => {
      const i18nKeyValue = element.dataset.i18nNumber
      element.textContent = this.formatNumber(this._translator(i18nKeyValue))
      this._ensureDirAttribute(element)
    })
    return this
  }

  translateDecorators() {
    this._decorators.forEach((config, attr) => {
      const {callback, unsafe = false} = config
      const elements = Array.from(document.querySelectorAll(`[${attr}]`))
      elements.forEach(element => {
        const i18nKey = element.getAttribute(attr)
        element[unsafe ? 'innerHTML' : 'textContent'] = callback(this._translator(i18nKey))
        this._ensureDirAttribute(element)
      })
    })
    return this
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
