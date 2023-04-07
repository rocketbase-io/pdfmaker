/*Ts.ED imports*/
import {Controller, Inject} from "@tsed/di";
import {ContentType, Post} from "@tsed/schema";
import {BodyParams} from "@tsed/platform-params";

/*Service*/
import {PdfService} from "../../service/pdf-service";


@Controller('/pdf')
export class PdfController {
    @Inject()
    protected pdfService : PdfService;

    @Post("/file")
    @ContentType("application/pdf")
    async createPdf(@BodyParams() doc: Object): Promise<Buffer> {
        return this.pdfService.generatePdf(doc);
    }
    @Post("/files")
    @ContentType("application/pdf")
    async mergePdfs(@BodyParams() docs :  [Object]) : Promise<Buffer> {
        return this.pdfService.generateMultiplePdfs(docs);
    }
}