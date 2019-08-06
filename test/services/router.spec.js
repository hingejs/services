import { RouterService } from '../../index.js'

describe('RouterService', () => {

  const expect = chai.expect

  describe('functions', () => {

    it('should change the history api', (done) => {
      RouterService.setPath('test', (req, next) => {
      })
      const pathChange = () => {
        expect(true).to.be.true
        window.removeEventListener('url-change', pathChange)
        done()
      }
      window.addEventListener('url-change', pathChange)
      RouterService.goto('test')
    })

    it('should execute the exit function', async (done) => {
      RouterService.setPath('/exit1', (req, next) => {
        req.exit(() => {
          expect(true).to.be.true
          done()
        })
        RouterService.goto('/exit2')
      })
      RouterService.setPath('/exit2', (req, next) => {
        next()
      })
      RouterService.goto('/exit1')
    })

    it('should execute the default path from an unknown path', async (done) => {
      RouterService.defaultPath('/unknown', (req, next) => {
        expect(window.location.href.includes('unknown')).to.be.true
        expect(RouterService.$defaultPath).to.equal('unknown')
        done()
      })
      RouterService.goto('/null')
    })

    it('should have access to route params', async (done) => {
      RouterService.setPath('/test/:id', (req, next) => {
        expect(req.params.get('id')).to.equal('123')
        done()
      })
      RouterService.goto('/test/123')
    })

    it('should route to optional paths', async (done) => {
      RouterService.setPath('/optional/:id?', (req, next) => {
        expect(req.params.get('id')).to.be.undefined
        done()
      })
      RouterService.goto('/optional')
    })

    it('should try to load html into the routeDisplay element', (done) => {
      RouterService.setPath('/load', async (req) => {
        const instance = await req.load('<template><p>works</p></template>')
        expect(instance).to.eql(RouterService)
        done()
      })
      RouterService.goto('/load')
    })

  })
})
