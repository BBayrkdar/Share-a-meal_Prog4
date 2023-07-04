const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../../index");
chai.use(chaiHttp);
const expect = chai.expect;
const { logger } = require("../../src/util/utils");

let testMealId = 0;
let testToken = 0;
let testUserId = 0;

let testToken2 = 0;
let testUserId2 = 0;

describe("UC-401 Sign up for meal", () => {
  before((done) => {
    const testUser1 = {
      firstName: "participateTest",
      lastName: "participateTester",
      emailAddress: "p.test@mail.com",
      password: "Secret123",
      street: "Teststreet 1",
      city: "Testcity",
      phoneNumber: "06-12345678",
    };

    const testUser2 = {
      firstName: "participateTest2",
      lastName: "participateTester2",
      emailAddress: "p.test2@mail.com",
      password: "Secret123",
      street: "Teststreet 2",
      city: "Testcity",
      phoneNumber: "06-87654321",
    };

    chai.request(server).post("/user").send(testUser1).end((err, res) => {
        if (err) {
          logger.error(err);
          done(err);
        } else {
          testUserId = res.body.data.id;
          logger.info(`Participate test user created with id ${testUserId}`);

          chai.request(server).post("/user").send(testUser2).end((err, res) => {
              if (err) {
                logger.error(err);
                done(err);
              } else {
                testUserId2 = res.body.data.id;
                logger.info(`Another test user created with id ${testUserId2}`);

                chai.request(server).post("/login").send({
                    emailAddress: "p.test@mail.com",
                    password: "Secret123",
                  }).end((loginErr, loginRes) => {
                    if (loginErr) {
                      logger.error(loginErr);
                      done(loginErr);
                    } else {
                      logger.info(loginRes.body);
                      testToken = loginRes.body.data.token;
                      logger.info(`Token created: ${testToken}`);

                      chai.request(server).post("/login").send({
                          emailAddress: "p.test2@mail.com",
                          password: "Secret123",
                        }).end((loginErr, loginRes) => {
                          if (loginErr) {
                            logger.error(loginErr);
                            done(loginErr);
                          } else {
                            testToken2 = loginRes.body.data.token;
                            logger.info(`Second token created: ${testToken2}`);


                            const testMeal = {
                              name: "Test Meal",
                              description: "A test meal",
                              price: 15.99,
                              maxAmountOfParticipants: 5,
                              imageUrl: "https://www.scoreatthetop.com/hubfs/best-foods-to-eat-before-a-test.jpg",
                              allergenes: ["gluten"],
                            };

                            chai.request(server).post("/meal").set("Authorization", `Bearer ${testToken}`)
                              .send(testMeal).end((mealErr, mealRes) => {
                                if (mealErr) {
                                  logger.error(mealErr);
                                  done(mealErr);
                                } else {
                                  testMealId = mealRes.body.data.id;
                                  logger.info(`Test meal created with Id ${testMealId}`);
                                  done();
                                }
                              });
                          }
                        });
                    }
                  });
              }
            });
        }
      });
  });

  it("TC-401-1 Not logged in", (done) => {
    chai.request(server).post(`/meal/${testMealId}/participate`).end((err, res) => {
        expect(res.body).to.be.an("object");
        expect(res.body).to.have.property("status").to.equal(401);
        expect(res.body).to.have.property("message").to.equal("Unauthorized: Missing or invalid token");
        expect(res.body).to.have.property("data").to.be.empty;

        done();
      });
  });

  it("TC-401-2 Meal does not exist", (done) => {
    const unavailableMealId = testMealId + 1;

    chai.request(server).post(`/meal/${unavailableMealId}/participate`).set("Authorization", `Bearer ${testToken}`)
      .end((err, res) => {
        if (err) {
          logger.error(err);
        } else {
          logger.info(res.body);
          expect(res.body).to.be.an("object");
          expect(res.body.status).to.equal(404);
          expect(res.body.message).to.equal(`No meal found with Id ${unavailableMealId}`);
          expect(res.body.data).to.be.an("object").that.is.empty;

          done();
        }
      });
  });

  it("TC-401-3 Signed up successfully", (done) => {
    chai.request(server).post(`/meal/${testMealId}/participate`).set("Authorization", `Bearer ${testToken}`)
      .end((err, res) => {
        if (err) {
          logger.error(err);
        } else {
          logger.info(res.body);
          expect(res.body).to.be.an("object");
          expect(res.body).to.have.property("status").to.equal(200);
          expect(res.body)
            .to.have.property("message")
            .to.equal(`User with Id ${testUserId} has been signed up for meal with Id ${testMealId}`);
          expect(res.body).to.have.property("data").to.be.an("object").that.is.not.empty;

          done();
        }
      });
  });
});

describe("UC-402 Unregister for meal", (done) => {
  it("TC-402-1 Not logged in", (done) => {
    chai.request(server).post(`/meal/${testMealId}/participate`).end((err, res) => {
        expect(res.body).to.be.an("object");
        expect(res.body).to.have.property("status").to.equal(401);
        expect(res.body).to.have.property("message").to.equal("Unauthorized: Missing or invalid token");
        expect(res.body).to.have.property("data").to.be.empty;

        done();
      });
  });

  it("TC-402-2 Meal does not exist", (done) => {
    const unavailableMealId = testMealId + 1;

    chai.request(server).post(`/meal/${unavailableMealId}/participate`).set("Authorization", `Bearer ${testToken}`)
      .end((err, res) => {
        if (err) {
          logger.error(err);
        } else {
          logger.info(res.body);
          expect(res.body).to.be.an("object");
          expect(res.body.status).to.equal(404);
          expect(res.body.message).to.equal(`No meal found with Id ${unavailableMealId}`);
          expect(res.body.data).to.be.an("object").that.is.empty;

          done();
        }
      });
  });

  it("TC-402-3 registration does not exist", (done) => {
    logger.info(`Participate for meal with id ${testMealId}`);
    chai.request(server).delete(`/meal/${testMealId}/participate`).set("Authorization", `Bearer ${testToken2}`)
      .end((err, res) => {
        if (err) {
          logger.error(err);
        } else {
          logger.info(res.body);
          expect(res.body).to.be.an("object");
          expect(res.body.status).to.equal(404);
          expect(res.body.message).to.equal(`No participation for user with ID ${testUserId2} found for meal ${testMealId}`);
          expect(res.body.data).to.be.an("object").that.is.empty;

          done();
        }
      });
  });

  it("TC-402-4 Unregisterd successfully", (done) => {
    chai.request(server).delete(`/meal/${testMealId}/participate`).set("Authorization", `Bearer ${testToken}`)
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an("object");
        expect(res.body).to.have.property("status", 200);
        expect(res.body).to.have.property("message").equal(`User with ID ${testUserId} has been unregistered for meal with ID ${testMealId}`);
        expect(res.body.data).to.deep.equal({});
        done();
      });
  });
});

after((done) => {
  chai.request(server).delete(`/meal/${testMealId}`).set("Authorization", `Bearer ${testToken}`)
    .end((mealErr, mealRes) => {
      if (mealErr) {
        logger.error(mealErr);
      }

      chai.request(server).delete(`/user/${testUserId}`).end((userErr, userRes) => {
          if (userErr) {
            logger.error(userErr);
          }

          chai.request(server).delete(`/user/${testUserId2}`).end((userErr2, userRes2) => {
              if (userErr2) {
                logger.error(userErr2);
              }

              done();
            });
        });
    });
});