import {Request, Response} from 'express';
import {Post, Service} from '../decorators';
import {createReadStream, createWriteStream} from 'fs';
import {Readable, Writable} from 'stream';
import {downloadIntoString, downloadIntoTemporaryFile, temporaryDirectory, temporaryFile} from '../utils';
// @ts-ignore
import pdftk from 'node-pdftk';
// @ts-ignore
import PdfPrinter from 'pdfmake';
import {defaultFonts, Fonts, resolveFont} from '../fonts';

async function replaceImages(options: any, directory: string) {
  if (typeof options !== 'object' || options === null) return;
  if (Array.isArray(options)) {
    for (let current of options) {
      await replaceImages(current, directory);
    }
  } else {
    for (let key of Object.keys(options)) {
      if (key === 'image') {
        options.image = await downloadIntoTemporaryFile(options.image, directory);
      } else if (key === 'svg') {
        const svg: string = options.svg;
        if (!svg.startsWith('<svg ')) {
          options.svg = await downloadIntoString(svg);
        }
      } else {
        await replaceImages(options[key], directory);
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
    const {path: imageDirectory, removeCallback: cleanImages} = await temporaryDirectory();
    await replaceImages(options, imageDirectory);
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
    doc.once('end', () => cleanImages());
    doc.once('error', err => {
      console.error('error creating pdf', err);
      cleanImages();
    });
    doc.end();
  }
}
