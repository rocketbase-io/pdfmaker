import {PlatformTest} from "@tsed/common";
import SuperTest from "supertest";
import {Server} from "../../Server";

describe("API", () => {
    let request: SuperTest.SuperTest<SuperTest.Test>;

    beforeEach(PlatformTest.bootstrap(Server));
    beforeEach(() => {
        jest.setTimeout(20000);
        request = SuperTest(PlatformTest.callback());
    });

    afterEach(PlatformTest.reset);


    describe("POST /pdf/file", ()=>{
       it("creates an empty pdf", async () => {
           await request.post("/pdf/file")
               .send({})
               .expect(200)
               .expect('Content-Type', /pdf/);
       })
    });

    describe("POST /pdf/files", ()=>{
        it("creates an empty merged pdf ", async () => {
            await request.post("/pdf/files")
                .send({})
                .expect(200)
                .expect('Content-Type', /pdf/);
        })
    });


})