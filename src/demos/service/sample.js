import BaseService from '../../base-service.js'
import HttpFetch from '../../http-fetch.js'

class SampleService extends BaseService {

  constructor() {
    super()
  }

  makeCall() {
    this.ReadyState.preparing()
    //this.resetPayload()
    setTimeout(() => {
      new HttpFetch().get('./data.json')
      .then(r => HttpFetch.toJSON(r))
      .then(v => {
        console.log(v)
        this._mutatedPayload.data = v
        return v
      })
    }, 1000)

  }

  _modelPayload(payload) {
    return payload
  }

}

export default new SampleService()
