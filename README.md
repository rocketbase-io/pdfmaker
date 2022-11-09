# pdfmaker

![logo](https://github.com/rocketbase-io/pdfmaker/raw/master/assets/pdf-maker.svg)

[![Docker](https://badgen.net/badge/icon/docker?icon=docker&label)](https://cloud.docker.com/repository/docker/rocketbaseio/pdfmaker)

Docker service of [pdfmake](http://pdfmake.org/) - with pdf merge feature by use of [pdf-merger-js](https://www.npmjs.com/package/pdf-merger-js).

# API
There are two API endpoints:
- [POST] /rest/pdf requires a JSON object
- [POST] /rest/pdf/merge requires an array of JSON objects


For documentation to the JSON objects which are describe the content of the PDFs, [look here at the pdfmake documentation](https://pdfmake.github.io/docs/).

## Image URLs
External images can be used via an URL:

```json
{
  "content": [
    {
      "image": "https://example.com/img/logo.png"
    }
  ]
}
```
## Page numbers
To add a page number on at the footer of each page, you can use this property. This property accepts an element for pdfmake.

**Note:** this property will override the `footer` property!

Example:
```json
{
  "pageNumber": {
    "text": "Page $currentPage$ of $pageCount$ pages",
    "alignment": "center"
  }
}
```

In all strings found in the element all $currentPage$ and $pageCount$ occurrences will be replaced.