import { HttpFetch } from 'services'

function mockApiResponse(body = {}, status = 200) {
  return new window.Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-type': 'application/json' }
  })
}

describe('HttpFetch', () => {

  const expect = chai.expect
  let httpFetch

  const GET_URL = 'http://example.com/get'
  const GET_URL_PARAMS = 'http://example.com/get?test=tester'
  const GET_PARAMS = {test:'tester'}
  const ResponseMock = mockApiResponse({test:'testing'})
  const ResponseMockParams = mockApiResponse({test:'tester'})
  const POST_URL = 'http://example.com/post'
  const PUT_URL = 'http://example.com/put'
  const DELETE_URL = 'http://example.com/delete'
  const MULTI_GET_URL = [
    { url: GET_URL },
    { url: GET_URL, params: { test: 'tester' } }
  ]

  beforeEach(() => {
    httpFetch = new HttpFetch({ mode: 'no-cors' })
    const fetchStub = sinon.stub(window, 'fetch')
    fetchStub.withArgs(GET_URL).returns(Promise.resolve(ResponseMock))
    fetchStub.withArgs(GET_URL_PARAMS).returns(Promise.resolve(ResponseMockParams))
    fetchStub.withArgs(POST_URL).returns(Promise.resolve(ResponseMock))
    fetchStub.withArgs(PUT_URL).returns(Promise.resolve(ResponseMock))
    fetchStub.withArgs(DELETE_URL).returns(Promise.resolve(ResponseMock))
  })

  afterEach(() => {
    window.fetch.restore()
  })

  describe('functions', () => {

    it('should accept options from the constructor', () => {
      expect(httpFetch.requestOptions).to.not.be.empty
    })

    it('should accept empty options from the constructor', () => {
      const http = new HttpFetch()
      expect(http.requestOptions).to.be.empty
    })


    it('should expect addParamsToURL to add url params to a url with url params', () => {
      const URL = 'http://example.com?test=tester'
      const PARAMS = {one:1, two:2}
      const results = HttpFetch.addParamsToURL(URL, PARAMS)
      expect(results).to.equal('http://example.com/?test=tester&one=1&two=2')
    })

    it('should expect addParamsToURL to return url with no url params', () => {
      const URL = 'http://example.com?test=tester'
      const results = HttpFetch.addParamsToURL(URL)
      expect(results).to.equal('http://example.com/?test=tester')
    })

    it('should expect addParamsToURL to return url with bad url', () => {
      const URL = 'example.com?test=tester'
      const PARAMS = {one:1, two:2}
      const results = HttpFetch.addParamsToURL(URL)
      expect(results).to.equal('example.com?test=tester')
    })

    it('should convert response to json', async () => {
      const myBlob = new Blob([JSON.stringify({ foo: 'bar' }, null, 2)], { type: 'application/json' })
      const response200 = new Response(myBlob, { status: 200, headers: { 'Content-type': 'application/json' } })
      const results = await HttpFetch.toJSON(response200)
      expect(results).to.deep.equal({ foo: 'bar' })
    })

    it('should expect empty response to return empty json', async () => {
      const myBlob = new Blob([''], { type: 'text/plain' })
      const response200 = new Response(myBlob, { status: 200, headers: { 'Content-type': 'text/plain' } })
      const results = await HttpFetch.toJSON(response200)
      expect(results).to.be.empty
    })

    it('should expect malformed response to throw error', async () => {
      const myBlob = new Blob(['{testing '], { type: 'text/plain' })
      const response200 = new Response(myBlob, { status: 200, headers: { 'Content-type': 'text/plain' } })
      let results
      try {
        results = await HttpFetch.toJSON(response200)
      } catch(error) {
        results = 'error thrown'
      }
      expect(results).to.equal('error thrown')
    })

    it('should parse params to a url ready string', async () => {
      const PARAMS = {one:1, two:2}
      const results = await HttpFetch.generateUrlParams(PARAMS)
      expect(results).to.equal('?one=1&two=2')
    })

    it('should parse empty params to a url ready string', async () => {
      const results = await HttpFetch.generateUrlParams()
      expect(results).to.equal('?')
    })


    it('should get results from a url', async () => {
      const results = await httpFetch.get(GET_URL).then(HttpFetch.toJSON)
      expect(results).to.deep.equal({test:'testing'})
    })

    it('should get results from a url with params', async () => {
      const results = await httpFetch.get(GET_URL, GET_PARAMS).then(HttpFetch.toJSON)
      expect(results).to.deep.equal({test:'tester'})
    })

    it('should post data to a url', async () => {
      const formData = new FormData()
      formData.append('username', 'Tester');
      const results = await httpFetch.post(POST_URL, formData).then(HttpFetch.toJSON)
      expect(results).to.deep.equal({test:'testing'})
    })

    it('should put data to a url', async () => {
      const data = {data:'value'}
      const results = await httpFetch.put(PUT_URL, data).then(HttpFetch.toJSON)
      expect(results).to.deep.equal({test:'testing'})
    })

    it('should delete data to a url', async () => {
      const results = await httpFetch.delete(DELETE_URL).then(HttpFetch.toJSON)
      expect(results).to.deep.equal({test:'testing'})
    })


    it('should add header options when defined from the constructor', async () => {
      const http = new HttpFetch({headers: { authorization: 'Basic xyz'}})
      const results = await http.get(GET_URL).then(HttpFetch.toJSON)
      expect(results).to.deep.equal({test:'testing'})
    })

    it('should allow multiple get calls all settled', async () => {
      const multiResults = await httpFetch.getAll(MULTI_GET_URL)
      const multiResultsJSON = await Promise.all(
        multiResults
          .filter(({ status }) => status === 'fulfilled')
          .map(async ({ value }) => await HttpFetch.toJSON(value))
      )
      expect(multiResultsJSON).to.deep.equal([{test: 'testing'},{test: 'tester'}])
    })

    it('should allow multiple get calls all not settled', async () => {
      const multiResults = await httpFetch.getAll(MULTI_GET_URL, false)
      const multiResultsJSON = await Promise.all(
        multiResults
          .map(async response => await HttpFetch.toJSON(response))
      )
      expect(multiResultsJSON).to.deep.equal([{test: 'testing'},{test: 'tester'}])
    })


  })

})
