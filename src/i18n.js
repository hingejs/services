import Debounce from './debounce.js'

const DEFAULT_LOCALE = window.navigator.language.split('-').shift()
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
      { attr: 'data-caption', selector: 'data-i18n-caption' },
      { attr: 'placeholder', selector: 'data-i18n-placeholder' },
    ]
    this._attributeFilters = new Set(['data-i18n', 'data-i18n-unsafe', 'data-i18n-placeholder', 'data-i18n-caption'])
    this._localeId = null
    this._observer = null
    this._dictionary = new Map()
    const pathRegex = new RegExp(/^.*\//)
    this._initialBasePath = pathRegex.exec(window.location.href)[0] || ''
    this._loadPath = this._initialBasePath + 'assets/locales/${lang}.json'
  }

  get localeId() {
    return this._localeId
  }

  set localeId(id) {
    this._localeId = id
  }

  get loadPath() {
    return this._interpolate({
      params: { lang: this.localeId },
      template: this._loadPath
    })
  }

  set loadPath(url) {
    this._loadPath = url
  }

  formatDateTime(date, lng = this.localeId, options = {}) {
    const DATE_TIME_OPTIONS = { ...DEFAULT_DATE_TIME_OPTIONS, ...options }
    return new Date(date).toLocaleDateString(lng, DATE_TIME_OPTIONS)
  }

  formatNumber(number, lng = this.localeId) {
    return new Intl.NumberFormat(lng).format(number)
  }

  _interpolate({ params, template }) {
    const keys = Object.keys(params)
    let keyValues = Object.values(params)
    return new Function(...keys, `return \`${template}\``)(...keyValues)
  }

  initSessionLocale() {
    const searchParams = new URLSearchParams(window.location.search)
    const locale = searchParams.get('locale')
    if (locale) {
      window.sessionStorage.setItem('locale', locale)
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
    if (!locale) {
      locale = window.sessionStorage.getItem('locale') || DEFAULT_LOCALE
    }
    const previousLocaleId = this.localeId
    if (this.localeId !== locale) {
      this.localeId = locale
    }
    if (!this._dictionary.has(this.localeId)) {
      const response = await fetch(this.loadPath)
      if (response.ok) {
        const responseJSON = await response.clone().json()
        this._dictionary.set(this.localeId, responseJSON)
      } else {
        this.localeId = previousLocaleId
        return response
      }
    }

    if (previousLocaleId !== this.localeId && this._dictionary.has(this.localeId)) {
      window.sessionStorage.setItem('locale', this.localeId)
      document.documentElement.setAttribute('lang', this.localeId)
      this.translatePage()
    }
    return this._translator
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
    if(!element.getAttribute('dir')){
      element.setAttribute('dir', 'auto')
    }
  }

  async enableDocumentObserver() {
    if (!this._observer) {
      await this.init()
      const observerConfig = { attributeFilter: [...this._attributeFilters], attributes: true, characterData: false, characterDataOldValue: false, childList: true, subtree: true }
      const translateDebounce = Debounce(() => {
        this._observer.disconnect()
        this.translatePage()
        this._observer.observe(document, observerConfig)
        this._observer = new MutationObserver(translateDebounce.bind(this))
        this._observer.observe(document, observerConfig)
        translateDebounce()
      })
    }
  }

}

export default new I18n()
