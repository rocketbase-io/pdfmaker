import {NextFunction, Request, Response} from 'express';
import {Post, Service} from '../decorators';
import {get} from 'https';
import {join} from 'path';
import {createReadStream, createWriteStream} from 'fs';
// @ts-ignore
import pdftk from 'node-pdftk';
// @ts-ignore
import PdfPrinter from 'pdfmake';
import {Readable, Writable} from 'stream';
import {temporaryDirectory, temporaryFile} from '../utils';

const fonts = {
  Roboto: {
    normal: 'resources/fonts/Roboto-Regular.ttf',
    bold: 'resources/fonts/Roboto-Medium.ttf',
    italics: 'resources/fonts/Roboto-Italic.ttf',
    bolditalics: 'resources/fonts/Roboto-MediumItalic.ttf'
  },
  Exo: {
    normal: 'resources/fonts/Exo-Medium.ttf',
    bold: 'resources/fonts/Exo-Bold.ttf',
    italics: 'resources/fonts/Exo-Light.ttf',
    bolditalics: 'resources/fonts/Exo-ExtraLight.ttf'
  },
  OpenSans: {
    normal: 'resources/fonts/OpenSans-Regular.ttf',
    bold: 'resources/fonts/OpenSans-Bold.ttf',
    italics: 'resources/fonts/OpenSans-Italic.ttf',
    bolditalics: 'resources/fonts/OpenSans-BoldItalic.ttf'
  }
};

// PDFMake stuff
const printer = new PdfPrinter(fonts);

async function replaceImages(options: any, directory: string) {
  if (typeof options !== 'object' || options === null) return;
  if (Array.isArray(options)) {
    for (let current of options) {
      await replaceImages(current, directory);
    }
  } else {
    for (let key of Object.keys(options)) {
      if (key === 'image') {
        const url = options[key];
        if (url.startsWith('http:')) {
          throw new Error('Image at HTTP urls are not supported! Please use HTTPS.');
        } else if (url.startsWith('https:')) {
          options[key] = await new Promise((resolve, reject) => {
            get(url, res => {
              if (res.statusCode !== 200) {
                reject(new Error(`Failed to download image ${res.statusCode} ${res.statusMessage} from: ${url}`));
                return;
              }
              const filename = Math.random().toString();
              const filePath = join(directory, filename);
              const fileStream = createWriteStream(filePath);
              res.pipe(fileStream, {end: true});

              fileStream.once('finish', () => resolve(filePath));
            }).on('error', reject);
          });
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
  public async file(req: Request, res: Response, next: NextFunction) {
    try {
      this.pdfResponse(res, req.query.filename);
      await this.generatePdf(req.body, res);
    } catch (err) {
      next(err);
    }
  }

  /*
  For a single PDF
   */
  @Post('/files')
  public async files(req: Request, res: Response, next: NextFunction) {
    const cleanup: (() => void)[] = [];
    try {
      const pdfFiles: string[] = [];
      for (const configuration of req.body) {
        const {path, removeCallback} = await temporaryFile();
        cleanup.push(removeCallback);
        const fileStream = createWriteStream(path);
        await this.generatePdf(configuration, fileStream);
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
      next(err);
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
  public async generatePdf(options: any, output: Writable): Promise<void> {
    const {path: imageDirectory, removeCallback: cleanImages} = await temporaryDirectory();
    await replaceImages(options, imageDirectory);
    if (options.ensureIdNotBreak) {
      const id = options.ensureIdNotBreak;
      options.pageBreakBefore = (currentNode: any) => currentNode.id === id && currentNode.pageNumbers.length > 1;
      delete options.ensureIdNotBreak;
    }
    if (options.pageNumber) {
      const template = options.pageNumber;
      options.footer = (currentPage: number, pageCount: number) => renderTemplate(template, {currentPage, pageCount});
      delete options.pageNumber;
    }
    const doc: Readable & { end(): void } = printer.createPdfKitDocument(options);
    doc.pipe(output, {end: true});
    doc.once('end', () => cleanImages());
    doc.once('error', err => {
      console.error('error creating pdf', err);
      cleanImages();
    });
    doc.end();
  }
}
