/*Ts.ED imports*/
import {Controller} from "@tsed/di";
import {ContentType, Post} from "@tsed/schema";
import {BodyParams} from "@tsed/platform-params";

/*Service*/
import {generateMultiplePdfs, generatePdf} from "./PdfService";


@Controller('/pdf')
export class PdfController {
    @Post("/file")
    @ContentType("application/pdf")
    async createPdf(@BodyParams() doc: Object): Promise<Buffer> {
        return generatePdf(doc);
    }
    @Post("/files")
    @ContentType("application/pdf")
    async mergePdfs(@BodyParams() docs :  [Object]) : Promise<Buffer> {
        return generateMultiplePdfs(docs);
    }
}