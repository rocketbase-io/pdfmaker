# pdfmaker

![logo](assets/pdf-maker.svg)

[![Build Status](https://travis-ci.org/rocketbase-io/pdfmaker.svg?branch=master)](https://travis-ci.org/rocketbase-io/pdfmaker)
[![Docker-Hub](https://images.microbadger.com/badges/version/rocketbaseio/pdfmaker.svg)](https://cloud.docker.com/repository/docker/rocketbaseio/pdfmaker)

docker service of [pdfmake](http://pdfmake.org/) - with pdf merge feature by use of [node-pdftk](https://www.npmjs.com/package/node-pdftk).

# API
There are two api-endpoints:
* [POST] _/file_ requires a JSON object
  * optional query parameter is _filename_ to specify the download-name of the pdf
* [POST] _/files_ requires an array of JSON documents
  * merges multiple pdfmake pdf (with different header/footer etc) into one doc
  * same query parameter _filename_

For documentation to the JSON objects which are describe the content of the PDFs, [look here at the pdfmake documentation](https://pdfmake.github.io/docs/).

There are a few extra enhancements:
## Make elements unbreakable
When you want to ensure that a set of elements never break onto multiple pages you can use this property. Example:
```json
{
  "content": [
    {
      "stack": [
        {"id": "element", "some": "content"},
        {"id": "element", "some": "content"},
        {"id": "element", "some": "content"}
      ]
    }
  ],
  "ensureIdNotBreak": "element"
}
```
Then you get a list of your elements, where each element is only on one page (as long as a element fits on a page).
## Image URLs
Images with urls are supported. In the pdfmake documentation only data urls and local path are listed. But using image urls are recommended,
because encoding all image as base64 and use data urls can cause into a 413 error. Example:

```json
{
  "content": [
    {
      "image": "https://example.com/img/logo.png"
    }
  ]
}
```

**Note:** Only HTTPS urls are supported!

**Note:** Only PNGs and JPGs are supported.

**Note:** When the download of an image fails, the service will break with a 400 error.

## Page numbers
To add a page number on at the footer of each page, you can use this property. This property accepts an element for pdfmake.

**Note:** this property will override the `footer` property!

Example:
```json
{
  "pageNumber": {
    "text": "Page $currentPage$ of $pageCount$ pages",
    "alignment": "center",
    "bold": true
  }
}
```
In all strings found in the element all $currentPage$ and $pageCount$ occurrences will be replaced except in image urls.
## Custom fonts
To custom/own fonts, you can use this property.
Example:
```json
{
  "fonts": {
    "Exo": "google-fonts:Exo",
    "Exo 2": {
      "normal": "https://example.com/fonts/exo-2-regular.ttf",
      "italics": "https://example.com/fonts/exo-2-italics.ttf",
      "bold": "https://example.com/fonts/exo-2-bold.ttf",
      "bolditalics": "https://example.com/fonts/exo-2-bold-italics.ttf"
    }
  }
}
```
You can either add a Google Fonts service url or an object urls to the font.

**Note:** Only HTTPS urls are supported!

**Note:** Only TrueType Fonts (TTF) are supported.

**Note:** When the download of a font fails, the service will break with a 400 error.

**Note:** When the `fonts` property is not given, the default fonts Roboto, OpenSans and Exo will be included into the document.

A Google Fonts service url can look like something like that:
* `google-fonts:Exo`
* `google-fonts:Exo 2:Regular,Bold`
* `google-fonts:Exo:Regular,Italics,Bold,BoldItalics`
Schema:
* `google-fonts:[font-name]`
* `google-fonts:[font-name]:[regular variant],[bold variant]`
* `google-fonts:[font-name]:[regular variant],[bold variant],[italic variant],[bold italic variant]`

The variant is the suffix in the filename when downloading the zip archive with all fonts from the google fonts page. It must be one of theses:

**Note:** Not in all fonts, all variants are available. When a variant is not available the service will break with a 400 error.
* `Thin`
* `ThinItalic`
* `Light`
* `LightItalic`
* `Regular`
* `Italic`
* `Medium`
* `MediumItalic`
* `SemiBold`
* `SemiBoldItalic`
* `Bold`
* `BoldItalic`
* `ExtraBold`
* `ExtraBoldItalic`
* `Black`
* `BlackItalic`

# Usage

I've you run it locally the host needs pdfpk installed.

**WARNING**: for mac users [take a look here](https://github.com/jjwilly16/node-pdftk/issues/3)

```shell script
npm run build && npm run start
```

### The MIT License (MIT)
Copyright (c) 2019 rocketbase.io

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
