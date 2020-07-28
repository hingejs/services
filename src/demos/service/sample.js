import BaseService from '../../base-service.js'
import HttpFetch from '../../http-fetch.js'

class SampleService extends BaseService {

  constructor() {
    super()
  }

  makeCall() {
    if(this.controller instanceof AbortController) {
      this.controller.abort()
    }
    this.controller = new AbortController()

    this.ReadyState.preparing()
    this.resetPayload()

    new HttpFetch({signal:this.controller.signal}).get('./data.json')
    .then(r => HttpFetch.toJSON(r))
    .then(v => {
      console.log('call complete')
      this._mutatedPayload.data = v
      return v
    }).catch(error => {
      console.log('is this the abort?')
      console.dir(error)
        /* Only care about the error if it isn't aborted by the user */
        if (error.name !== 'AbortError') {
          console.log('this is a real error')
        }

    })


  }

  _modelPayload(payload) {
    return payload
  }

}

export default new SampleService()
