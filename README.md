# &#8762; Hingejs - Services

Front-End ES6+ Classes used for UI development

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

## Debounce

```js
const translateDebounce = Debounce(() => {
  this.translatePage()
})

translateDebounce()
```

## FetchInterceptor

Interceptor is an object that is invoked at the preprocessing and postprocessing of a request.

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

Used to render html using string literals and allow updates without using innerHTML

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


## Router

Used for single page routing

> Recommended to use in conjunction with web components `route-display` and `route-link`

```js
const RouteCtrl = async (req, next) => {
  const $routeDisplay = document.querySelector('route-display')
  req.exit(() => {
    // function to execute before exiting route
  })
  await $routeDisplay.insertContent(HtmlCache.get('home/home.html'))
  next()
}

Router.defaultPath('/home', RouteCtrl)
//or
Router.setPath('/auth-home', AuthService.checkSession.bind(AuthService), RouteCtrl)
```




