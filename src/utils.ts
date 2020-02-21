import {dir, file} from 'tmp';
import {rmdirSync} from 'fs';

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
