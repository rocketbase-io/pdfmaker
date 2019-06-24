# pdfmaker

![logo](assets/pdf-maker.svg)

[![Build Status](https://travis-ci.org/rocketbase-io/pdfmaker.svg?branch=master)](https://travis-ci.org/rocketbase-io/pdfmaker)

docker service of [pdfmake](http://pdfmake.org/) - with pdf merge feature by use of [node-pdftk](https://www.npmjs.com/package/node-pdftk).

## api
There are two api-endpoints:
* [POST] _/file_ requires a JSON-doc that fits the pdfmake structue
  * optional query parameter is _filename_ to specify the download-name of the pdf
* [POST] _/files_ requires an array of JSON-doc
  * merges multiple pdfmake pdf (with different header/footer etc) into one doc
  * same query parameter _filename_

# usage

I've you run it locally the host needs pdfpk installed.
__WARNING__: for mac users [take a look here](//https://github.com/jjwilly16/node-pdftk/issues/3)

```
npm run build && npm run start
```

### The MIT License (MIT)
Copyright (c) 2019 rocketbase.io

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
