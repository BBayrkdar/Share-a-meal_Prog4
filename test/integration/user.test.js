const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../../index");
chai.use(chaiHttp);
const expect = chai.expect;
const { logger } = require("../../src/util/utils");

let token = 0;
let userId = 0;
let notOwnerUserId = 0;

describe("UC-201 Register as a new user", () => {
    it("TC-201-1 Mandatory field is missing", (done) => {
        const user1 = {
            firstName: "Joe",
            lastName: "", // required value missed
            emailAdress: "j.doe@testmail.nl",
            street: "testStreet 1",
            city: "TestCity",
            password: "Secret123",
            phoneNumber: "06-12345678",
            isActive: true
        };

        chai.request(server).post("/user").send(user1).end((err, res) => {
            logger.info(res.body);
            expect(err).to.be.null;
            let { status, message } = res.body;
            expect(status).to.equal(400);
            expect(res.body).to.be.an("object");
            expect(message).to.be.a("string").that.contains('"lastName" is not allowed to be empty');
            
            done();
        });
    });


    it("TC-201-2 Not valid emailaddress", (done) => {
        const user2 = {
            firstName: "John",
            lastName: "Doe",
            emailAdress: "johndoetestmailcom", // invalid mail address format
            street: "testStreet 1",
            city: "TestCity",
            password: "Secret123",
            phoneNumber: "06-12345678",
            isActive: true
        };

        chai.request(server).post("/user").send(user2).end((err, res) => {
            logger.info(res.body);
            logger.error(err);
            let { status, message } = res.body;
            expect(status).to.equal(400);
            expect(res.body).to.be.an("object");
            expect(message).to.equal("Email address is not valid");

            done();
        });
    });


it("TC-201-3 Not valid password", (done) => {
    const user3 = {
      firstName: "Sara",
      lastName: "tester",
      emailAdress: "s.tester@mail.nl",
      password: "secret",
      street: "teststreet 1",
      city: "testcity",
      phoneNumber: "06-12345678",
    };

    chai.request(server).post("/user").send(user3).end((err, res) => {
        let { status, message } = res.body;
        expect(status).to.equal(400);
        expect(res.body).to.be.an("object");
        expect(message).to.equal(
          "Password is not valid. It should be at least 8 characters and contain at least one uppercase letter and one digit."
        );

        done();
      });
  });



  it("TC-201-5 User succesfully registered", (done) => {
    const user5 = {
        firstName: "Sara",
        lastName: "Tester",
        emailAdress: "s.test@mail.nl",
        password: "Secret123",
        street: "teststreet 1",
        city: "testcity",
        phoneNumber: "06-12345678",
    };

    chai.request(server).post("/user").send(user5).end((err, res) => {
        expect(err).to.be.null;
        logger.info(res.body);
        expect(res.body).to.be.an("object");
        let { status, message, data } = res.body;
        expect(status).to.equal(201);
        expect(message).to.be.a("string").that.contains("User created successfully");
        expect(data).to.be.an("object");
        userId = data.id;
        logger.info(data.id);

        done();
      });
  });


  it("TC-201-4 user already exists", (done) => {
    const existingUser = {
        firstName: "Sara",
        lastName: "Tester",
        emailAdress: "s.test@mail.nl",
        password: "Secret123",
        street: "teststreet 1",
        city: "testcity",
        phoneNumber: "06-12345678",
    };

    chai.request(server).post("/user").send(existingUser).end((err, res) => {
        logger.info(res.body);
        expect(err).to.be.null;
        let { status, message } = res.body;
        expect(status).to.equal(403);
        expect(res.body).to.be.an("object");
        expect(message).to.be.a("string").that.contains("emailAdress already exists");

        done();
      });
  });


});


