import test from 'ava'
import {startServer, stopServer, compose, sendRequest} from 'passing-notes'
import serveStatic from './index.js'

test('serving string files', async (t) => {
  const server = await startServer(
    {port: 10_100},
    compose(
      serveStatic({
        'one.html': `
          <!doctype html>
          <p>One!</p>
        `,
        'two.html': `
          <!doctype html>
          <p>Two!</p>
        `,
      }),
      () => () => ({status: 404}),
    ),
  )
  t.teardown(() => {
    stopServer(server)
  })

  {
    const response = await sendRequest({
      method: 'GET',
      url: 'http://localhost:10100/one.html',
      headers: {},
    })

    t.like(response, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'content-length': '27',
      },
    })
    t.true(response.body.includes('<p>One!</p>'))
  }

  {
    const response = await sendRequest({
      method: 'GET',
      url: 'http://localhost:10100/two.html',
      headers: {},
    })

    t.like(response, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'content-length': '27',
      },
    })
    t.true(response.body.includes('<p>Two!</p>'))
  }
})

test('serving index.html when requesting a directory', async (t) => {
  const server = await startServer(
    {port: 10_101},
    compose(
      serveStatic({
        'index.html': `
          <!doctype html>
          <p>Root!</p>
        `,
        'sub/index.html': `
          <!doctype html>
          <p>Sub!</p>
        `,
      }),
      () => () => ({status: 404}),
    ),
  )
  t.teardown(() => {
    stopServer(server)
  })

  {
    const response = await sendRequest({
      method: 'GET',
      url: 'http://localhost:10101',
      headers: {},
    })

    t.like(response, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'content-length': '28',
      },
    })
    t.true(response.body.includes('<p>Root!</p>'))
  }

  {
    const response = await sendRequest({
      method: 'GET',
      url: 'http://localhost:10101/sub',
      headers: {},
    })

    t.like(response, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'content-length': '27',
      },
    })
    t.true(response.body.includes('<p>Sub!</p>'))
  }
})

test('allowing the client to cache resources', async (t) => {
  const server = await startServer(
    {port: 10_102},
    compose(
      serveStatic({
        'index.html': `
          <!doctype html>
          <p>Root!</p>
        `,
      }),
      () => () => ({status: 404}),
    ),
  )
  t.teardown(() => {
    stopServer(server)
  })

  const response = await sendRequest({
    method: 'GET',
    url: 'http://localhost:10102',
    headers: {},
  })
  const etag = response.headers.etag

  const cachedResponse = await sendRequest({
    method: 'GET',
    url: 'http://localhost:10102',
    headers: {
      'if-none-match': etag,
    },
  })
  t.is(cachedResponse.status, 304)
  t.is(cachedResponse.body, '')
})

test('falling through when a file cannot be found', async (t) => {
  const server = await startServer(
    {port: 10_103},
    compose(
      serveStatic({
        'index.html': `
          <!doctype html>
          <p>Root!</p>
        `,
      }),
      () => () => ({status: 404}),
    ),
  )
  t.teardown(() => {
    stopServer(server)
  })

  const response = await sendRequest({
    method: 'GET',
    url: 'http://localhost:10103/not-found',
    headers: {},
  })

  t.is(response.status, 404)
})

test('optionally handling only requests to a sub directory', async (t) => {
  const server = await startServer(
    {port: 10_104},
    compose(
      serveStatic(
        {
          'index.html': `
            <!doctype html>
            <p>Root!</p>
          `,
        },
        '/sub',
      ),
      () => () => ({status: 404}),
    ),
  )

  t.teardown(() => {
    stopServer(server)
  })

  t.like(
    await sendRequest({
      method: 'GET',
      url: 'http://localhost:10104',
      headers: {},
    }),
    {status: 404},
  )

  t.like(
    await sendRequest({
      method: 'GET',
      url: 'http://localhost:10104/sub',
      headers: {},
    }),
    {status: 200},
  )
})
