const express = require('express');
const bcyrpt = require('bcrypt');
const logger = require("../util/utils").logger;
const pool = require('../database/mysql');
const joi = require('joi');
const jwt = require('jsonwebtoken');
// const { connection } = require('mysql2/typings/mysql/lib/Connection');
require("dotenv").config();
const jwtSecretKey = process.env.JWT_SECRET_KEY;
const app = express();

const users = [];

let controller = {
    login: (req, res, next) => {
        const { emailAdress, password } = req.body;

        pool.getConnection((err, connection) => {
            if(err) {
                logger.error("Error getting connection from pool");
                return next({
                    status: 500,
                    message: err.code,
                    data: {},
                });
            }

            connection.query(
                `SELECT * FROM user WHERE emailAdress=?`, [emailAdress],
                (error, results) => {
                    if (error) {
                        logger.error("Error excuting SQL query");
                        return next({
                            status: 500,
                            message: error.message,
                            data: {},
                        });
                    }

                    if (results.length === 0) {
                        return res.status(404).json({
                            status: 404,
                            message: "User not found",
                            data: {},
                        });
                    }

                    const user = results[0];

                    // Compare the provided password with the hashed password stored in db
                    bcyrpt.compare(password, user.password, (err, result) => {
                        if (err) {
                            logger.error("Failed to compare passwords");
                            return next({
                                status: 500,
                                message: "Failed ro compare passwords",
                                data: {
                                    error: err,
                                },
                            });
                        }

                        if (!result) {
                            // incorrect password
                            return res.status(401).json({
                                status: 401,
                                message: "Invalid password",
                                data: {},
                            });
                        }

                        delete user.password;

                        // create payload
                        const payload = {
                            userId: user.id,
                        };

                        // Generate token
                        const token = jwt.sign(payload, jwtSecretKey);

                        const userWithToken = { ...user, token };

                        res.status(200).json({
                            status: 200,
                            message: `Welcome ${user.username}`,
                            data: userWithToken,
                        });
                        
                    });
                }
            );
            connection.release();
        });
    },

    // validate function for api login
    // validates that the required body is present.
    validateLogin: (req, res, next) => {
        const schema = joi.object({
            emailAdress: joi.string()
                .required()
                .label("Email Address")
                .messages({ "any.required": `Email address is required` }),
            password: joi.string()
                .pattern(/^(?=.*[A-Z])(?=.*\d).{8,}$/)
                .required()
                .label("Password")
                .messages({
                    "any.required": `Password is required`,
                    "string.pattern.base": `Password is not valid.`,
                }),
        });
    
        const { error } = schema.validate(req.body);
    
        if (error) {
            return res.status(400).json({
                status: 400,
                message: error.details[0].message,
                data: {},
            });
        }
        next();
    },
    
    validateToken(req, res, next) {
        const authHeader = req.headers.authorization;
    
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                status: 401,
                message: "Unauthorized: Missing or invalid token",
                data: {},
            });
        }
    
        const token = authHeader.split(" ")[1];
    
        try {
            const decoded = jwt.verify(token, jwtSecretKey);
    
            req.userId = decoded.userId;
    
            logger.info(`Validation for token called with userId: ${req.userId}`);
    
            next();
        } catch (err) {
            return res.status(401).json({
                status: 401,
                message: "Unauthorized: Invalid token",
                data: {},
            });
        }
      },
}

module.exports = controller;