describe("UC-202 Requesting an overview of users", () => {
    it("TC-202-1 Show all users (minimum 2)", (done) => {
      chai.request(server).get("/user").timeout(5000).end((err, res) => {
          expect(err).to.be.null;
          expect(res.body).to.be.an("object");
          let { status, message, data } = res.body;
          expect(status).to.equal(200);
          expect(message).to.contain("Users retrieved successfully.");
          expect(data).to.be.an("array").and.to.have.length.of.at.least(2)
            .and.to.satisfy((users) => {
              return users.every((user) => {
                return typeof user === "object";
              });
            });
  
          done();
        });
    });
  
    it("TC-202-2 Show users with search term on non-existent fields", (done) => {
      const searchParams = {
        nonExistingField: "value",
      };
  
      chai.request(server).get("/user").query(searchParams).timeout(5000).end((err, res) => {
          expect(err).to.be.null;
          expect(res.body).to.be.an("object");
          let { status, message, data } = res.body;
          expect(status).to.equal(200);
          expect(message).to.contain("Users retrieved successfully.");
          expect(data).to.be.an("array");
  
          done();
        });
    });


    it("TC-202-3 Show users using the search term on the field 'isActive'=false", (done) => {
        const searchParams = {
          isActive: 0,
        };
  
        chai.request(server).get("/user").query(searchParams).timeout(5000).end((err, res) => {
            expect(err).to.be.null;
            expect(res.body).to.be.an("object");
            let { status, message, data } = res.body;
            expect(status).to.equal(200);
            expect(message).to.contain("Users retrieved successfully.");
            expect(data).to.be.an("array")
              .and.to.satisfy((users) => {
                return users.every((user) => {
                  return user.isActive === false;
                });
              });
  
            done();
          });
      });
  
    it("TC-202-4 Show users using the search term on the field 'isActive' = true", (done) => {
      const searchParams = {
        isActive: 1,
      };
  
      chai.request(server).get("/user").query(searchParams).end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res.body).to.be.an("object");
          const { status, message, data } = res.body;
          expect(status).to.equal(200);
          expect(message).to.equal("Users retrieved successfully.");
          expect(data).to.be.an("array")
            .and.to.satisfy((users) => {
              return users.every((user) => {
                return user.isActive === true;
              });
            });
  
          done();
        });
    });
  
    it("TC-202-5 Show users with search terms on existing fields (filter max on 2 fields)", (done) => {
      const searchParams = {
        firstName: "Sara",
        lastName: "Tester",
      };
  
      chai.request(server).get("/user").query(searchParams).end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res.body).to.be.an("object");
          const { status, message, data } = res.body;
          expect(status).to.equal(200);
          expect(message).to.equal("Users retrieved successfully.");
          expect(data).to.be.an("array");
          data.forEach((user) => {
            expect(user.firstName).to.equal(searchParams.firstName);
            expect(user.lastName).to.equal(searchParams.lastName);
          });
  
          done();
        });
    });

});


describe("UC-203 Request user profile", () => {
    before((done) => {
      chai.request(server).post("/login")
        .send({ emailAdress: "s.test@mail.nl", password: "Secret123" })
        .end((loginErr, loginRes) => {
          token = loginRes.body.data.token;
          logger.error(loginErr);
          logger.info(`Token created: ${token}`);
          done();
        });
    });
  
    it("TC-203-2 User is logged in with valid token", (done) => {
      logger.info(`TC-203-2 token ${token}`);
      chai.request(server).get("/user/profile")
        .set("Authorization", `Bearer ${token}`).end((err, res) => {
          if (err) {
            logger.error(err);
          } else {
            logger.info(res.body);
            expect(err).to.be.null;
            expect(res).to.have.status(200);
            expect(res.body).to.be.an("object");
            let { status, message, data } = res.body;
            expect(status).to.equal(200);
            expect(message).to.equal("User profile retrieved successfully");
            expect(data).to.be.an("object");
  
            done();
          }
        });
    });
});




describe("UC-204 Requesting user data from ID", () => {
    it("TC-204-1 invalid token", (done) => {
      chai.request(server).get(`/user/${userId}`).end((err, res) => {
          expect(err).to.be.null;
          logger.info(res.body);
          expect(res.body).to.be.an("object");
          let { status, message, data } = res.body;
          expect(status).to.equal(401);
          expect(message).to.equal("Unauthorized: Missing or invalid token");
          expect(data).to.be.an("object");
  
          done();
        });
    });
  
    
    it("TC-204-2 User ID does not exist", (done) => {
      const invalidUserId = userId + 999;
  
      chai.request(server).get(`/user/${invalidUserId}`)
        .set("Authorization", `Bearer ${token}`).end((err, res) => {
          expect(err).to.be.null;
          let { status, message } = res.body;
          expect(status).to.equal(404);
          expect(res.body).to.be.an("object");
          expect(message).to.equal(`No user found with Id ${invalidUserId}`);
  
          done();
        });
    });
  
    it("TC-204-3 User ID exists", (done) => {
        let existUserId = 1;
      chai.request(server).get(`/user/${existUserId}`)
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          expect(err).to.be.null;
          logger.info(res.body);
          expect(res.body).to.be.an("object");
          let { status, message, data } = res.body;
          expect(status).to.equal(200);
          expect(message).to.equal("User retrieved by id successfully.");
          expect(data).to.be.an("object");
  
          done();
        });
    });
});

  

