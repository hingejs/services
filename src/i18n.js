import Backend from '../node_modules/i18next-xhr-backend/index.js'
import Debounce from './debounce.js'
import i18next from '../node_modules/i18next/index.js'

const DEFAULT_LOCALE = 'en'

const DEFAULT_DATE_TIME_OPTIONS = {
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  month: 'short',
  year: 'numeric'
}

class I18n {

  constructor() {
    this._attrMap = [
      { attr: 'data-caption', selector: 'data-i18n-caption' },
      { attr: 'placeholder', selector: 'data-i18n-placeholder' },
    ]
    this._translator = null
    this._locale = null
    this._module = i18next
    this._observer = null
  }

  getLocale() {
    return this._locale
  }

  formatDateTime(date) {
    return new Date(date).toLocaleDateString(this._locale, DEFAULT_DATE_TIME_OPTIONS)
  }

  formatNumber(number) {
    return new Intl.NumberFormat(this._locale).format(number)
  }

  initSessionLocale() {
    const searchParams = new URLSearchParams(window.location.search)
    const locale = searchParams.get('locale')
    if (locale) {
      sessionStorage.setItem('locale', locale)
    }
  }

  async init() {
    return new Promise(async (resolve, reject) => {
      const priorLocale = this._locale
      this.initSessionLocale()

      if (this._translator && priorLocale === this._locale) {
        this._translator = await this.setLocale(this._locale)
        resolve(this._translator)
        return
      }

      this._module.use(Backend)
        .init({
          backend: {
            // for all available options read the backend's repository readme file
            loadPath: '/assets/locales/{{lng}}.json'
          },
          fallbackLng: 'en'
        })
        .then(async () => {
          this._translator = await this.setLocale(this._locale)
          resolve(this._translator)
        }).catch(error => {
          reject(error)
        })
    })
  }

  /**
   * Sets the local based on a language key stored in session.
   */
  async setLocale(locale = null) {
    return new Promise(async (resolve, reject) => {
      if (!locale) {
        locale = window.sessionStorage.getItem('locale')
      }
      if (!locale) {
        locale = DEFAULT_LOCALE
      }
      this._locale = locale
      const lang = (locale.length > 2) ? locale.substring(0, 2) : locale
      document.documentElement.setAttribute('lang', lang)

      this._module.changeLanguage(locale)
        .then(translator => {
          this._translator = translator
          resolve(translator)
        }).catch(error => {
          reject(error)
        }
        )
    })
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
    })
  }

  // One way to do 'static' HTML page translations is with client-side code that scans for a data attribute.
  // This is an alternative to performing the translations on the back end.
  translatePage() {
    const elements = Array.from(document.querySelectorAll('[data-i18n]'))
    elements.forEach(element => {
      const i18nKey = element.dataset.i18n
      element.textContent = this._translator(i18nKey)
    })
    this._attrMap.forEach(def => this.translateAttribute(def))
  }

  async enableDocumentObserver() {
    if (!this._observer) {
      await this.init()
      const observerConfig = { attributeFilter: ['data-i18n', 'data-i18n-placeholder', 'data-i18n-caption'], attributes: true, characterData: false, characterDataOldValue: false, childList: true, subtree: true }
      const translateDebounce = Debounce(() => {
        this._observer.disconnect()
        this.translatePage()
        this._observer.observe(document, observerConfig)
      })
      this._observer = new MutationObserver(translateDebounce.bind(this))
      this._observer.observe(document, observerConfig)
      translateDebounce()
    }
  }

}

export default new I18n()
