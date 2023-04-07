import {fileSync} from "tmp";
import {createWriteStream} from "fs";
import {Readable} from "stream";
import {ClientRequest, get as httpGet, IncomingMessage} from "http";
import {get as httpsGet} from "https";
import PdfPrinter from "pdfmake";
import {ValidationError} from "@tsed/platform-params";
import PdfMerger from 'pdf-merger-js';
import {fileTypeFromStream, FileTypeResult} from "file-type/core";
import {Readable as ReadableStream} from "node:stream";
import {Inject} from "@tsed/di";
import {Logger} from "@tsed/common";


const imagePlaceholder = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const fonts = {
    Roboto: {
        normal: 'assets/fonts/Roboto-Regular.ttf',
        bold: 'assets/fonts/Roboto-Bold.ttf',
        italics: 'assets/fonts/Roboto-Italic.ttf',
        bolditalics: 'assets/fonts/Roboto-BoldItalic.ttf'
    },
    JosefinSans: {
        normal: 'assets/fonts/JosefinSans-Regular.ttf',
        bold: 'assets/fonts/JosefinSans-Bold.ttf',
        italics: 'assets/fonts/JosefinSans-Italic.ttf',
        bolditalics: 'assets/fonts/JosefinSans-BoldItalic.ttf'
    },
    Lato: {
        normal: 'assets/fonts/Lato-Regular.ttf',
        bold: 'assets/fonts/Lato-Bold.ttf',
        italics: 'assets/fonts/Lato-Italic.ttf',
        bolditalics: 'assets/fonts/Lato-BoldItalic.ttf'
    },
    OpenSans: {
        normal: 'assets/fonts/OpenSans-Regular.ttf',
        bold: 'assets/fonts/OpenSans-Bold.ttf',
        italics: 'assets/fonts/OpenSans-Italic.ttf',
        bolditalics: 'assets/fonts/OpenSans-BoldItalic.ttf'
    },
    Poppins: {
        normal: 'assets/fonts/Poppins-Regular.ttf',
        bold: 'assets/fonts/Poppins-Bold.ttf',
        italics: 'assets/fonts/Poppins-Italic.ttf',
        bolditalics: 'assets/fonts/Poppins-BoldItalic.ttf'
    },
    Merriweather: {
        normal: 'assets/fonts/Merriweather-Regular.ttf',
        bold: 'assets/fonts/Merriweather-Bold.ttf',
        italics: 'assets/fonts/Merriweather-Italic.ttf',
        bolditalics: 'assets/fonts/Merriweather-BoldItalic.ttf'
    }
};

export class PdfService {
    @Inject()
    logger: Logger;

    public async generateMultiplePdfs(docs : [any]) : Promise<Buffer> {
        let pdfMerger = new PdfMerger();

        if(!Array.isArray(docs)) throw new ValidationError("Input has to be an array.");
        for(let doc of docs) {
            const inputFile = await this.generatePdf(doc);
            await pdfMerger.add(inputFile);
        }

        return pdfMerger.saveAsBuffer();
    }

    public async generatePdf(docDefinition : any): Promise<Buffer> {

        await this.generatePageNumbers(docDefinition);
        await this.replaceImages(docDefinition, docDefinition.fallbackImage ?? null );

        return new Promise((resolve, reject) => {
            try {
                const printer = new PdfPrinter(fonts);
                const doc = printer.createPdfKitDocument(docDefinition);

                let chunks: any[] = [];
                let result;

                doc.on('data', (chunk: string) => {
                    chunks.push(chunk);
                });

                doc.on('end', () => {
                    result = Buffer.concat(chunks);
                    resolve(result);
                });

                doc.end();
            } catch (error) {
                this.logger.error(`pdf processing-error: ${error}`)
                reject(error)
            }
        })
    }

