const express = require('express');
const bcrypt = require('bcrypt');
const logger = require("../util/utils").logger;
const pool = require('../database/mysql');
const joi = require('joi');
// const { console } = require('tracer');

const user = joi.object({
    id: joi.number().optional(),
    firstName: joi.string().required(),
    lastName: joi.string().min(2).required(),
    street: joi.string().allow("").required(),
    city: joi.string().allow("").required(),
    isActive: joi.boolean(),
    emailAdress: joi.string().pattern(
        new RegExp(/^[a-zA-Z]\.[a-zA-Z0-9]{2,}@([a-zA-Z]{2,}\.[a-zA-Z]{2,3})$/)
        ).required().messages({
        "string.pattern.base": `Email address is not valid`,
        }),
    password: joi.string().pattern(/^(?=.*[A-Z])(?=.*\d).{8,}$/)
        .required().messages({
        "string.empty": `Password address cannot be empty`,
        "any.required": `Password is required`,
        "string.pattern.base": `Password is not valid. It should be at least 8 characters and contain at least one uppercase letter and one digit.`,
        }),
    phoneNumber: joi.string().pattern(/^(06[-\s]?\d{8}|\d{10,11})$/)
        .optional().messages({
        "string.empty": `Phone number cannot be empty`,
        "any.required": `Phone number is required`,
        "string.pattern.base": `Phone number is not valid. It should start with '06' and be followed by 8 digits.`,
        "string.length": `Phone number should be either 10 or 11 digits long.`,
        }),
});

const updateUser = joi.object({
    id: joi.number().optional(),
    firstName: joi.string().optional(),
    lastName: joi.string().min(2).optional(),
    street: joi.string().allow("").optional(),
    city: joi.string().allow("").optional(),
    isActive: joi.boolean().optional(),
    emailAdress: joi.string().pattern(
        new RegExp(/^[a-zA-Z]\.[a-zA-Z0-9]{2,}@([a-zA-Z]{2,}\.[a-zA-Z]{2,3})$/)
        ).required().messages({
        "string.pattern.base": `Email address is not valid`,
        }),
    password: joi.string().pattern(/^(?=.*[A-Z])(?=.*\d).{8,}$/)
        .optional().messages({
        "string.empty": `Password address cannot be empty`,
        "any.required": `Password is required`,
        "string.pattern.base": `Password is not valid. It should be at least 8 characters and contain at least one uppercase letter and one digit.`,
        }),
    phoneNumber: joi.string().pattern(/^(06[-\s]?\d{8}|\d{10,11})$/)
        .optional().messages({
        "string.empty": `Phone number cannot be empty`,
        "any.required": `Phone number is required`,
        "string.pattern.base": `Phone number is not valid. It should start with '06' and be followed by 8 digits.`,
        "string.length": `Phone number should be either 10 or 11 digits long.`,
        }),
});


const executeQuery = (sqlStatement, params, callback) => {
    pool.getConnection((err, connection) => {
        if(err) {
            logger.error("Error getting connection from pool");
            callback({
                status: 500,
                message: err.code,
                data: {},
            });
            return;
        }

        connection.query(sqlStatement, params, (error, results, fields) => {
            // release the connection back to the pool
            connection.release();

            if(error) {
                if(error.code == "ER_DUP_ENTRY") {
                    callback({
                        status: 403,
                    });
                } else {
                    logger.error(error);

                    callback({
                        status: 500,
                        message: "Failed to excute query",
                        data: {
                            error,
                        },
                    });
                }
                return;
            }

            callback(null, results, fields);
        });
    });
};

