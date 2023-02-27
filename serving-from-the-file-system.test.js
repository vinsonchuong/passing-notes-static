import test from 'ava'
import {useTemporaryDirectory} from 'ava-patterns'
import {openChrome} from 'puppet-strings-chrome'
import {closeBrowser, openTab, findElement, navigate} from 'puppet-strings'
import {startServer, stopServer, compose, sendRequest} from 'passing-notes'
import serveStatic from './index.js'

test.before(async (t) => {
  t.context.server = await startServer(
    {port: 10_000},
    compose(serveStatic('./fixtures/'), () => () => ({status: 404})),
  )
})

test.after.always(async (t) => {
  await stopServer(t.context.server)
})

test('serving static files', async (t) => {
  const response = await sendRequest({
    method: 'GET',
    url: 'http://localhost:10000/index.html',
    headers: {},
  })

  t.like(response, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'content-length': '86',
    },
  })
  t.true(response.body.includes('<div>Hello World!</div>'))
})

test('serving index.html when requesting a directory', async (t) => {
  const response = await sendRequest({
    method: 'GET',
    url: 'http://localhost:10000',
  })

  t.true(response.body.includes('<div>Hello World!</div>'))
})

test('allowing the client to cache resources', async (t) => {
  const response = await sendRequest({
    method: 'GET',
    url: 'http://localhost:10000',
    headers: {
      'if-modified-since': new Date('2100-01-01').toUTCString(),
    },
  })

  t.is(response.status, 304)
})

test('falling through when a file cannot be found', async (t) => {
  const response = await sendRequest({
    method: 'GET',
    url: 'http://localhost:10000/not-found',
    headers: {},
  })

  t.is(response.status, 404)
})

test('disallowing access of the parent directory', async (t) => {
  const response = await sendRequest({
    method: 'GET',
    url: 'http://localhost:10000/foo/../../package.json',
    headers: {},
  })

  t.is(response.status, 404)
})

test('revalidating cached resources in the browser', async (t) => {
  const directory = await useTemporaryDirectory(t)

  const browser = await openChrome()
  t.teardown(async () => {
    await closeBrowser(browser)
  })

  const server = await startServer(
    {port: 10_001},
    compose(serveStatic(directory.path), () => () => ({status: 404})),
  )
  t.teardown(async () => {
    await stopServer(server)
  })

  await directory.writeFile(
    'index.html',
    `
    <!doctype html>
    <meta charset="utf-8">
    <div>Hello World!</div>
    `,
  )
  const tab = await openTab(browser, 'http://localhost:10001')
  t.like(await findElement(tab, 'div'), {innerText: 'Hello World!'})

  await directory.writeFile(
    'index.html',
    `
    <!doctype html>
    <meta charset="utf-8">
    <div>Hello There!</div>
    `,
  )
  await navigate(tab, 'http://localhost:10001')
  t.like(await findElement(tab, 'div'), {innerText: 'Hello There!'})
})

test('optionally handling only requests to a sub directory', async (t) => {
  const server = await startServer(
    {port: 10_002},
    compose(serveStatic('./fixtures/', '/sub'), () => () => ({status: 404})),
  )
  t.teardown(async () => {
    await stopServer(server)
  })

  t.like(
    await sendRequest({
      method: 'GET',
      url: 'http://localhost:10002/',
      headers: {},
    }),
    {status: 404},
  )

  t.like(
    await sendRequest({
      method: 'GET',
      url: 'http://localhost:10002/package.json',
      headers: {},
    }),
    {status: 404},
  )

  t.like(
    await sendRequest({
      method: 'GET',
      url: 'http://localhost:10002/sub',
      headers: {},
    }),
    {status: 200},
  )
})
