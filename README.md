# pdfmaker

![logo](assets/pdf-maker.svg)

[![Build Status](https://travis-ci.com/rocketbase-io/pdfmaker.svg?branch=master)](https://travis-ci.com/rocketbase-io/pdfmaker)
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

# Configurations and Enhancements
In order to secure the services we only allow posting jsons. Therefor we added some extensions to the common pdfmake json-structure to provide similar features like page-numbers or custom-fonts.

| Configuration       | Default             | Description                                                          |
| ------------------- | ------------------- | -------------------------------------------------------------------- |
| DOCUMENT_SIZE_LIMIT | 5mb                 | for parsing we use body-parser that has a limit in parsing the jsons |
| IMAGE_FALLBACK      | 1x1 transparent png | last fallback when all previous urls failed to download for images   |
| SVG_FALLBACK        | 1x1 empty SVG       | last fallback when all previous urls failed to download for SVGs     |
| MAX_DOWNLOAD_CACHE  | 2000                | the number of images, SVGs and fonts which are caches before deleted |


## Image URLs
Images with urls are supported. Example:

```json
{
  "content": [
    {
      "image": "https://example.com/img/logo.png"
    }
  ]
}
```

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

In this case the service will first try to download the `logo.png`, if that fails the `logo-placeholder.png`, and if that fails too
the `placeholder.png` file, and if that fails too the file from the environment variable `IMAGE_FALLBACK`.

**Note:** Only PNGs and JPGs are supported.

**Note:** When the download of an image fails (and all fallbacks), the service will break with 400.

**Note:** Data URLs are also supported but not recommended since they can cause a 413 error.

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

Fallbacks are supported just like for images, but ues the property `fallbackSvg` to define a global fallback for the document and the
environment variables `SVG_FALLBACK`.

**Note:** Only HTTPS urls are supported!

**Note:** When the download of a SVG fails (and all fallbacks), the service will break with 400.

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
Copyright (c) 2020 rocketbase.io

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
