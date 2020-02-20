import {NextFunction, Request, Response} from 'express';
import {Post, Service} from '../decorators';
import {promisify} from 'util';
import {get} from 'https';

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
//PDFMake stuff
const PdfPrinter = require('pdfmake');
let printer = new PdfPrinter(fonts);

//Concat pdfs
const pdftk = require('node-pdftk');

async function replaceImages(options: any) {
  if (typeof options !== 'object' || options === null) return;
  if (Array.isArray(options)) {
    for (let current of options) {
      await replaceImages(current);
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
              if (res.statusCode !== 200) reject(new Error(`HTTP ${res.statusCode} on: GET ${url}`));
              const chunks: Uint8Array[] = [];

              res.on('data', chunks.push.bind(chunks));
              res.on('end', () => resolve(Buffer.concat(chunks)));
            }).on('error', reject);
          });
        }
      } else {
        await replaceImages(options[key]);
      }
    }
  }
}


@Service("/")
export class PdfService {
  @Post("/file")
  public async file(req: Request, res: Response, next: NextFunction) {

    try {
      this.pdfResponse(res, await this.generatePdf(req.body), req.query.filename);
    } catch (err) {
      next(err);
    }
  }

  /*
  For a single PDF
   */
  @Post("/files")
  public async files(req: Request, res: Response, next: NextFunction) {
    try {
      const pdfs = await Promise.all(req.body.map(this.generatePdf));
      const result = await pdftk.input(pdfs).output();
      this.pdfResponse(res, result, req.query.filename);
    } catch (err) {
      next(err);
    }
  }

  public pdfResponse(res: Response, content: Buffer, filename: string): void {
    if (typeof filename === 'undefined') filename = "download.pdf";
    if (!filename.endsWith(".pdf")) filename += ".pdf";
    res.setHeader('Content-Disposition', 'attachment; filename=' + filename);
    res.setHeader('Content-Transfer-Encoding', 'binary');
    res.setHeader('Content-Type', 'application/octet-stream');
    res.end(content, 'binary');
  }


  /*
  Concat single PDFs
   */
  public async generatePdf(options: any): Promise<Buffer> {
    await replaceImages(options);
    if (options.ensureIdNotBreak) {
      const id = options.ensureIdNotBreak;
      options.pageBreakBefore = (currentNode: any) => currentNode.id === id && currentNode.pageNumbers.length > 1;
      delete options.ensureIdNotBreak;
    }
    return await new Promise((resolve, reject) => {
      try {
        const doc = printer.createPdfKitDocument(options);
        const chunks: Uint8Array[] = [];

        doc.on('data', chunks.push.bind(chunks));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
