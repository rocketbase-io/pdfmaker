import {NextFunction, Request, Response} from "express";
import {Post, Service} from "../decorators";

const fonts = {
  Roboto: {
    normal: 'resources/fonts/Roboto-Regular.ttf',
    bold: 'resources/fonts/Roboto-Medium.ttf',
    italics: 'resources/fonts/Roboto-Italic.ttf',
    bolditalics: 'resources/fonts/Roboto-MediumItalic.ttf'
  }
};
//PDFMake stuff
const PdfPrinter = require('pdfmake');
let printer = new PdfPrinter(fonts);

//Concat pdfs
const pdftk = require('node-pdftk');

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
  public generatePdf(options: any): Promise<Buffer> {
    return new Promise(((resolve, reject) => {
      try {

        const doc = printer.createPdfKitDocument(options);
        const chunks: Uint8Array[] = [];

        doc.on('data', chunks.push.bind(chunks));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.end();

      } catch (err) {
        reject(err);
      }
    }))
  }


}
