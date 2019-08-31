# &#8762; Hingejs - Services

Front-End ES6+ Classes used for UI development

#### Related packages

- https://www.npmjs.com/package/@hingejs/generator
- https://www.npmjs.com/package/@hingejs/webcomponents

## Install

```sh
$ npm install @hingejs/services --save
```

## Live demos

https://hingejs.github.io/services/

## CDN

https://cdn.jsdelivr.net/npm/@hingejs/services/index.min.js

or by version

https://cdn.jsdelivr.net/npm/@hingejs/services@0.0.3/index.min.js


```js
import { HtmlMarker } from 'https://cdn.jsdelivr.net/npm/@hingejs/services/index.min.js'
```

## Webpack

```js
import { HttpFetch, HtmlMarker, Observable } from '@hingejs/services'
```

## BaseService

This is used injunction with the HingeJS generator to generate a Observable/HttpFetch base class

Sample: https://hingejs.github.io/services/base-service.html

## Debounce

```js
const translateDebounce = Debounce(() => {
  this.translatePage()
})

translateDebounce()
```

## FetchInterceptor

Interceptor is an object that is invoked at the preprocessing and postprocessing of a request.  So validation/auth errors can be caught globally in the app, such as 500/400 errors and handled in one place.  Recommend to use in the main.js file as it does change the global fetch object (not it's prototype constructor)

Demo and code sample: https://hingejs.github.io/services/fetch-interceptor.html

```js
FetchInterceptor.register({
  request: (url, config) => {
    // Modify the url or config here
    return [url, config]
  },
  requestError: error => {
    // Called when an error occurred during another 'request' interceptor call
    return Promise.reject(error)
  },
  response: response => {
    // Modify the response object
    return response
  },
  responseError: error => {
    // Handle an fetch error
    return Promise.reject(error)
  }
})
```

## HTML-Marker

Used to render html using string literals and allow updates without using innerHTML. Updates only the variable/model values that have been changed.  Uses html comments with an uuid to find the string literal to change.

Demo and code sample: https://hingejs.github.io/services/html-marker.html

```js
let model = { test: 'this is a test' }
const htmlMarker = new HtmlMarker(model)
const htmlString = '<p>${test}</p>'
await htmlMarker.render(document.body, htmlString)
```

To update the data

```js
model.test = 'this is now updated'
htmlMarker.updateModel(model)
```

## Http-Fetch

Enhanced version of the native fetch that uses observables

```js
new HttpFetch().get(URL).subscribe({
  error: response => {
    console.log(response)
  },
  next: payload => {
   console.log(payload)
  }
})
```

## I18n (Internationalization)

If you need your web application to manage a variety of multiple languages, this service will be needed. This method loads a json based on the locale code and will find attribute based keys to insert the value from the json.

Demo and sample code: https://hingejs.github.io/services/i18n.html

## Observable

This uses the publisher / subscription method to execute a registered function.  This is useful for classes that want to send out data to multiple subscriptions to a function you subscribe.

```js

class MyService extends Observable {
  ...
}

const subscription = MyService.subscribe({
  complete : () => {},
  error: (error) => {},
  next: (data) => {}
})

MyService.notify(message) // Invokes next function
MyService.notifyError(message) // Invokes error function
MyService.complete() // Invokes complete function and removes all  subscribed functions

subscription.unsubscribe() // Removes single subscription
subscription.uuid // uuid to identify subscription id
```

## Router

Used for single page routing.  Uses HTML 5 history/popstate.

> Recommended to use in conjunction with web components `h-route-display` and `h-route-link`

Demo and sample code: https://hingejs.github.io/services/router.html

## Mixins

Mixins are methods(functions) and properties that are added to a class to become part of that class.  Often times they are not implemented, but in this case, some of the functions might be.

Related Links
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes#Mix-ins

### Model-Mixin

The model mixin is to be used with components.  This model mixin allows for a quicker setup to update data and render it to the dom.
It is important that you have the `get defaultModel()` setup and that the `onModelUpdate()` is implemented.  The `this.htmlMarker` and `this.model` are properties of the mixin.  The `updateModel(obj = {})` will update the model and invoke the `onModelUpdate()` function.  Updating the `this.model` property will not invoke the `onModelUpdate()`.  This was done so that the model can be updated or validated without an infinite call-stack error. 

HTML Template: `templates/table-message.html`
```html
<p id="${id}">${userAction}</p>
```

JavaScript
```js
import { HtmlCache } from 'services/index.js'
import { ModelMixin } from '@hingejs/services'
const Base = ModelMixin(HTMLElement)

window.customElements.define('table-message', class extends Base {

  constructor() {
    super()
  }

  _generateTemplate() {
    return HtmlCache.get('table-message.html')
  }

  async connectedCallback() {
    await this.htmlMarker.render(this, this._generateTemplate())
  }

  get defaultModel() {
    return Object.assign(super.defaultModel, {
      id: '',
      userAction: ''
    })
  }

  async onModelUpdate() {
    await this.htmlMarker.updateModel(this.model)
  }

})
```

When updating the component

```js
const tableMessage = document.querySelector('table-message')
tableMessage.onModelUpdate({id: 'test', userAction: 'Copy'})
```

### Subscription-Mixin

An easier way to subscribe and unsubscribe to service with a component.  When the component is removed it will unsubscribe to all services in the array.

JavaScript
```js
import { HtmlCache, TodoService } from 'services/index.js'
import { ModelMixin, SubscriptionMixin } from '@hingejs/services'
const Base = SubscriptionMixin(ModelMixin(HTMLElement))

window.customElements.define('table-message', class extends Base {

  constructor() {
    super()
  }

  _generateTemplate() {
    return HtmlCache.get('table-message.html')
  }

  async connectedCallback() {
    await this.htmlMarker.render(this, this._generateTemplate())
    this.subscription = [
      TodoService.subscribe({
        next: this._handlePayload.bind(this)
      })
    ]
  }

  _handlePayload(payload) {
    if(payload.length) {
      this.updateModel(payload)
    }
  }

  get defaultModel() {
    return Object.assign(super.defaultModel, {
      id: '',
      userAction: ''
    })
  }

  async onModelUpdate() {
    await this.htmlMarker.updateModel(this.model)
  }

})
```
