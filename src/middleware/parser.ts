import parser from "body-parser";

export const parserURlencodedMiddleware = parser.urlencoded({extended: true});
export const parserJsonMiddleware = parser.json();
