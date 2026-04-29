import {Buffer} from 'node:buffer'
import path from 'node:path'
import parseUrl from 'url-parse'
import stripIndent from 'strip-indent'
import {eTag} from '@tinyhttp/etag'
import flow from 'lodash/flow.js'
import {withContentType} from './mime-type.js'

export default function serveFromStrings(files, baseUrl = '/') {
  const responses = {}
  for (const filePath of Object.keys(files)) {
    const body = stripIndent(files[filePath]).trim()
    responses[filePath] = {
      status: 200,
      headers: flow([withContentType(filePath)])({
        'content-length': `${Buffer.byteLength(body)}`,
        'cache-control': 'no-cache',
        etag: eTag(body),
      }),
      body,
    }
  }

  return (next) => async (request) => {
    const {pathname} = parseUrl(request.url)
    const relativePath = path.relative(baseUrl, pathname)

    return serveString(responses, request, relativePath) ?? next(request)
  }
}

function resolveStringPath(responses, filePath) {
  const directoryIndexPath = path.join(filePath, 'index.html')
  if (filePath in responses) {
    return filePath
  } else if (directoryIndexPath in responses) {
    return directoryIndexPath
  } else {
    return null
  }
}

function serveString(responses, request, filePath) {
  const resolvedFilePath = resolveStringPath(responses, filePath)

  if (resolvedFilePath) {
    const response = responses[resolvedFilePath]

    if (request.headers['if-none-match'] === response.headers.etag) {
      return {
        ...response,
        status: 304,
        headers: {
          ...response.headers,
          'content-length': '0',
        },
        body: null,
      }
    } else {
      return response
    }
  } else {
    return null
  }
}
