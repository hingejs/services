import HtmlMarker from './html-marker.js'
export default Base => class extends Base {

  constructor() {
    super()
    this.model = this.defaultModel
    this.htmlMarker = new HtmlMarker(this.model)
  }

  get defaultModel() {
    return {}
  }

  updateModel(obj = {}) {
    const lastModelUpdates = {}
    Object.entries(obj).forEach(([prop, newValue]) => {
      if (this.model[prop] !== newValue) {
        lastModelUpdates[prop] = newValue
      }
    })
    Object.assign(this.model, obj)
    this.onModelUpdate(lastModelUpdates)
  }

  onModelUpdate() { }

}