    private svgToDataUrl(url: string) : Promise<string> {
        if (url.startsWith('<svg ')) return Promise.resolve(url);
        return new Promise((resolve, reject) => {
            this.downloadFile(url).then((res)=> {
                let dataUrl = '';
                res.on('data', chunk => dataUrl += chunk);
                res.once('end', () => {
                    if (!dataUrl.startsWith('<svg ')) reject(new ValidationError("The file isn't auf type svg. URL: " + url));
                    resolve(dataUrl)
                });
                res.on('error', error => reject(error));
            }).catch(error => {
                reject(error);
            });
        });
    }

    /*** Saves image to a temporary file */
    private async imageToDataUrl(url: string): Promise<string> {
        if (url.startsWith('data')) return Promise.resolve(url);

        return new Promise((resolve, reject) => {
            this.downloadFile(url).then((res)=> {
                const filePath = fileSync().name;
                const fileStream = createWriteStream(filePath);
                res.pipe(fileStream, {end: true});

                fileStream.once('finish', () => {
                    resolve(filePath);
                });
            }).catch(error => {
                reject(error);
            });

        });
    }

    private downloadFile(url: string): Promise<Readable> {
        let requestFunction: (url: string, callback: (res: IncomingMessage) => void) => ClientRequest;
        if (url.startsWith('http:')) {
            requestFunction = httpGet;
        } else if (url.startsWith('https:')) {
            requestFunction = httpsGet;
        } else {
            throw new ValidationError("Image url doesnt start with http:// or https://");
        }

        return new Promise<IncomingMessage>((resolve, reject) => {
            requestFunction(url, res => {
                if (res.statusCode !== 200) {
                    reject(new Error(`Failed to download file ${res.statusCode} ${res.statusMessage} from: ${url}`));
                    return;
                }
                resolve(res);
            }).on('error', reject);
        });
    }

    /***Loops recursively through the doc to find every image url and replace it
     * with an image path which is previously downloaded and temporally saved*/
    private async replaceImages(doc: any, fallbackImage: string | null) {

        if (typeof doc !== 'object' || doc === null) return;

        if (Array.isArray(doc)) {
            for (let current of doc) {
                await this.replaceImages(current, fallbackImage);
            }
        } else if (typeof doc === 'object' && !!doc) {
            for (let key in doc) {
                if (key === 'image') {
                    try {
                        doc[key] = await this.imageToDataUrl(doc[key]);
                    } catch (error) {
                        this.logger.trace(`problems with url: ${doc[key]} -> ${error.message}`)
                        let image = null;
                        try {
                            if (doc.fallback) {
                                image = await this.imageToDataUrl(doc.fallback);
                            } else if (fallbackImage) {
                                image = await this.imageToDataUrl(fallbackImage);
                            }
                        } catch (secondError) {
                            this.logger.warn(`fallback also not working: ${secondError.message}`)
                        } finally {
                            doc[key] = image ?? imagePlaceholder;
                        }
                    }
                }else if(key === 'svg') {
                    doc[key] = await this.svgToDataUrl(doc[key])
                        .catch(error => {
                            this.logger.warn(`couldn't fetch svg: ${doc[key]} -> ${error.message}`)
                            doc[key] = imagePlaceholder;
                        });
                }else {
                    await this.replaceImages(doc[key], fallbackImage);
                }
            }
        }
    }

    private generatePageNumbers(doc: any) {
        if(doc.pageNumber === undefined) return;
        const template = doc.pageNumber;

        //TODO: More styling options -> convert input to its own style dictionary
        doc.footer = (currentPage : Number, pageCount : Number) : Object => {
            return [
                {
                    text: template.text.replace("$currentPage$", currentPage).replace("$pageCount$", pageCount),
                    //Checks for alignment property -> defaults to "center" on wrong/none input
                    alignment: ["center", "right", "left"].includes(template.alignment) ? template.alignment : "center"
                }
            ]
        }

        delete doc.pageNumber;
    }
}
