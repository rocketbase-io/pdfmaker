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


    describe("POST /rest/pdf", ()=>{
       it("creates an empty pdf", async () => {
           request.post("/rest/pdf")
               .send({})
               .expect(200)
               .expect('Content-Type', /pdf/);
       })
    });

    describe("POST /rest/pdf/merge", ()=>{
        it("creates a merged pdf ", async () => {
            request.post("/rest/pdf/merge")
                .send({})
                .expect(200)
                .expect('Content-Type', /pdf/);
        })
    });
})