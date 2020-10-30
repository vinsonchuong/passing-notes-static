# passing-notes-static
[![npm](https://img.shields.io/npm/v/passing-notes-static.svg)](https://www.npmjs.com/package/passing-notes-static)
[![CI Status](https://github.com/vinsonchuong/passing-notes-static/workflows/CI/badge.svg)](https://github.com/vinsonchuong/passing-notes-static/actions?query=workflow%3ACI)
[![dependencies Status](https://david-dm.org/vinsonchuong/passing-notes-static/status.svg)](https://david-dm.org/vinsonchuong/passing-notes-static)
[![devDependencies Status](https://david-dm.org/vinsonchuong/passing-notes-static/dev-status.svg)](https://david-dm.org/vinsonchuong/passing-notes-static?type=dev)

A static file middleware for
[passing-notes](https://github.com/vinsonchuong/passing-notes).

## Usage
Install [passing-notes-static](https://www.npmjs.com/package/passing-notes-static)
by running:

```sh
yarn add passing-notes-static
```

Then, compose it with other middleware, or at least a default handler:

```js
import {compose} from 'passing-notes'
import serveStatic from 'passing-notes-static'

export default compose(
  serveStatic('./'),
  () => () => ({status: 404})
)
```

`serveStatic` will resolve files within and relative to the given directory.
When it can't find a file, it will delegate to the next middleware.