let controller= {
    // register a new user
    createUser: (req, res, next) => {
        const { error, value: input } = user.validate(req.body);

        if(error) {
            logger.error(error);
            res.status(400).json({
                status: 400,
                message: error.message,
                data: {},
            });
            return;
        }

        // if (typeof console == "undefined") {
        //     window.console = {
        //         log: function () {}
        //     };
        // }

        console.log(req.body);

        const newUser = {
            id: input.id,
            firstName: input.firstName,
            lastName: input.lastName,
            street: input.street,
            city: input.city,
            isActive: input.isActive || 1,
            emailAdress: input.emailAdress,
            password: input.password,
            phoneNumber: input.phoneNumber,
          };

          bcrypt.hash(input.password, 10, (err, hashedPassword) => {
            if(err) {
                logger.error(err);
                res.status(500).json({
                    status: 500,
                    message: "Failed to create new user",
                    data: {
                        error: err,
                    },
                });
                return;
            }

            newUser.password = hashedPassword;

            let sqlStatement = "INSERT INTO user SET ?";
            executeQuery(sqlStatement, newUser, function(error, results, fields){
                if(error) {
                    logger.error(error);
                    if(error.status == 403) {
                        res.status(403).json({
                            status: 403,
                            message: 'emailAdress already exists',
                            data: {},
                        });
                    } else {
                        res.status(500).json({
                            status: 500,
                            message: "Failed to create a new user.",
                            data: {
                                error: error,
                            },
                        });
                    }
                } else {
                    const userId = results.insertId;

                    const statement = "SELECT * FROM user WHERE id = ?";
                    executeQuery(statement, userId, function(error, rows, fields) {
                        if(error) {
                            logger.error(error);
                            res.status(500).json({
                                status: 500,
                                message: "Failed to fetch user info",
                                data: {
                                    error: error,
                                },
                            });
                        } else {
                            const createdUser = rows[0];
                            logger.info("Inserted new user with id:", userId);

                            createdUser.isActive = createdUser.isActive === 1 ? true : false;

                            res.status(201).json({
                                status: 201,
                                message: "User created successfully",
                                data: createdUser,
                            });
                        }
                    })
                }
            });
          });

    },

    // get all users
    getAllUser: (req, res) => {
        const filters = req.query;
        let sqlStatement = "SELECT * FROM `user`";
        // Initialize values of users as an empty array
        let users = [];

        if (Object.keys(filters).length > 0) {
        const validFields = ["firstName", "lastName", "emailAdress", "isActive"];
        const conditions = [];

        for (const key in filters) {
            if (validFields.includes(key)) {
                conditions.push(`${key} = ?`);
                users.push(filters[key]);
            }
        }

        if (conditions.length > 0) {
            sqlStatement += " WHERE " + conditions.join(" AND ");
        }
        }

        executeQuery(sqlStatement, users, function (error, results, fields) {
        if (error) {
            console.log(error);
            res.status(500).json({
            status: 500,
            message: "Failed to retrieve users",
            data: {
                error: error,
            },
            });
        } else {
            const users = results.map((user) => {
            const convertedUser = {
                ...user,
                isActive: user.isActive === 1 ? true : false,
            };
            return convertedUser;
            });

            res.status(200).json({
            status: 200,
            message: "Users retrieved successfully.",
            data: users,
            });
        }
        });
    },

    // Get user by userId
    getUserById: (req, res) => {
        const userId = parseInt(req.params.userId);

        let sqlStatement = "SELECT * FROM user WHERE id = ?";

        executeQuery(sqlStatement, [userId], function (error, results, fields) {
        if (error) {
            logger.error(error);
            res.status(500).json({
            status: 500,
            message: `Error retrieving user by ID`,
            data: {
                error: error,
            },
            });
        } else if (results.length === 0) {
            res.status(404).json({
            status: 404,
            message: `No user found with Id ${userId}`,
            data: {},
            });
        } else {
            const user = results[0];
            user.isActive = user.isActive === 1 ? true : false;
            logger.info(`Retrieved user by id: ${userId}`);
            logger.info(`getUserById ${user}`);
            res.status(200).json({
            status: 200,
            message: "User retrieved by id successfully.",
            data: user,
            });
        }
        });
    },

    // get the profile of a specific user
    getUserProfile: (req, res) => {
        const userId = req.userId;

        let selectUserSqlStatement = "SELECT * FROM `user` WHERE id = ?";

        executeQuery(
        selectUserSqlStatement,
        [userId],
        function (error, results, fields) {
            if (error) {
            logger.error(error);
            return res.status(500).json({
                status: 500,
                message: "Failed to fetch user profile",
                data: {
                error,
                },
            });
            }

            if (results.length === 0) {
            return res.status(404).json({
                status: 404,
                message: `User with ID ${userId} not found`,
                data: {},
            });
            }

            const user = results[0];
            user.isActive = user.isActive === 1 ? true : false;

            res.status(200).json({
            status: 200,
            message: "User profile retrieved successfully",
            data: user,
            });
        }
        );

    },

    // update the information of a user using userId
    updateUser: (req, res) => {
        const userId = parseInt(req.params.userId);
        const requestedUserId = req.userId;

        // Check if the user exists in db
        let selectUserSqlStatement = "SELECT * FROM `user` WHERE id = ?";
        executeQuery(selectUserSqlStatement, [userId],
        function (error, results, fields) {
            if (error) {
            logger.error(error);
            return res.status(500).json({
                status: 500,
                message: "Failed to fetch user profile",
                data: {
                error,
                },
            });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    status: 404,
                    message: `No user found with Id ${userId}`,
                    data: {},
                });
            }

            // Check if the user is the owner
            if (userId !== requestedUserId) {
                return res.status(403).json({
                    status: 403,
                    message: "You are not authorized to update this user's data.",
                    data: {},
                });
            }

            const { inputError, value: input } = updateUser.validate(req.body);

            if (inputError) {
                logger.error(inputError);
                res.status(400).json({
                    status: 400,
                    message: inputError.message,
                    data: {},
                });
                return;
            }

            const allowedFields = [
                "firstName",
                "lastName",
                "street",
                "city",
                "isActive",
                "emailAdress",
                "password",
                "phoneNumber",
            ];

            const filtered = Object.keys(input)
                .filter((key) => allowedFields.includes(key))
                .reduce((obj, key) => {
                    obj[key] = input[key];
                    return obj;
                }, {});

            // Hash the password before updating
            if (filtered.password) {
                bcrypt.hash(filtered.password, 10, (err, hashedPassword) => {
                if (err) {
                    logger.error(err);
                    return res.status(500).json({
                    status: 500,
                    message: "Failed to hash the password",
                    data: {
                        error: err,
                    },
                    });
                }
                
                filtered.password = hashedPassword;

                let sqlStatement = "UPDATE user SET ? WHERE id = ?";
                
                executeQuery(sqlStatement, [filtered, userId],
                    function (error, results, fields) {
                        if (error) {
                        console.log(error);
                        res.status(500).json({
                            status: 500,
                            message: "Error updating user",
                            data: {
                            error: error,
                            },
                        });
                        } else if (results.affectedRows === 0) {
                        res.status(404).json({
                            status: 404,
                            message: `No user found with Id ${userId}`,
                            data: {},
                        });
                        } else {
                        logger.info(`Updated user by id: ${userId}`);
                        let sqlStatement = "SELECT * FROM user WHERE id = ?";
                        executeQuery(sqlStatement, userId,
                            function (error, results, fields) {
                            if (error) {
                                logger,error(error);
                                res.status(500).json({
                                status: 500,
                                message: "Error retrieving updated user information",
                                data: {
                                    error: error,
                                },
                                });
                            } else {
                                const updatedUser = results[0];
                                updatedUser.isActive =
                                updatedUser.isActive === 1 ? true : false;
                                res.status(200).json({
                                status: 200,
                                message: "User info updated",
                                data: updatedUser,
                                });
                            }
                            }
                        );
                        }
                    }
                );
                
                });
            } else {
                // If password not provided, proceed with the update
                let sqlStatement = "UPDATE user SET ? WHERE id = ?";
                executeQuery(sqlStatement, [filtered, userId], function (error, results, fields) {
                    if (error) {
                      console.log(error);
                      res.status(500).json({
                        status: 500,
                        message: "Error updating user",
                        data: {
                          error: error,
                        },
                      });
                    } else if (results.affectedRows === 0) {
                      res.status(404).json({
                        status: 404,
                        message: `No user found with Id ${userId}`,
                        data: {},
                      });
                    } else {
                      logger.info(`Updated user by id: ${userId}`);
                      let sqlStatement = "SELECT * FROM user WHERE id = ?";
                      executeQuery(sqlStatement, userId, function (error, results, fields) {
                        if (error) {
                          logger.error(error);
                          res.status(500).json({
                            status: 500,
                            message: "Error retrieving updated user information",
                            data: {
                              error: error,
                            },
                          });
                        } else {
                          const updatedUser = results[0];
                          updatedUser.isActive = updatedUser.isActive === 1 ? true : false;
                          res.status(200).json({
                            status: 200,
                            message: "User info updated",
                            data: updatedUser,
                          });
                        }
                      });
                    }
                });

            }          

        });
    },


    // delete user using userId
    deleteUser: (req, res) => {
        const userId = parseInt(req.params.userId);

        let sqlStatement = "DELETE FROM user WHERE id = ?";

        executeQuery(sqlStatement, userId,
            function (error, results, fields) {
        if (error) {
            logger.error(error);
            res.status(500).json({
            status: 500,
            message: `Error deleting user by Id`,
            data: {
                error: error,
            },
            });
        } else if (results.affectedRows === 0) {
            res.status(404).json({
            status: 404,
            message: `No user found with Id ${userId}`,
            data: {},
            });
        } else {
            logger.info("Deleted user by id: ", userId);
            res.status(200).json({
            status: 200,
            message: `User with Id ${userId} is deleted`,
            data: {},
            });
        }
        });
    },

};

module.exports = controller;