describe("UC-205 Update user", () => {
    it("TC-205-1 Mandatory field 'emailAddress' is missing", (done) => {
      const user1 = {
        firstName: "Joe",
        lastName: "Doe",
        street: "TestSt 1",
        city: "Testcity",
        password: "Secret123",
        phoneNumber: "06-12345678",
      };
  
      chai.request(server).post("/user").send(user1)
        .end((err, res) => {
          expect(err).to.be.null;
          let { status, message } = res.body;
          logger.info(res.body);
          expect(status).to.equal(400);
          expect(res.body).to.be.an("object");
          expect(message).to.equal('"emailAdress" is required');
  
          done();
        });
    });
  


    it("TC-205-2 The user isn't the owner of the data", (done) => {
      const notOwneruser = {
        firstName: "Amy",
        lastName: "Tester",
        emailAdress: "s.test@mail.nl",
        password: "Password123",
        street: "TesterStreet",
        city: "testerCity",
        phoneNumber: "06-12345678",
      };
  
        chai.request(server).post("/user")
            .send(notOwneruser)
            .end((err, res) => {
            expect(err).to.be.null;
            expect(res).to.have.status(201);
    
            notOwnerUserId = res.body.data.id;
            logger.info(`the not owner user id : ${notOwnerUserId}`);
    
            let editedUser = {
                firstName: "EditedUser",
                lastName: "Tester",
                emailAdress: "e.tester@mail.nl",
                password: "Secret321",
                street: "EditedStreet",
                city: "EditedCity",
                phoneNumber: "06-12345678",
            }

                chai.request(server).put(`/user/${notOwnerUserId}`)
                    .set("Authorization", `Bearer ${token}`).send(editedUser)
                    .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.have.status(403);
                    expect(res.body).to.be.an("object");
                    const { status, message } = res.body;
                    expect(status).to.equal(403);
                    expect(message).to.equal("You are not authorized to update this user's data.");
        
                    done();
                });
        });
    });
  


    it("TC-205-3 Not valid phoneNummer", (done) => {
        const invalidPhoneNumber = "60123456";
    
        let user6 = {
            firstName: "Sara",
            lastName: "Tester",
            emailAdress: "s.test@mail.nl",
            password: "Secret123",
            street: "teststreet 1",
            city: "testcity",
            phoneNumber: invalidPhoneNumber,
            
        }
        chai.request(server).put(`/user/${userId}`)
            .set("Authorization", `Bearer ${token}`)
            .send(user6).end((err, res) => {
            logger.info(res.body);
            expect(err).to.be.null;
            expect(res).to.have.status(403);
            expect(res.body).to.be.an("object");
            const { status, message } = res.body;
            expect(status).to.equal(403);
            expect(message).to.equal("Phone number is not valid. It should start with '06' and be followed by 8 digits.");
            done();
        });
    });
  


    it("TC-205-4 User doesn't exist", (done) => {
        const unavailableUserId = userId + 1;
        let unavailableUser = {
            firstName: "noUser",
            lastName: "Tester",
            emailAdress: "no.tester@mail.nl",
            password: "Secret123",
            street: "teststreet 1",
            city: "testcity",
            phoneNumber: "06-12345678",
        }
    
        chai.request(server).put(`/user/${unavailableUserId}`)
            .set("Authorization", `Bearer ${token}`).send(unavailableUser).end((err, res) => {
            let { status, message } = res.body;
            logger.info(res.body);
            expect(status).to.equal(404);
            expect(res.body).to.be.an("object");
            expect(message).to.equal(`No user found with ID ${unavailableUserId}`);
    
            done();
            });
    });
  


    it("TC-205-6 User updated successfully", (done) => {
      const updatedUser = {
        firstName: "Amy",
        lastName: "Van",
        emailAdress: "a.van@mail.com",
        password: "NewSecret123",
        street: "newStreet",
        city: "newCity",
        phoneNumber: "06-12345679",
      };
  
      chai.request(server).put(`/user/${userId}`)
        .set("Authorization", `Bearer ${token}`).send(updatedUser).end((err, res) => {
          let { status, message, data } = res.body;
          console.log(res.body);
          expect(status).to.equal(200);
          expect(res.body).to.be.an("object");
          expect(message).to.equal("Updated user");
          expect(data).to.be.an("object");
          expect(data.firstName).to.equal(updatedUser.firstName);
          expect(data.lastName).to.equal(updatedUser.lastName);
          expect(data.emailAddress).to.equal(updatedUser.emailAdress);
          expect(data.street).to.equal(updatedUser.street);
          expect(data.city).to.equal(updatedUser.city);
          expect(data.phoneNumber).to.equal(updatedUser.phoneNumber);
  
          done();
        });
    });

});



describe("UC-206 Delete user", () => {
    it("TC-206-1 User doen't exist", (done) => {
      const noExistUserId = userId + 959;
  
        chai.request(server).delete(`/user/${noExistUserId}`)
            .end((err, res) => {
            let { status, message } = res.body;
            expect(status).to.equal(404);
            expect(res.body).to.be.an("object");
            expect(message).to.equal(`No user found with ID ${noExistUserId}`);
    
            done();
        });
    });
  


    it("TC-206-4 User deleted successfully", (done) => {
        chai
            .request(server).delete(`/user/${userId}`)
            .set("Authorization", `Bearer ${token}`)
            .end((err, res) => {
            expect(err).to.be.null;
            logger.info(res.body);
            let { status, message } = res.body;
            expect(status).to.equal(200);
            expect(message).to.equal(`User with Id ${userId} is deleted`);
            done();
            });
        });


  
  after((done) => {
    chai.request(server).delete(`/user/${notOwnerUserId}`)
    .set("Authorization", `Bearer ${token}`)
      .end((userErr, userRes) => {
        if (userErr) {
          logger.error(userErr);
        }
        done();
      });

  });

});
