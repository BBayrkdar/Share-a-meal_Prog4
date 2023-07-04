const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../../index");
chai.use(chaiHttp);
const expect = chai.expect;


describe("UC-102 Informatie opvragen", function () {
    it("TC-102-1 - Server info should return successful information", (done) => {
        chai.request(server).get("/info").end((err, res) => {
            expect(res.body).to.be.an("object");
            expect(res.body).to.have.property("status").to.equal(201);
            expect(res.body).to.have.property("message");
            expect(res.body).to.have.property("data");
    
            const { data, message } = res.body;
        
            expect(data).to.be.an("object");
            expect(data).to.have.property("studentName").to.equal("Baraa Bayrkdar");
            expect(data).to.have.property("studentNumber").to.equal(2210363);
        
            done();
        });
    });
  
    it("TC-102-2 - Server should return valid error when endpoint does not exist", (done) => {
        chai.request(server).get("/doesnotexist").end((err, res) => {
            expect(err).to.be.null;
            expect(res.body).to.be.an("object");
        
            const { data, message, status } = res.body;
        
            expect(status).to.equal(404);
            expect(message).to.be.a("string").that.is.equal("Endpoint not found");
            expect(data).to.be.an("object");
        
            done();
        });
    });
});