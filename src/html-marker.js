const REGEX_LITERAL = /(\${.+?})/gi /*Alt: /(\${.+(?=[\${.+?}]+)?})/gi */
const STRING_LITERAL_FINDS = /\$\{(([\w_\(\)\.\$])+)\}/gi
const PARAM_FROM_FUNCTION = /\$*\w+\s*\((.*)\)/gi
const BOOLEAN_ATTRIBUTES = new Set([
  'allowfullscreen',
  'allowpaymentrequest',
  'async',
  'autofocus',
  'autoplay',
  'checked',
  'controls',
  'default',
  'defer',
  'disabled',
  'formnovalidate',
  'hidden',
  'ismap',
  'itemscope',
  'loop',
  'multiple',
  'muted',
  'nomodule',
  'novalidate',
  'open',
  'readonly',
  'required',
  'reversed',
  'selected',
  'typemustmatch'
])

export default class HtmlMarker {
  constructor() {
    this.referenceNodes = new Set()
    this.uuid = new Date().getTime().toString(36) + performance.now().toString().replace(/[^0-9]/g, '') + '@'
    this.model = {}
    this._decorators = new Map([
      ['$_removeHTML', this.removeHTML.bind(this)],
      ['$_unsafeHTML', this.unsafeHTML.bind(this)]
    ])
  }

  get decorators() {
    return this._decorators
  }

  addDecorator(name, func) {
    this._decorators.set(name, func)
    return this
  }

  updateModel(obj = {}) {
    obj = this.mapRecursive(obj, this.safeHTML.bind(this))
    Object.assign(this.model, obj)
    return this.update()
  }

  _templateStringDataModel(templateString) {
    const matches = new Set(Array.from(templateString.matchAll(STRING_LITERAL_FINDS), m => m[1]).map(model => {
      /* this makes no sense what so ever,
         why do I need to run the match before the match all
         regex.test works but breaks
      */
      if(model.match(PARAM_FROM_FUNCTION)) {
        model = Array.from(model.matchAll(PARAM_FROM_FUNCTION), m => m[1]).shift()
      }
      return model
    }).filter(val => val && val.length))
    const defaultModel = [...matches].reduce((acc,curr) => (acc[curr]='', acc), {})
    /* We need all the values that are needed to render the first pass */
    this.updateModel(defaultModel)
  }

  async render(target, templateString, initialModel = {}) {
    /* remove comments that are found in the string since we use them as markers */
    templateString = templateString.replace(/<!--[\s\S]*?-->/gm, '')
    const rootElement = this._fragmentFromString(templateString)
    console.log(templateString)
    this._templateStringDataModel(templateString)
    this.updateModel(initialModel)
    const frag = this._markerTree(rootElement)
    await this._referenceTree(frag)
    if (target) { /* allow for shadowRoot */
      target.appendChild(frag)
      await this.update()
    }
    return Promise.resolve(true)
  }

  _fragmentFromString(strHTML) {
    const template = document.createElement('template')
    template.innerHTML = strHTML
    return template.content.cloneNode(true)
  }

  _markChildNodes(childNodes) {
    let expressions = []
    Array.from(childNodes).forEach(node => {
      if (node.hasChildNodes()) {
        expressions = expressions.concat(this._markChildNodes(node.childNodes))
      }
      if (node.nodeValue && node.nodeValue.trim().length) {
        const matches = node.nodeValue.trim().match(REGEX_LITERAL)
        if (matches) {
          expressions = expressions.concat(matches)
          const template = node.nodeValue.trim()
          const html = this._interpolate({ params: this.model, template, useMarkers: true })
          const newNode = this._parseHTML(html)
          node.parentNode.replaceChild(newNode, node)
        }
      }
    })
    return expressions
  }

  _markerTree(rootElement) {
    const walker = document.createNodeIterator(
      rootElement,
      NodeFilter.SHOW_ALL,
      null,
      false
    )
    let expressions = []
    let node
    while (node = walker.nextNode()) {
      if (node.nodeType === Node.ELEMENT_NODE && (window.customElements.get(node.tagName) || node.tagName.includes('-'))) {
        continue
      }
      if (node.hasChildNodes()) {
        expressions = expressions.concat(this._markChildNodes(node.childNodes))
      }

      if (node.nodeValue && node.nodeValue.trim().length) {
        const matches = node.nodeValue.trim().match(REGEX_LITERAL)
        if (matches) {
          expressions = expressions.concat(matches)
          const template = node.nodeValue.trim()
          const html = this._interpolate({ params: this.model, template, useMarkers: true })
          const newNode = this._parseHTML(html)
          node.parentNode.replaceChild(newNode, node)
        }
      }
    }
    const walkerComments = document.createNodeIterator(
      rootElement,
      NodeFilter.SHOW_COMMENT,
      null,
      false
    )
    let i = 0
    let nodeComments
    while (nodeComments = walkerComments.nextNode()) {
      nodeComments.textContent = `${this.uuid}${expressions[i++]}`
    }
    return rootElement
  }

  _parseHTML(html) {
    const t = document.createElement('template')
    t.innerHTML = html
    return t.content.cloneNode(true)
  }

  _interpolate({ params, template, useMarkers = false }) {
    const keys = Object.keys(params).concat([...this.decorators.keys()])
    const keyValues = Object.values(params).concat([...this.decorators.values()])
    const returnFn = useMarkers ? `function markers (template, ...expressions) {
        return template.reduce((accumulator, part, i) =>
            \`\${accumulator}<!----><span>\${expressions[i - 1]}</span>\${part}\`
          )
      } return markers\`${template}\`` : `return \`${template}\``
    return new Function(...keys, returnFn)(...keyValues)
  }

