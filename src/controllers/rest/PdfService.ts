import {fileSync} from "tmp";
import {createWriteStream} from "fs";
import {Readable} from "stream";
import {ClientRequest, get as httpGet, IncomingMessage} from "http";
import {get as httpsGet} from "https";
import PdfPrinter from "pdfmake";

export async function generatePdf(docDefinition : any): Promise<Buffer> {
    await replaceImages(docDefinition);
    return new Promise((resolve) => {
        const fonts = {
            Roboto: {
                normal: 'assets/fonts/Roboto-Italic.ttf',
                bold: 'assets/fonts/Roboto-Italic.ttf',
                italics: 'assets/fonts/Roboto-Italic.ttf'
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

/*** Saves image to a temporary file */
async function imageToDataUrl(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        downloadFile(url).then((res)=> {
            const filePath = fileSync().name;
            const fileStream = createWriteStream(filePath);
            res.pipe(fileStream, {end: true});

            fileStream.once('finish', () => {
                console.log(filePath);
                resolve(filePath)
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
        return Promise.reject(new Error('Invalid download url: ' + url));
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
export const replaceImages = async (doc: any) => {

    if (typeof doc !== 'object' || doc === null) return;

    if (Array.isArray(doc)) {
        for (let current of doc) {
            await replaceImages(current);
        }
    } else if (typeof doc === 'object' && !!doc) {
        for (let key in doc) {
            if (key === 'image') {
                doc[key] = await imageToDataUrl(doc[key]);
                //DEBUG: console.log("Image replaced!");
            } else {
                await replaceImages(doc[key]);
            }
        }
    }
};