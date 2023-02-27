import serveFromFileSystem from './serve-from-file-system.js'
import serveFromStrings from './serve-from-strings.js'

export default function (rootDirectoryOrFiles, baseUrl = '/') {
  return typeof rootDirectoryOrFiles === 'string'
    ? serveFromFileSystem(rootDirectoryOrFiles, baseUrl)
    : serveFromStrings(rootDirectoryOrFiles, baseUrl)
}