  _referenceTree(rootElement) {
    const walker = document.createNodeIterator(
      rootElement,
      NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_ELEMENT,
      null,
      false
    )
    let node
    while (node = walker.nextNode()) {
      /* Do not filter custom elements to allow attribute updates */
      if (node.nodeType === Node.ELEMENT_NODE && node.hasAttributes()) {
        const attrs = [...node.attributes]
        attrs.forEach(attr => {
          const hasLiteral = attr.value.match(REGEX_LITERAL)
          const isBooleanAttr = BOOLEAN_ATTRIBUTES.has(attr.name)
          if (hasLiteral) {
            this.referenceNodes.add({
              isBooleanAttr,
              name: attr.name,
              node: isBooleanAttr ? node : attr,
              oldValue: null,
              value: attr.value
            })
            if (isBooleanAttr) {
              node.setAttribute(attr.name, '')
            }
          }
        })
      }

      if (node.nodeType === Node.COMMENT_NODE) {
        if (node.nodeValue.includes(this.uuid)) {
          const nodeValue = node.nodeValue.replace(this.uuid, '')
          if (node.parentElement.tagName === 'TEXTAREA') {
            this.referenceNodes.add({ node: node.parentElement, oldValue: null, value: nodeValue })
          } else {
            this.referenceNodes.add({ node, oldValue: null, value: nodeValue })
          }
        }
      }
    }
    return Promise.resolve(true)
  }

  /* update all referenced nodes with the model values */
  update() {
    this.referenceNodes.forEach(({ isBooleanAttr = false, name = '', node, oldValue = null, value }, reference) => {
      if (node.nodeType === Node.ELEMENT_NODE && !document.body.contains(node)) {
        this.referenceNodes.delete(reference)
      } else {
        let newValue = this._interpolate({ params: this.model, template: value })
        if (!isBooleanAttr && newValue !== oldValue) {
          if (node.nodeType === Node.COMMENT_NODE) {
            const newNode = this._parseHTML(`<span>${newValue}</span>`)
            node.parentNode.replaceChild(newNode, node.nextSibling)
          } else if (node.nodeType === Node.ATTRIBUTE_NODE) {
            if (node.nodeName === 'class') {
              newValue = this._handleClassValue({ node, oldValue, value })
            } else {
              node.value = newValue
            }
            /* textarea is an element node that requires an attribute update */
          } else if (node.tagName === 'TEXTAREA') {
            node.value = newValue
          }
        }
        if (isBooleanAttr) {
          node.toggleAttribute(name, !!newValue.toString().length)
        }
        reference.oldValue = newValue
      }
    })
    return Promise.resolve(true)
  }

  _handleClassValue({ node, oldValue = [], value }) {
    const ownerElement = this._getNodeOwnerElement(node)
    const values = value.match(REGEX_LITERAL)
    let newValFiltered = []
    let newVal = []

    if (values) {
      /* remove starting literal values */
      ownerElement.className = ownerElement.className.replace(REGEX_LITERAL, '')
      newVal = this._interpolate({ params: this.model, template: values.join(' ') })
      newVal = newVal.split(' ').filter(className => className.length)
      if (Array.isArray(newVal)) {
        oldValue = Array.isArray(oldValue) ? oldValue : []
        /* any old class in the new value can be ignored */
        const intersection = newVal.filter(className => oldValue.includes(className))
        oldValue = oldValue.filter(className => !intersection.includes(className))
        newValFiltered = newVal.filter(className => !intersection.includes(className))
      }
    }

    if (Array.isArray(oldValue) && oldValue.length) {
      ownerElement.classList.remove(...oldValue)
    }

    if (Array.isArray(newValFiltered) && newValFiltered.length) {
      ownerElement.classList.add(...newValFiltered)
    }
    return newVal
  }

  /* Allows to find the parent which is not always as simple as node.parentNode
    mainly for the element an attribute belongs too */
  _getNodeOwnerElement(node) {
    let ownerElement = node.ownerElement
    while (ownerElement && !ownerElement.tagName) {
      ownerElement = ownerElement.ownerElement
    }
    return ownerElement
  }

  safeHTML(input = '') {
    return String(input)
      .replace(/&(?=[^amp;|lt;|gt;|quot;|#])/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/\//g, '&#x2F;')
  }

  removeHTML(input) {
    const doc = new DOMParser().parseFromString(input, 'text/html')
    const docEnsure = new DOMParser().parseFromString(doc.documentElement.textContent, 'text/html')
    return docEnsure.documentElement.textContent
  }

  unsafeHTML(input) {
    const txt = document.createElement('textarea')
    txt.innerHTML = input
    return txt.value
  }

  /* this function will execute a function to object values with a deep nest */
  mapRecursive(obj, func) {
    if ((typeof obj !== 'object' && !Array.isArray(obj)) || !obj) {
      return func(obj)
    }
    const accObj = Array.isArray(obj) ? [] : {}
    const arrObj = Array.isArray(obj) ? [...obj.entries()] : Object.entries(obj)
    return arrObj.reduce((acc, [key, value]) => {
      acc[key] = this.mapRecursive(value, func)
      return acc
    }, accObj)
  }
}
