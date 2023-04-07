import {fileSync} from "tmp";
import {createWriteStream} from "fs";
import {Readable} from "stream";
import {ClientRequest, get as httpGet, IncomingMessage} from "http";
import {get as httpsGet} from "https";
import PdfPrinter from "pdfmake";
import {ValidationError} from "@tsed/platform-params";
import PdfMerger from 'pdf-merger-js';

export async function generatePdf(docDefinition : any): Promise<Buffer> {

    await generatePageNumbers(docDefinition);
    await replaceImages(docDefinition);

    return new Promise((resolve) => {
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
            }
        };

        const printer = new PdfPrinter(fonts);
        const doc = printer.createPdfKitDocument(docDefinition);

        let chunks : any[] = [];
        let result;

        doc.on('data', (chunk : string) => {
            chunks.push(chunk);
        });

        doc.on('end', () => {
            result = Buffer.concat(chunks);
            resolve(result);
        });

        doc.end();
    })
}

export async function generateMultiplePdfs(docs : [any]) : Promise<Buffer> {
    let pdfMerger = new PdfMerger();

    if(!Array.isArray(docs)) throw new ValidationError("Input has to be an array.");
    for(let doc of docs) {
        await pdfMerger.add(await generatePdf(doc));
    }

    return pdfMerger.saveAsBuffer();
}

async function svgToDataUrl(url: string) : Promise<string> {
    if (url.startsWith('<svg ')) return Promise.resolve(url);
    return new Promise((resolve, reject) => {
        downloadFile(url).then((res)=> {
            let dataUrl = '';
            res.on('data', chunk => dataUrl += chunk);
            res.once('end', () => {
                console.log(dataUrl);
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
async function imageToDataUrl(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        downloadFile(url).then((res)=> {
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

function downloadFile(url: string): Promise<Readable> {
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
async function replaceImages(doc: any) {

    if (typeof doc !== 'object' || doc === null) return;

    if (Array.isArray(doc)) {
        for (let current of doc) {
            await replaceImages(current);
        }
    } else if (typeof doc === 'object' && !!doc) {
        for (let key in doc) {
            if (key === 'image') {
                doc[key] = await imageToDataUrl(doc[key])
                    .catch(error => {
                        throw new ValidationError("Couldn't resolve image(s). " + error);
                    });
            }else if(key === 'svg') {
                doc[key] = await svgToDataUrl(doc[key])
                    .catch(error => {
                        throw new ValidationError("Couldn't resolve svg(s). " + error);
                    });
            }else {
                await replaceImages(doc[key]);
            }
        }
    }
}

function generatePageNumbers(doc: any) {
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