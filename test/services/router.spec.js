import { Router } from 'services'

describe('Router', () => {

  const expect = chai.expect

  describe('functions', () => {

    it('should change the history api', (done) => {
      Router.setPath('test', (req, next) => {
      })
      const pathChange = () => {
        expect(true).to.be.true
        window.removeEventListener('url-change', pathChange)
        done()
      }
      window.addEventListener('url-change', pathChange)
      Router.goto('test')
    })

    it('should execute the exit function', (done) => {
      Router.setPath('/exit1', (req, next) => {
        req.exit(() => {
          expect(true).to.be.true
          done()
        })
        Router.goto('/exit2')
      })
      Router.setPath('/exit2', (req, next) => {
        next()
      })
      Router.goto('/exit1')
    })

    it('should execute the default path from an unknown path', (done) => {
      Router.defaultPath('/unknown', (req, next) => {
        expect(window.location.href.includes('unknown')).to.be.true
        expect(Router.$defaultPath).to.equal('unknown')
        done()
      })
      Router.goto('/null')
    })

    it('should have access to route params', (done) => {
      Router.setPath('/test/:id', (req, next) => {
        expect(req.params.get('id')).to.equal('123')
        done()
      })
      Router.goto('/test/123')
    })

    it('should route to optional paths', (done) => {
      Router.setPath('/optional/:id?', (req, next) => {
        expect(req.params.get('id')).to.be.undefined
        done()
      })
      Router.goto('/optional')
    })

    it('should remove url params if any', () => {
      Router.goto('/optional?test=tester')
      expect(window.location.href.includes('test=tester')).to.be.true
      Router.removeURLSearchParams()
      expect(window.location.href.includes('test=tester')).to.not.be.true
    })

    it('should have middleware to ensure custom elements are defined', (done) => {
      Router.setPath('/customElementsReady', Router.customElementsReady, (req, next) => {
        done()
      })
      Router.goto('/customElementsReady')
    })


  })
})
