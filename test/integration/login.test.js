const chai = require("chai");
const chaiHttp = require("chai-http");
const { logger } = require("../../src/util/utils");
const { after } = require("mocha");
const server = require("../../index");
chai.use(chaiHttp);
const expect = chai.expect;

let testEmail = "";
let testPass = "";
let testUserId = 0;


describe("UC-101 inloggen", function () {
    before((done) => {
        const testUser = {
            firstName: "Test",
            lastName: "Test",
            emailAddress: "t.test@mail.com",
            password: "Secret123",
            street: "TestStreet 1",
            city: "TestCity",
            phoneNumber: "06-12345678",
      };
  
      chai.request(server).post("/user").send(testUser).end((err, res) => {
            if (err) {
                logger.error(err);
                done();
            } else {
                logger.info(res.body);
                expect(res.body).to.be.an("object");
                expect(res.body).to.have.property("status").to.equal(200);
                expect(res.body).to.have.property("message").to.equal("User created successfully.");
                expect(res.body).to.have.property("data");
    
                const { data } = res.body;
                expect(data).to.be.an("object");
                
                testEmail = data.emailAddress;
                testPass = testUser.password;
                testUserId = data.id;
                
                done();
            }
        });
    });
        
    it("TC-101-1 Verplicht veld ontbreekt", (done) => {
        chai.request(server).post("/login").end((err, res) => {
            if (err) {
                logger.error(err);
                done();
            } else {
                logger.info(res.body);
                expect(res.body).to.be.an("object");
                expect(res.body).to.have.property("status").to.equal(400);
                expect(res.body).to.have.property("message").to.equal("Email address is required");
                expect(res.body).to.have.property("data");
    
                const { data, message } = res.body;
                expect(data).to.be.an("object");
    
                done();
            }
        });
    });
  
    it("TC-101-2 Niet-valide wachtwoord", (done) => {
        chai.request(server).post("/login").send({
            emailAddress: testEmail,
            password: "invalidpassword",
        }).end((err, res) => {
                if (err) {
                    logger.error(err);
                    done();
                } else {
                    logger.info(res.body);
                    expect(res.body).to.be.an("object");
                    expect(res.body).to.have.property("status").to.equal(401);
                    expect(res.body).to.have.property("message").to.equal("Password is not valid.");
                    expect(res.body).to.have.property("data");
        
                    const { data, message } = res.body;
                    expect(data).to.be.an("object");
        
                    done();
                }
            });
    });
  
    it("TC-101-3 Gebruiker bestaat niet", (done) => {
        chai.request(server).post("/login").send({
          emailAddress: "nonexistentuser@example.com",
          password: "Password123",
        }).end((err, res) => {
            if (err) {
                logger.error(err);
                done();
            } else {
                logger.info(res.body);
                expect(res.body).to.be.an("object");
                expect(res.body).to.have.property("status").to.equal(404);
                expect(res.body).to.have.property("message").to.equal("User not found");
                expect(res.body).to.have.property("data");
    
                const { data, message } = res.body;
                expect(data).to.be.an("object");
    
                done();
            }
        });
    });
  
    it("TC-101-4 Gebruiker succesvol ingelogd", (done) => {
        chai.request(server).post("/login").send({
          emailAddress: testEmail,
          password: testPass,
        }).end((err, res) => {
            if (err) {
                logger.error(err);
                done(err);
            } else {
                logger.info(res.body);
                expect(res.body).to.be.an("object");
                expect(res.body).to.have.property("status").to.equal(200);
                expect(res.body).to.have.property("message").to.equal("Login successful");
                expect(res.body).to.have.property("data");
    
                const { data, message } = res.body;
                expect(data).to.be.an("object").to.have.property("id");
                expect(data).to.have.property("token");
    
                done();
            }
        });
    });
  
    after((done) => {
        chai.request(server).delete(`/user/${testUserId}`).end((err, res) => {
            if (err) {
                logger.error(err);
                done();
            } else {
                logger.info(res.body);
                expect(res.body).to.be.an("object");
                expect(res.body).to.have.property("status").to.equal(200);
                expect(res.body).to.have.property("message").to.equal(`User met Id ${testUserId} is verwijderd`);
    
                done();
            }
        });
    });
});