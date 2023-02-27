import {Buffer} from 'node:buffer'
import path from 'node:path'
import parseUrl from 'url-parse'
import stripIndent from 'strip-indent'
import contentType from 'content-type'
import mime from 'mime'
import {eTag} from '@tinyhttp/etag'

export default function (files, baseUrl = '/') {
  const responses = {}
  for (const filePath of Object.keys(files)) {
    const body = stripIndent(files[filePath]).trim()
    responses[filePath] = {
      status: 200,
      headers: {
        'content-length': `${Buffer.byteLength(body)}`,
        'content-type': contentType.format({
          type: mime.getType(path.extname(filePath)),
          parameters: {
            charset: 'utf-8',
          },
        }),
        'cache-control': 'no-cache',
        etag: eTag(body),
      },
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
