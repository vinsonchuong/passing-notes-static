import test from 'ava'
import {startServer, stopServer, compose, sendRequest} from 'passing-notes'
import serveStatic from './index.js'

test('serving static files', async (t) => {
  const server = await startServer(
    {port: 10000},
    compose(serveStatic('./fixtures/'), () => () => ({
      status: 404,
      headers: {},
      body: ''
    }))
  )
  t.teardown(async () => {
    await stopServer(server)
  })

  {
    const response = await sendRequest({
      method: 'GET',
      url: 'http://localhost:10000',
      headers: {}
    })

    t.like(response, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'content-length': '86'
      }
    })
    t.true(response.body.includes('<div>Hello World!</div>'))
  }

  {
    const response = await sendRequest({
      method: 'GET',
      url: 'http://localhost:10000/index.html',
      headers: {}
    })

    t.true(response.body.includes('<div>Hello World!</div>'))
  }

  {
    const response = await sendRequest({
      method: 'GET',
      url: 'http://localhost:10000',
      headers: {
        'if-modified-since': new Date('2021-01-01').toUTCString()
      }
    })

    t.is(response.status, 304)
  }

  {
    const response = await sendRequest({
      method: 'GET',
      url: 'http://localhost:10000/not-found',
      headers: {}
    })

    t.is(response.status, 404)
  }
})
