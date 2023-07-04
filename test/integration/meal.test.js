const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../../index");
chai.use(chaiHttp);
const expect = chai.expect;
const { logger } = require("../../src/util/utils");

let mealId = 0;
let testToken = 0;
let testUserId = 0;
let testToken2 = 0;
let testUserId2 = 0;


describe("UC-301 Add meal", function () {
  before((done) => {
    const testUser1 = {
      firstName: "mealTest",
      lastName: "mealTester",
      emailAddress: "m.mealtest@mail.nl",
      password: "Secret123",
      street: "Teststreet 1",
      city: "Testcity",
      phoneNumber: "06-12345678",
    };

    chai.request(server).post("/user").send(testUser1).end((err, res) => {
        if (err) {
          logger.error(err);
          done(err);
        } else {
          testUserId = res.body.data.id;

          chai.request(server).post("/login").send({
              emailAddress: "t.estmanMeal@mail.com",
              password: "Secret123",
            }).end((loginErr, loginRes) => {
              if (loginErr) {
                logger.error(loginErr);
                done(loginErr);
              } else {
                testToken = loginRes.body.data.token;
                logger.info(`Token created: ${testToken}`);
              }
            });
        }
      });

    const testUser2 = {
      firstName: "mealTest2",
      lastName: "mealTester2",
      emailAddress: "t.mealtester@mail.com",
      password: "Secret123",
      street: "Teststreet 2",
      city: "Testcity",
      phoneNumber: "06-87654321",
    };

    chai.request(server).post("/user").send(testUser2).end((err, res) => {
        if (err) {
          logger.error(err);
          done(err);
        } else {
          testUserId2 = res.body.data.id;

          chai.request(server).post("/login").send({
              emailAddress: "t.estmanMeal2@mail.com",
              password: "Secret123",
            }).end((loginErr, loginRes) => {
              if (loginErr) {
                logger.error(loginErr);
                done(loginErr);
              } else {
                testToken2 = loginRes.body.data.token;
                logger.info(`Token created: ${testToken2}`);
                done();
              }
            });
        }
      });
  });

  it("TC-301-1 Mandatory field is missing", (done) => {
    const mealData = {
      description: "A tasty meal",
      price: 11.99,
      maxAmountOfParticipants: 20,
      imageUrl: "https://www.scoreatthetop.com/hubfs/best-foods-to-eat-before-a-test.jpg",
      allergenes: ["gluten"],
    };

    chai.request(server).post("/meal").set("Authorization", `Bearer ${testToken}`).send(mealData)
      .end((err, res) => {
        if (err) {
          logger.error(err);
          done();
        } else {
          logger.info(res.body);
          expect(res.body).to.be.an("object");
          expect(res.body).to.have.property("status").to.equal(400);
          expect(res.body).to.have.property("message").to.equal(`"name" is required`);
          expect(res.body).to.have.property("data");
          const { data, message } = res.body;
          expect(data).to.be.an("object");

          done();
        }
      });
  });

  it("TC-301-2 Not logged in", (done) => {
    const mealData = {
      name: "Delicious Meal",
      description: "A tasty meal",
      price: 10.99,
      maxAmountOfParticipants: 13,
      imageUrl: "https://www.scoreatthetop.com/hubfs/best-foods-to-eat-before-a-test.jpg",
      allergenes: ["gluten"],
    };
    chai.request(server).post("/meal").send(mealData).end((err, res) => {
        if (err) {
          logger.error(err);
          done();
        } else {
          logger.info(res.body);
          expect(res.body).to.be.an("object");
          expect(res.body).to.have.property("status").to.equal(401);
          expect(res.body)
            .to.have.property("message")
            .to.equal("Unauthorized: Missing or invalid token");
          expect(res.body).to.have.property("data").to.be.empty;

          done();
        }
      });
  });

  it("TC-301-3 Meal added successfully", (done) => {
    const meal = {
      name: "Delicious Meal",
      description: "A tasty meal",
      price: 11.99,
      maxAmountOfParticipants: 13,
      imageUrl: "https://www.scoreatthetop.com/hubfs/best-foods-to-eat-before-a-test.jpg",
      allergenes: ["gluten"],
    };

    chai.request(server).post("/meal").set("userid", testUserId).set("Authorization", `Bearer ${testToken}`)
      .send(meal).end((err, res) => {
        if (err) {
          logger.error(err);
          done();
        } else {
          logger.info(res.body);
          expect(res.body).to.be.an("object");
          expect(res.body).to.have.property("status").to.equal(201);
          expect(res.body).to.have.property("message").to.equal("Meal created successfully");
          expect(res.body).to.have.property("data");
          const { data } = res.body;
          expect(data).to.be.an("object");
          expect(data).to.have.property("id");
          expect(data).to.have.property("isActive").to.equal(true);
          expect(data).to.have.property("isVega").to.equal(false);
          expect(data).to.have.property("isVegan").to.equal(false);
          expect(data).to.have.property("isToTakeHome").to.equal(false);
          expect(data).to.have.property("dateTime");
          expect(data).to.have.property("maxAmountOfParticipants").to.equal(13);
          expect(data).to.have.property("price").to.equal(11.99);
          expect(data).to.have.property("imageUrl").to.equal("https://www.scoreatthetop.com/hubfs/best-foods-to-eat-before-a-test.jpg");
          expect(data).to.have.property("cookId").to.equal(testUserId);
          expect(data).to.have.property("createDate");
          expect(data).to.have.property("updateDate");
          expect(data).to.have.property("name").to.equal("Delicious Meal");
          expect(data).to.have.property("description").to.equal("A tasty meal");
          expect(data).to.have.property("allergenes").to.equal("gluten");

          mealId = data.id;

          done();
        }
      });
  });
});

