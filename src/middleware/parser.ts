import parser from "body-parser";

const limit = process.env.DOCUMENT_SIZE_LIMIT ?? '5mb';

export const parserURlencodedMiddleware = parser.urlencoded({extended: true, limit});
export const parserJsonMiddleware = parser.json({limit});

