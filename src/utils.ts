import {file, fileSync} from 'tmp';
import {createWriteStream, unlinkSync} from 'fs';
import {get as httpsGet} from 'https';
import {ClientRequest, get as httpGet, IncomingMessage} from 'http';
import {Cache} from './cache';
import {Readable} from 'stream';

type TemporaryResult = { path: string, removeCallback: () => void };

export const downloadCache = new Cache<string, string>(parseInt(process.env.MAX_DOWNLOAD_CACHE ??
  '2000'), undefined, (key, value) => unlinkSync(value), key => !key.startsWith('data:'));
process.addListener('beforeExit', () => downloadCache.destroy());

export function temporaryFile(): Promise<TemporaryResult> {
  return new Promise<TemporaryResult>((resolve, reject) => {
    file((err, name, fd, removeCallback) => {
      if (err) {
        console.error("could not create temporary file", err);
        reject(err);
      } else {
        resolve({path: name, removeCallback});
      }
    });
  });
}

export function downloadIntoTemporaryFile(url: string[], cache?: Cache<string, string>): Promise<string> {
  return (cache ?? downloadCache).getOrComputeAsync(url[0], () =>
    new Promise<string>((resolve, reject) => {
      console.log("downloadIntoTemporaryFile ....", url[0]);
      if (url[0].startsWith('data:')) {
        resolve(url[0]);
        return;
      }
      downloadFile(url[0])
        .then(res => {
          const filePath = fileSync().name;
          const fileStream = createWriteStream(filePath);
          res.pipe(fileStream, {end: true});

          fileStream.once('finish', () => resolve(filePath));
        })
        .catch(reason => {
          console.log("could not download "+url[0], reason);
          if (url.length > 1) {
            downloadIntoTemporaryFile(url.filter((value, index) => index > 0), cache)
              .then(resolve)
              .catch(reject);
          } else {
            reject(reason);
          }
        });
    }));
}

export function downloadIntoSvg(url: string[], cache?: Cache<string, string>): Promise<string> {
  if (url[0].startsWith('<svg ')) return Promise.resolve(url[0]);
  return (cache ?? downloadCache).getOrComputeAsync(url[0], () =>
    new Promise<string>((resolve, reject) => {
      downloadFile(url[0])
        .then(res => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.once('end', () => resolve(body));
        })
        .catch(reason => {
          if (url.length > 1) {
            return downloadIntoTemporaryFile(url.filter((value, index) => index > 0), cache);
          } else {
            reject(reason);
          }
        });
    }));
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