describe("UC-302 Update meal", function () {
  it("TC-302-1 Mandatory fields 'name' and/or 'price' and/or 'maxAmountOfParticipants' are missing", (done) => {
    const updatedMeal = {
      description: "Updated meal description",
      price: 15.99,
      maxAmountOfParticipants: 17,
      imageUrl: "https://www.scoreatthetop.com/hubfs/best-foods-to-eat-before-a-test.jpg",
      allergenes: ["gluten"],
    };

    chai.request(server).put(`/meal/${mealId}`).set("Authorization", `Bearer ${testToken}`)
      .send(updatedMeal).end((err, res) => {
        if (err) {
          logger.error(err);
          done();
        } else {
          logger.info(res.body);
          expect(res).to.have.status(400);
          expect(res.body).to.be.an("object");
          expect(res.body).to.have.property("status").to.equal(400);
          expect(res.body).to.have.property("message").to.equal("Invalid input");
          expect(res.body).to.have.property("data");
          expect(res.body.data).to.have.property("error").to.equal("Name is a required field");
          done();
        }
      });
  });

  it("TC-302-2Not logged in", (done) => {
    const updatedMeal = {
      name: "Delicious Meal",
      description: "Updated meal description",
      price: 19.99,
      maxAmountOfParticipants: 19,
      imageUrl: "https://www.scoreatthetop.com/hubfs/best-foods-to-eat-before-a-test.jpg",
      allergenes: ["gluten"],
    };
    chai.request(server).put(`/meal/${mealId}`).send(updatedMeal).end((err, res) => {
        if (err) {
          logger.error(err);
          done();
        } else {
          logger.info(res.body);
          expect(res.body).to.be.an("object");
          expect(res.body).to.have.property("status").to.equal(401);
          expect(res.body).to.have.property("message").to.equal("Unauthorized: Missing or invalid token");
          expect(res.body).to.have.property("data").to.be.empty;
          done();
        }
      });
  });

  it("TC-302-3 Not the owner of the meal", (done) => {
    const mealData = {
      name: "Delicious Meal",
      description: "A tasty and delicious meal",
      price: 13.99,
      maxAmountOfParticipants: 7,
      imageUrl: "https://www.scoreatthetop.com/hubfs/best-foods-to-eat-before-a-test.jpg",
      allergenes: ["gluten"],
    };

    chai.request(server).put(`/meal/${mealId}`).set("Authorization", `Bearer ${testToken2}`)
      .send(mealData).end((err, res) => {
        if (err) {
          logger.error(err);
          done();
        } else {
          logger.info(res.body);
          expect(res).to.have.status(403);
          expect(res.body).to.be.an("object");
          expect(res.body).to.have.property("status").to.equal(403);
          expect(res.body).to.have.property("message").to.equal(`Not authorized to update meal with Id ${mealId}`);
          done();
        }
      });
  });

  it("TC-302-4 Meal does not exist", (done) => {
    const unavailableMealId = mealId + 1; // ID of a non-existent meal

    const mealData = {
      name: "Delicious Meal",
      description: "A tasty meal",
      price: 10.78,
      maxAmountOfParticipants: 6,
      imageUrl: "https://www.scoreatthetop.com/hubfs/best-foods-to-eat-before-a-test.jpg",
      allergenes: ["gluten"],
    };

    chai.request(server).put(`/meal/${unavailableMealId}`).set("Authorization", `Bearer ${testToken}`)
      .send(mealData).end((err, res) => {
        expect(res.body).to.be.an("object");
        expect(res.body.status).to.equal(404);
        expect(res.body.message).to.equal(`No meal found with Id ${unavailableMealId}`);
        expect(res.body.data).to.be.an("object").that.is.empty;

        done();
      });
  });

  it("TC-302-5 Meal updated successfully", (done) => {
    const updatedMeal = {
      name: "Updated Meal",
      description: "A tasty meal",
      isVega: 1,
      price: 19.99,
      maxAmountOfParticipants: 17,
      imageUrl: "https://www.scoreatthetop.com/hubfs/best-foods-to-eat-before-a-test.jpg",
      allergenes: ["gluten"],
    };

    chai.request(server).put(`/meal/${mealId}`).set("Authorization", `Bearer ${testToken}`)
      .send(updatedMeal).end((err, res) => {
        logger.info(res.body);
        expect(res.body).to.be.an("object");
        expect(res.body.status).to.equal(200);
        expect(res.body.message).to.equal("Updated meal");
        expect(res.body.data).to.be.an("object");

        done();
      });
  });
});

