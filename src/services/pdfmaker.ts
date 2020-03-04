import {Request, Response} from 'express';
import {Post, Service} from '../decorators';
import {createReadStream, createWriteStream} from 'fs';
import {Readable, Writable} from 'stream';
import {downloadCache, downloadIntoSvg, downloadIntoTemporaryFile, temporaryFile} from '../utils';
// @ts-ignore
import pdftk from 'node-pdftk';
// @ts-ignore
import PdfPrinter from 'pdfmake';
import {defaultFonts, Fonts, resolveFont} from '../fonts';
import {Cache} from '../cache';

async function replaceImages(options: any, fallbackImage: string | null, fallbackSvg: string | null, cache: Cache<string, string>) {
  if (typeof options !== 'object' || options === null) return;
  if (Array.isArray(options)) {
    for (let current of options) {
      await replaceImages(current, fallbackImage, fallbackSvg, cache);
    }
  } else {
    for (let key of Object.keys(options)) {
      if (key === 'image') {
        const urls = [options.image];
        if (options.fallback)
          urls.push(options.fallback);
        if (fallbackImage)
          urls.push(fallbackImage);
        // default a 1x1 transparent png
        urls.push(process.env.IMAGE_FALLBACK ??
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
        options.image = await downloadIntoTemporaryFile(urls, cache);
      } else if (key === 'svg') {
        const svg: string = options.svg;
        if (!svg.startsWith('<svg ')) {
          const urls = [svg];
          if (options.fallback)
            urls.push(options.fallback);
          if (fallbackSvg)
            urls.push(fallbackSvg);
          urls.push(process.env.SVG_FALLBACK ?? '<svg width="1" height="1" viewBox="0 0 1 1"></svg>');
          options.svg = await downloadIntoSvg(urls, cache);
        }
      } else {
        await replaceImages(options[key], fallbackImage, fallbackSvg, cache);
      }
    }
  }
}

function renderTemplate(template: any, variables: Record<string, any>): any {
  if (typeof template === 'string') {
    let result = template;
    Object.keys(variables).forEach(key => result = result.replace(RegExp('\\$' + key + '\\$', 'g'), variables[key]));
    return result;
  }

  if (typeof template !== 'object' || template === null) {
    return template;
  }

  if (Array.isArray(template)) {
    return template.map(value => renderTemplate(value, variables));
  }

  const result = Object.assign({}, template);
  Object.keys(result).forEach(key => result[key] = renderTemplate(result[key], variables));
  return result;
}

@Service('/')
export class PdfService {
  @Post('/file')
  public async file(req: Request, res: Response) {
    try {
      await this.generatePdf(req.body, res, () => this.pdfResponse(res, req.query.filename));
    } catch (err) {
      res
        .status(400)
        .send({message: err.message});
    }
  }

  /*
  For a single PDF
   */
  @Post('/files')
  public async files(req: Request, res: Response) {
    const cleanup: (() => void)[] = [];
    try {
      const pdfFiles: string[] = [];
      for (const configuration of req.body) {
        const {path, removeCallback} = await temporaryFile();
        cleanup.push(removeCallback);
        const fileStream = createWriteStream(path);
        await this.generatePdf(configuration, fileStream, () => {
        });
        pdfFiles.push(path);
      }

      const {path, removeCallback} = await temporaryFile();
      await pdftk
        .input(pdfFiles)
        .output(path);

      cleanup.forEach(value => value());

      this.pdfResponse(res, req.query.filename);
      createReadStream(path)
        .pipe(res)
        .once('end', () => removeCallback())
        .once('error', () => removeCallback());
    } catch (err) {
      cleanup.forEach(value => value());
      res
        .status(400)
        .send({message: err.message});
    }
  }

  public pdfResponse(res: Response, filename: string): void {
    if (typeof filename === 'undefined') filename = 'download.pdf';
    if (!filename.endsWith('.pdf')) filename += '.pdf';
    res.setHeader('Content-Disposition', 'attachment; filename=' + filename);
    res.setHeader('Content-Transfer-Encoding', 'binary');
    res.setHeader('Content-Type', 'application/pdf');
  }

  /*
  Concat single PDFs
   */
  public async generatePdf(options: any, output: Writable, beforeWrite: () => void): Promise<void> {
    const imageCache = new Cache<string, string>(undefined, downloadCache, undefined, key => !key.startsWith('data:'));
    await replaceImages(options, options.fallbackImage ?? null, options.fallbackSvg ?? null, imageCache);
    if (options.pageNumber) {
      const template = options.pageNumber;
      options.footer = (currentPage: number, pageCount: number) => renderTemplate(template, {currentPage, pageCount});
      delete options.pageNumber;
    }
    let fonts: Fonts = defaultFonts;
    if (options.fonts) {
      fonts = options.fonts;
      for (const fontName of Object.keys(fonts)) {
        fonts[fontName] = await resolveFont(fonts[fontName], fontName);
      }
      delete options.fonts;
    }
    const printer = new PdfPrinter(fonts);
    const doc: Readable & { end(): void } = printer.createPdfKitDocument(options);
    beforeWrite();
    doc.pipe(output, {end: true});
    doc.once('end', () => imageCache.transferIntoParent());
    doc.once('error', err => {
      console.error('error creating pdf', err);
      imageCache.transferIntoParent();
    });
    doc.end();
  }
}
