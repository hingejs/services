import BaseService from '../../base-service.js'
import HttpFetch from '../../http-fetch.js'

class SampleService extends BaseService {

  constructor() {
    super()
    this.PipeModel.add(this._modelPayload.bind(this))
  }

  get defaultModel() {
    return {
      test: '',
      deep: {
        more: '',
        deeper: {
          muchmore: '',
        }
      }
    }
  }

  makeCall() {
    const ENDPOINT1 = 'https://jsonplaceholder.typicode.com/todos/1'
    const ENDPOINT2 = './data.json'

    if(this.controller instanceof AbortController) {
      this.controller.abort()
    }
    this.controller = new AbortController()

    this.ReadyState.preparing()

    //setTimeout(()=>{
    new HttpFetch({signal:this.controller.signal}).get(ENDPOINT2)
    .then(r => HttpFetch.toJSON(r))
    .then(v => {
      console.log('call complete')
      this.updateModel(v)
      return v
    }).catch(error => {
      console.log('is this the abort?')
      console.dir(error)
        /* Only care about the error if it isn't aborted by the user */
        if (error.name !== 'AbortError') {
          console.log('this is a real error')
        }
    })
  //}, 2000)


  }

  _modelPayload(payload) {
    console.log('payload')
    payload.date = new Date()
    return payload
  }

}

export default new SampleService()
