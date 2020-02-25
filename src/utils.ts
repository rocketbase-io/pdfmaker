import {dir, file, fileSync} from 'tmp';
import {createWriteStream, rmdirSync} from 'fs';
import {get} from 'https';
import {join} from 'path';
import {IncomingMessage} from 'http';

type TemporaryResult = { path: string, removeCallback: () => void };

export function temporaryDirectory(): Promise<TemporaryResult> {
  return new Promise<TemporaryResult>((resolve, reject) => {
    dir((err, name) => {
      if (err) {
        reject(err);
      } else {
        resolve({path: name, removeCallback: () => rmdirSync(name, {recursive: true})});
      }
    });
  });
}

export function temporaryFile(): Promise<TemporaryResult> {
  return new Promise<TemporaryResult>((resolve, reject) => {
    file((err, name, fd, removeCallback) => {
      if (err) {
        reject(err);
      } else {
        resolve({path: name, removeCallback});
      }
    });
  });
}

export function downloadIntoTemporaryFile(url: string, directory?: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    downloadFile(url)
      .then(res => {
        let filePath: string;
        if (directory) {
          const filename = Math.random().toString();
          filePath = join(directory, filename);
        } else {
          filePath = fileSync().name;
        }
        const fileStream = createWriteStream(filePath);
        res.pipe(fileStream, {end: true});

        fileStream.once('finish', () => resolve(filePath));
      })
      .catch(reject);
  });
}

export function downloadIntoString(url: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    downloadFile(url)
      .then(res => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.once('end', () => resolve(body));
      })
      .catch(reject);
  });
}

function downloadFile(url: string): Promise<IncomingMessage> {
  if (url.startsWith('http:')) {
    return Promise.reject(new Error('Downloads are only supported from HTTPS urls: ' + url));
  } else if (url.startsWith('https:')) {
    return new Promise<IncomingMessage>((resolve, reject) => {
      get(url, res => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to download file ${res.statusCode} ${res.statusMessage} from: ${url}`));
          return;
        }
        resolve(res);
      }).on('error', reject);
    });
  } else {
    return Promise.reject(new Error('Invalid download url: ' + url));
  }
}
