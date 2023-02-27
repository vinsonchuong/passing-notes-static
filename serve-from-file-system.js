import path from 'node:path'
import fs from 'node:fs'
import parseUrl from 'url-parse'
import contentType from 'content-type'
import mime from 'mime'
import fresh from 'fresh'

export default function (rootDirectory, baseUrl = '/') {
  rootDirectory = path.resolve(rootDirectory)

  return (next) => async (request) => {
    const {pathname} = parseUrl(request.url)

    if (path.relative(baseUrl, pathname).startsWith('../')) {
      return next(request)
    }

    const filePath = path.join(rootDirectory, path.relative(baseUrl, pathname))

    try {
      return await serveFile(request, filePath)
    } catch (error) {
      if (error.code === 'ENOENT') {
        return next(request)
      }

      throw error
    }
  }
}

async function serveFile(request, filePath) {
  const fileStats = await fs.promises.stat(filePath)
  if (fileStats.isDirectory()) {
    return serveFile(request, path.join(filePath, 'index.html'))
  }

  const responseHeaders = {
    'content-length': `${fileStats.size}`,
    'content-type': contentType.format({
      type: mime.getType(path.extname(filePath)),
      parameters: {
        charset: 'utf-8',
      },
    }),
    'cache-control': 'no-cache',
    'last-modified': new Date(fileStats.mtime).toUTCString(),
  }
  if (fresh(request.headers, responseHeaders)) {
    return {
      status: 304,
      headers: {
        ...responseHeaders,
        'content-length': '0',
      },
      body: '',
    }
  }

  return {
    status: 200,
    headers: responseHeaders,
    body: fs.createReadStream(filePath),
  }
}
