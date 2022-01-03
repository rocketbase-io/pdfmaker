import {downloadIntoTemporaryFile} from './utils';
import {createReadStream, createWriteStream} from 'fs';
import {Entry, Parse as ParseZip} from 'unzipper';
import {fileSync} from 'tmp';

export type Fonts = Record<string, Font>;
export type Font = FontUrls | string;

export interface FontUrls {
  normal: string;
  bold: string;
  italics: string;
  bolditalics: string;
}

export const defaultFonts: Fonts = {
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

const cachedFonts: Record<string, FontUrls> = {};
const cachedFontUrls: Record<string, string> = {};

async function resolveFontUrl(url: string, name: string): Promise<string> {
  if (!url) {
    throw new Error(`Missing url for: ${name}`);
  }

  if (cachedFontUrls.hasOwnProperty(url)) {
    return cachedFontUrls[url];
  }

  try {
    return cachedFontUrls[url] = await downloadIntoTemporaryFile([url]);
  } catch (err: any) {
    throw new Error(`Error while downloading: ${name}: ${err?.message}`);
  }
}

function createFontFromGoogleFonts(fontUrl: string): Promise<FontUrls> {
  return new Promise<FontUrls>((resolve, reject) => {
    const [fontName, fontVariantsString] = fontUrl.split(':', 2);
    if (!/^[a-zA-Z0-9 ]+$/.test(fontName)) {
      reject(new Error(`Invalid font name: ${fontName}`));
      return;
    }
    let fontVariants: string[];
    if (!fontVariantsString) {
      fontVariants = ['Regular', 'Bold', 'Italic', 'BoldItalic'];
    } else {
      fontVariants = fontVariantsString.split(',');
      if (fontVariants.length === 2) {
        const [regular, bold] = fontVariants;
        if (regular === 'Regular') {
          fontVariants = [regular, bold, 'Italic', bold + 'Italic'];
        } else {
          fontVariants = [regular, bold, regular + 'Italic', bold + 'Italic'];
        }
      } else if (fontVariants.length !== 4) {
        reject(new Error(`Invalid google fonts url: ${fontUrl}`));
        return;
      }
    }
    downloadIntoTemporaryFile([`https://fonts.google.com/download?family=${fontName}`])
      .then(zipFilePath => {
        const result: FontUrls = {
          normal: '',
          bold: '',
          italics: '',
          bolditalics: ''
        };
        let found = 0;
        let done = 0;
        createReadStream(zipFilePath)
          .pipe(ParseZip())
          .on('entry', (entry: Entry) => {
            const regexResult = /^.+-([a-zA-Z]+)\.ttf$/.exec(entry.path);
            if (regexResult) {
              const variant = regexResult[1];
              const variantIndex = fontVariants.indexOf(variant);
              if (variantIndex !== -1) {
                const outputFile = fileSync().name;
                entry.pipe(createWriteStream(outputFile))
                  .once('finish', () => {
                    result[['normal', 'bold', 'italics', 'bolditalics'][variantIndex] as keyof FontUrls] = outputFile;
                    if (++done >= 4) {
                      resolve(result);
                    }
                  });
                found++;
              } else {
                entry.autodrain();
              }
            } else {
              entry.autodrain();
            }
          })
          .on('error', err => reject(new Error(`Could not unpack zip file for font ${fontName}: ${err.message}`)))
          .on('close', () => {
            if (found < 4) {
              reject(new Error(`Font '${fontName}' does not include all variants: ${Object.keys(result).find(e => !(result as any)[e])}`));
            }
          });
      })
      .catch(reject);
  });
}

export async function resolveFont(font: Font, name: string): Promise<FontUrls> {
  if (typeof font === 'string') {
    if (cachedFonts.hasOwnProperty(font)) {
      return cachedFonts[font];
    }
    if (font.startsWith('google-fonts:')) {
      const fontUrl = font.substring(13);
      return cachedFonts[font] = await createFontFromGoogleFonts(fontUrl);
    } else {
      throw Error(`Unknown font service: ${font}`);
    }
  } else {
    return {
      normal: await resolveFontUrl(font.normal, name + ' Normal'),
      bold: await resolveFontUrl(font.bold, name + ' Bold'),
      italics: await resolveFontUrl(font.italics, name + ' Italics'),
      bolditalics: await resolveFontUrl(font.bolditalics, name + ' Bold Italics')
    };
  }
}
