import {PlatformTest} from "@tsed/common";
import SuperTest from "supertest";
import {Server} from "../../Server";

describe("API", () => {
    let request: SuperTest.SuperTest<SuperTest.Test>;

    beforeEach(PlatformTest.bootstrap(Server));
    beforeEach(() => {
        request = SuperTest(PlatformTest.callback());
    })

    afterEach(PlatformTest.reset);

    describe("POST /rest/pdf", () => {
        it("errors 400 at downloading a non existing image (http)", async () => {
            await request.post("/rest/pdf")
                .send({"content": [{"image": "http://www.a.com/"}]})
                .expect(400)
                .expect('Content-Type', /json/);
        });
    })

    describe("POST /rest/pdf", () => {
        it("errors 400 at using an url without http:// or https://", async () => {
            await request.post("/rest/pdf")
                .send({"content": [{"image": "1234"}]})
                .expect(400)
                .expect('Content-Type', /json/);
        });
    })

    describe("POST /rest/pdf", () => {
        it("errors 400 when image url errors 400", async () => {
            await request.post("/rest/pdf")
                .send({
                    "content": [{"image": "https://pokeapi.co/api/v2/dito"}]})
                .expect(400)
                .expect('Content-Type', /json/);
        });
    })
})
