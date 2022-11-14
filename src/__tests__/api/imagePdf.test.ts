import {PlatformTest} from "@tsed/common";
import SuperTest from "supertest";
import {Server} from "../../Server";

describe("API", () => {
    let request: SuperTest.SuperTest<SuperTest.Test>;

    beforeEach(PlatformTest.bootstrap(Server));
    beforeEach(() => {
        request = SuperTest(PlatformTest.callback());
    });

    afterEach(PlatformTest.reset);

    describe("POST /pdf/file", () => {
        it("creates an pdf with page numbers and 3 images", async () => {
            await request.post("/pdf/file")
                .send({
                    "content": [
                        {
                            "image": "https://www.pngmart.com/files/13/Pokemon-Charmander-PNG-Pic.png"
                        },
                        {
                            "image": "https://www.pngmart.com/files/13/Pokemon-Charmander-PNG-Pic.png"
                        },
                        {
                            "image": "https://www.pngmart.com/files/13/Pokemon-Charmander-PNG-Pic.png"
                        }
                    ],
                    "pageNumber": {
                        "text": "ASs $currentPage$ test $pageCount$ assa",
                        "alignment": "center"
                    }
                })
                .expect(200)
                .expect('Content-Type', /pdf/);
        });
    })

    describe("POST /pdf/files", () => {
        it("merges two pdfs with three pictures each", async () => {
            await request.post("/pdf/files")
                .send([
                    {"content": [
                        {"image": "https://www.pngmart.com/files/13/Pokemon-Charmander-PNG-Pic.png"},
                        {"image": "https://www.pngmart.com/files/13/Pokemon-Charmander-PNG-Pic.png"},
                        {"image": "https://www.pngmart.com/files/13/Pokemon-Charmander-PNG-Pic.png"}
                    ]},
                    {"content": [
                        {"image": "https://www.pngmart.com/files/13/Pokemon-Charmander-PNG-Pic.png"},
                        {"image": "https://www.pngmart.com/files/13/Pokemon-Charmander-PNG-Pic.png"},
                        {"image": "https://www.pngmart.com/files/13/Pokemon-Charmander-PNG-Pic.png"}
                    ]}
                ])
                .expect(200)
                .expect('Content-Type', /pdf/);
        });
    })

    describe("POST /pdf/file", ()=>{
        it("creates an pdf with page numbers and 3 images", async () => {
            await request.post("/pdf/file")
                .send({
                    "content": [
                        {
                            "image": "https://www.pngmart.com/files/13/Pokemon-Charmander-PNG-Pic.png"},
                        {
                            "image": "https://www.pngmart.com/files/13/Pokemon-Charmander-PNG-Pic.png"},
                        {
                            "image": "https://www.pngmart.com/files/13/Pokemon-Charmander-PNG-Pic.png"}
                    ],
                    "pageNumber": {
                        "text": "ASs $currentPage$ test $pageCount$ assa",
                        "alignment": "center"
                    }
                })
                .expect(200)
                .expect('Content-Type', /pdf/);
        });
    })
})