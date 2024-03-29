# pdfmaker

![logo](./assets/pdf-maker.svg)

[![Docker](https://badgen.net/badge/icon/docker?icon=docker&label)](https://hub.docker.com/repository/docker/rocketbaseio/pdfmaker)

Docker service of [pdfmake](http://pdfmake.org/) - with pdf merge feature by use of [pdf-merger-js](https://www.npmjs.com/package/pdf-merger-js).

# API
There are two API endpoints:
- [POST] /pdf/file requires a JSON object
- [POST] /pdf/files requires an array of JSON objects


For documentation to the JSON objects which are describe the content of the PDFs, [look here at the pdfmake documentation](https://pdfmake.github.io/docs/).

## Fonts
Beside the default fonts: Times, Helvetica, Courier, Symbol the follow list of fonts is installed too:
- Roboto
- JosefinSans
- Lato
- OpenSans
- Poppins
- Merriweather

## Image URLs
Also fallback URLs are supported. These urls can either be given per image or global on the object. Example:

```json
{
  "content": [
    {
      "image": "https://example.com/img/logo.png",
      "fallback": "https://example.com/img/logo-placeholder.png"
    }
  ],
  "fallbackImage": "https://example.com/img/placeholder.png"
}
```

**Note:** Only PNGs and JPGs are supported.
**Note:** When the download of an image + fallback fails the service will fallback to 1x1 purple png


## SVG URLs
Downloading SVGs from urls is supported. It is nearly the same as Image URLs expect that it is also possible to give the SVG as string. Example:
```json
{
  "content": [
    {
      "svg": "https://example.com/img/logo.svg"
    },
    {
      "svg": "<svg width=\"300\" height=\"200\" viewBox=\"0 0 300 200\"><text x=\"0\" y=\"50\">Example Image</text></svg>"
    }
  ]
}
```

**Note:** Fallbacks are not supported.
**Note:** When the download of an SVG fails, the service will fallback to 1x1 purple png

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

## Merging PDFS
To merge multiple PDFs, an array of pdfmake json-objects have to be used as an input.

```json
[
  {
    "content": 
    [
        {"text": "Thats the content of the first page."}
    ]
  },
  {
    "content": 
    [
      {
        "text": "Thats the content of the second page."
      }
    ]
  }
]
```

**Note:** When merging multiple pdfs with each having separate ```pageNumber``` options. Each pdf will determine its page count independently. 

