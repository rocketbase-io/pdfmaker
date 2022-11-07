/*Ts.ED imports*/
import {Controller} from "@tsed/di";
import {ContentType, Post} from "@tsed/schema";
import {BodyParams} from "@tsed/platform-params";

/*Service*/
import {generatePdf, replaceImages} from "./PdfService";


@Controller('/pdf')
export class PdfController {
    @Post("/")
    @ContentType("application/pdf")
    async createPdf(@BodyParams() doc: Object): Promise<Buffer> {
        await replaceImages(doc);
        return generatePdf(doc);
    }
}