describe("UC-303 Get all Meals", function () {
  it("TC-303-1 List of meals returned", (done) => {
    chai.request(server).get("/meal").set("Authorization", `Bearer ${testToken}`)
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an("object");
        expect(res.body).to.have.property("status", 200);
        expect(res.body).to.have.property("message","Successfully fetched all meals.");
        expect(res.body).to.have.property("data").to.be.an("array");
        
        const data = res.body.data;
        data.forEach((mealWithParticipants) => {
          expect(mealWithParticipants).to.be.an("object");
          expect(mealWithParticipants).to.have.property("meal");
          expect(mealWithParticipants).to.have.property("cook");
          expect(mealWithParticipants).to.have.property("participants").that.is.an("array");
        });

        done();
      });
  });
});

describe("UC-304 Get a meal by Id", function () {
  it("TC-304-1 Meal does not exist", (done) => {
    const unavailableMealId = mealId + 1;

    chai
      .request(server).get(`/meal/${unavailableMealId}`).end((err, res) => {
        if (err) {
          logger.error(err);
        } else {
          logger.info(res.body);
          expect(res).to.have.status(404);
          expect(res.body).to.be.an("object");
          expect(res.body).to.have.property("status").to.equal(404);
          expect(res.body).to.have.property("message").to.equal(`No meal found with Id ${unavailableMealId}`);
          expect(res.body).to.have.property("data").to.be.an("object").that.is.empty;

          done();
        }
      });
  });

  it("TC-304-2 Meal details returned", (done) => {
    chai.request(server).get(`/meal/${mealId}`)
      .end((err, res) => {
        if (err) {
          logger.error(err);
        } else {
          logger.info(res.body);
          expect(res).to.have.status(200);
          expect(res.body).to.be.an("object");
          expect(res.body).to.have.property("status").to.equal(200);
          expect(res.body).to.have.property("message").to.equal("Meal details retrieved successfully");
          expect(res.body).to.have.property("data").to.be.an("object");

          const meal = res.body.data.meal;
          const cook = res.body.data.cook;
          const participants = res.body.data.participants;
          expect(meal).to.be.an("object");
          expect(meal).to.have.property("id").to.equal(mealId);
          expect(cook).to.be.an("object");
          expect(participants).to.be.an("array");

          done();
        }
      });
  });
});

describe("UC-305 Delete meal", function () {
  it("TC-305-1 Not logged in", (done) => {
    chai.request(server).delete(`/meal/${mealId}`).end((err, res) => {
        if (err) {
          logger.error(err);
        } else {
          logger.info(res.body);
          expect(res).to.have.status(401);
          expect(res.body).to.deep.equal({
            status: 401,
            message: "Unauthorized: Missing or invalid token",
            data: {},
          });
          done();
        }
      });
  });

  it("TC-305-2 Not the owner of the meal", (done) => {
    chai.request(server).delete(`/api/meal/${mealId}`).set("Authorization", `Bearer ${testToken2}`)
      .end((err, res) => {
        if (err) {
          logger.error(err);
        } else {
          logger.info(res.body);
          expect(res).to.have.status(403);
          expect(res.body).to.deep.equal({
            status: 403,
            message: `Not authorized to delete meal with ID ${mealId}`,
            data: {},
          });
          done();
        }
      });
  });

  it("TC-305-3 Meal doesn't exist", (done) => {
    const unavailableMealId = mealId + 1;

    chai.request(server).delete(`/api/meal/${unavailableMealId}`).set("Authorization", `Bearer ${testToken}`)
      .end((err, res) => {
        if (err) {
          logger.error(err);
          done();
        } else {
          logger.info(res.body);
          expect(res).to.have.status(404);
          expect(res.body).to.be.an("object");
          expect(res.body).to.have.property("status").to.equal(404);
          expect(res.body).to.have.property("message").to.equal(`No meal found with Id ${unavailableMealId}`);
          done();
        }
      });
  });

  it("TC-305-4 Meal deleted successfully", (done) => {
    chai.request(server).delete(`/api/meal/${mealId}`).set("Authorization", `Bearer ${testToken}`)
      .end((err, res) => {
        if (err) {
          logger.error(err);
          done();
        } else {
          logger.info(res.body);
          expect(res.body).to.be.an("object");
          expect(res.body).to.have.property("status").to.equal(200);
          expect(res.body).to.have.property("message").to.equal(`Meal with Id ${mealId} is deleted`);
          expect(res.body).to.have.property("data");

          const { data, message } = res.body;
          expect(data).to.be.an("object");

          done();
        }
      });
  });
});

after((done) => {
  chai.request(server).delete(`/user/${testUserId}`).end((err, res) => {
      if (err) {
        logger.error(err);
      }
    });

  chai.request(server).delete(`/user/${testUserId2}`).end((err, res) => {
      if (err) {
        logger.error(err);
      }
      done();
    });
});