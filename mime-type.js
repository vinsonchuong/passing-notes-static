import path from 'node:path'
import mime from 'mime'
import contentType from 'content-type'

export function getType(filePath) {
  const extension = path.extname(filePath)
  return extension ? mime.getType(extension) : null
}

export function formatContentType(filePath) {
  const type = getType(filePath)

  if (!type) {
    return undefined
  }

  return contentType.format({
    type: getType(filePath),
    parameters: {
      charset: 'utf-8',
    },
  })
}

export function withContentType(filePath) {
  const contentTypeHeader = formatContentType(filePath)
  return function (headers) {
    return contentTypeHeader
      ? {...headers, 'content-type': contentTypeHeader}
      : headers
  }
}
