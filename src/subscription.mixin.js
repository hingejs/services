export default function SubscriptionMixin(Base) {
  return class Subscription extends Base {

    constructor() {
      super()
      this.subscription = null
    }

    disconnectedCallback() {
      if (super.disconnectedCallback) {
        super.disconnectedCallback()
      }
      if (this.subscription) {
        if (Array.isArray(this.subscription)) {
          this.subscription.forEach(subscription => subscription.unsubscribe())
        } else {
          this.subscription.unsubscribe()
        }
      }
      this.subscription = null
    }

  }
}
