import { I18n } from 'services'

function mockApiResponse(body = {}, status = 200) {
  return new window.Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-type': 'application/json' }
  })
}

describe('I18n', () => {

  const expect = chai.expect


  const URL_EN = 'assets/locales/en.json'
  const URL_ES = 'assets/locales/es.json'
  const ResponseMockEN = mockApiResponse({
    "global:header": "This is the home page",
    "global:test": "This is a test"
  })
  const ResponseMockES = mockApiResponse({
    "global:header": "Esta es la página principal",
    "global:test": "Esto es una prueba"
  })


  beforeEach(() => {
    const fetchStub = sinon.stub(window, 'fetch')
    fetchStub.withArgs(URL_EN).returns(Promise.resolve(ResponseMockEN))
    fetchStub.withArgs(URL_ES).returns(Promise.resolve(ResponseMockES))
  })

  afterEach(() => {
    window.fetch.restore()
  })

  describe('functions', () => {

    it('should set the locale when initialized', async () => {
      await I18n.init()
      expect(I18n.localeId).to.not.be.empty
    })



  })

})
