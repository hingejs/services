# &#8762; Hingejs - Services

Front-End ES6+ Classes used for UI development


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
