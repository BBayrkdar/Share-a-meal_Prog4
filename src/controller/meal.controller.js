const express = require('express');
const logger = require("../util/utils").logger;
const pool = require('../database/mysql');
const joi = require('joi');
const dateFormater = require("date-format");
// import dateFormater from "dateformat";

const meal = joi.object({
    id: joi.number().optional(),
    name: joi.string().required(),
    description: joi.string().required(),
    isVega: joi.any().optional(),
    isVegan: joi.any().optional(),
    isToTakeHome: joi.any().optional(),
    isActive: joi.any().optional(),
    dateTime: joi.string().optional(),
    cookId: joi.number().optional(),
    price: joi.number().required(),
    maxAmountOfParticipants: joi.number().required(),
    imageUrl: joi.string().required(),
    allergenes: joi.array().items(joi.string().valid("gluten", "lactose", "noten")).optional(),
});

const updateMeal = joi.object({
    id: joi.number().optional(),
    name: joi.string().required().messages({"any.required": "Name is a required field",}),
    description: joi.string().required(),
    isVega: joi.any().optional(),
    isVegan: joi.any().optional(),
    isToTakeHome: joi.any().optional(),
    isActive: joi.any().optional(),
    dateTime: joi.string().optional(),
    cookId: joi.number().optional(),
    price: joi.number().required().messages({"any.required": "Name is a required field",}),
    maxAmountOfParticipants: joi.number().messages({
      "any.required": "Max amount of participants is a required field",}),
    imageUrl: joi.string().required(),
    allergenes: joi.array().items(joi.string().valid("gluten", "lactose", "noten")).optional(),
});

const fetchMealById = (mealId, cookId, callback) => {
    pool.getConnection((err, connection) => {
        if(err) {
            logger.error("Error getting connection from pool");
            callback({
                status: 503,
                message: err.code,
                data: {},
            });
            return;
        }

        const sqlStatement = "SELECT * FROM `meal` WHERE id = ?";
        connection.query(sqlStatement, [mealId], function(error, results, fields) {
            connection.release();

            if(error) {
                logger.error(error);
                callback({
                    status:500,
                    message: "Failed to fetch meal by id",
                    data: {
                        error,
                    },
                });
            } else if ( results.lenght === 0 ) {
                callback({
                    status:404,
                    message: `No meal found with Id ${mealId}`,
                    data: {},
                });
            } else {
                const meal = results[0];

                if(meal.cookId !== cookId) {
                    callback({
                        status:401,
                        message:"Unauthorized access denied",
                        data: {},
                    });
                } else {
                    callback(null, meal);
                }
            }
        });
    });
};


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
            connection.release();


            if(error) {
                logger.error(error);
                callback({
                    status: 500,
                    message: "Failed to excute query",
                    data: {
                        error,
                    },
                });
            } else {
                callback(null, results, fields);
            }
        });
    });
};


let controller = {
    createMeal: (req, res) => {
        const { error, value: input } = meal.validate(req.body);

        if (error) {
        logger.error(error);
        res.status(400).json({
            status: 400,
            message: error.message,
            data: {},
        });
        return;
        }

        logger.info(req.body);

        const dateTime = dateFormater(new Date(), "yyyy-mm-dd HH:MM:ss");
        const allergenes = input.allergenes ? input.allergenes.join(",") : "";
        const userId = req.userId;

        logger.info(`Created Meal by UserId: ${userId}`);

        const newMeal = {
        id: input.id,
        name: input.name,
        description: input.description,
        isActive: input.isActive || 1,
        isVega: input.isVega || 0,
        isVegan: input.isVegan || 0,
        isToTakeHome: input.isToTakeHome || 0,
        dateTime: dateTime,
        maxAmountOfParticipants: input.maxAmountOfParticipants,
        price: parseFloat(input.price),
        imageUrl: input.imageUrl,
        allergenes: allergenes,
        cookId: userId,
        };

        let sqlStatement = "INSERT INTO meal SET ?";

        executeQuery(sqlStatement, newMeal, (error, results, fields) => {
            if (error) {
                res.status(500).json({
                status: 500,
                message: "Failed to create a meal.",
                data: {
                    error,
                },
                });
            } else {
                const createdMealId = results.insertId;

                let sqlStatement = "SELECT * FROM meal WHERE id = ?";
                executeQuery(sqlStatement, createdMealId, (error, results, fields) => {
                    if (error) {
                    res.status(500).json({
                        status: 500,
                        message: "Failed to fetch meal information",
                        data: {
                            error,
                        },
                    });
                    } else {
                        const createdMeal = results[0];
                        logger.info(`Inserted a new meal with id: ${createdMealId} and cookId ${userId}`);

                    const convertedMeal = {
                        ...createdMeal,
                        isActive: createdMeal.isActive === 1 ? true : false,
                        isVega: createdMeal.isVega === 1 ? true : false,
                        isVegan: createdMeal.isVegan === 1 ? true : false,
                        isToTakeHome: createdMeal.isToTakeHome === 1 ? true : false,
                        price: parseFloat(createdMeal.price),
                    };
                    res.status(201).json({
                        status: 201,
                        message: "Meal created successfully",
                        data: convertedMeal,
                    });
                    }
                });
            }
        });
    },


    getAllMeals: (req, res) => {
        let sqlStatement = "SELECT * FROM `meal`";
    
        pool.query(sqlStatement, function (error, mealResults, fields) {
            if (error) {
                logger.error(error);
                return res.status(500).json({
                    status: 500,
                    message: "Failed to fetch meals.",
                    data: {
                        error: error,
                    },
                });
            }
    
            const cookIds = mealResults.map((meal) => meal.cookId);
    
            let getCookSqlStatement = "SELECT * FROM user WHERE id IN (?)";
            pool.query(getCookSqlStatement, [cookIds],
                function (error, cookResults, fields) {
                if (error) {
                    logger.error(error);
                    return res.status(500).json({
                    status: 500,
                    message: "Failed to fetch cook information",
                    data: {
                        error: error,
                    },
                    });
                }
    
                const cooks = cookResults.reduce((acc, cook) => {
                    const convertedCook = { ...cook };
                    convertedCook.isActive === 1 ? true : false;
                    delete convertedCook.password;
                    acc[cook.id] = convertedCook;
                    return acc;
                }, {});
    
                let getParticipantsSqlStatement = `
                SELECT * FROM meal_participants_user mpu
                INNER JOIN user ON mpu.userId = user.id
                WHERE mpu.mealId IN (?)`;
    
                const mealIds = mealResults.map((meal) => meal.id);
                pool.query(getParticipantsSqlStatement, [mealIds],
                    function (error, participantsResults, fields) {
                    if (error) {
                        logger.error(error);
                        return res.status(500).json({
                        status: 500,
                        message: "Failed to fetch participants.",
                        data: {
                            error: error,
                        },
                        });
                    }
    
                    const participantsByMeal = participantsResults.reduce((acc, participant) => {
                        const mealId = participant.mealId;
                        if (!acc[mealId]) {
                            acc[mealId] = [];
                        }
                        const convertedParticipant = {
                            ...participant,
                            isActive: participant.isActive === 1 ? true : false,
                        };
                        delete convertedParticipant.password;
                        acc[mealId].push(convertedParticipant);
                        return acc;
                    },{});
    
                    const mealsWithParticipants = mealResults.map((meal) => {
                        const convertedMeal = {
                        ...meal,
                        isActive: meal.isActive === 1 ? true : false,
                        isVega: meal.isVega === 1 ? true : false,
                        isVegan: meal.isVegan === 1 ? true : false,
                        isToTakeHome: meal.isToTakeHome === 1 ? true : false,
                        };
    
                        return {
                        meal: convertedMeal,
                        cook: cooks[meal.cookId] || {},
                        participants: participantsByMeal[meal.id] || [],
                        };
                    });
    
                    res.status(200).json({
                        status: 200,
                        message: "Successfully fetched all meals.",
                        data: mealsWithParticipants,
                    });
                });
            });
        });
    },


    getMealById: (req, res) => {
        let sqlStatement = "SELECT * FROM `meal` WHERE id = ?";
    
        const mealId = parseInt(req.params.mealId);
    
        pool.query(sqlStatement, mealId,
            function (error, mealResults, fields) {
                if (error) {
                logger.error(error);
                res.status(500).json({
                    status: 500,
                    message: "Failed to fetch meal by id",
                    data: {
                    error,
                    },
                });
                } else {
                    if (mealResults.length === 0) {
                        return res.status(404).json({
                        status: 404,
                        message: `No meal found with Id ${mealId}`,
                        data: {},
                        });
                    } else {
                        const meal = { ...mealResults[0] };
                        meal.isActive = meal.isActive === 1 ? true : false;
                        meal.isVega = meal.isVega === 1 ? true : false;
                        meal.isVegan = meal.isVegan === 1 ? true : false;
                        meal.isToTakeHome = meal.isToTakeHome === 1 ? true : false;
            
                        const cookId = meal.cookId;
            
                        let getCookSqlStatement = "SELECT * FROM user WHERE id = ?";
                        pool.query(getCookSqlStatement, cookId,
                        function (error, cookResults, fields) {
                            if (error) {
                            logger.error(error);
                            return res.status(500).json({
                                status: 500,
                                message: "Failed to fetch cook information",
                                data: {
                                error: error,
                                },
                            });
                            }
        
                            const cook = { ...cookResults[0] };
                            cook.isActive = cook.isActive === 1 ? true : false;
                            delete cook.password;
            
                            let getParticipantsSqlStatement = `SELECT * FROM meal_participants_user mpu
                            INNER JOIN user ON mpu.userId = user.id
                            WHERE mpu.mealId = ?`;
        
                            pool.query(getParticipantsSqlStatement, mealId,
                            function (error, participantsResults, fields) {
                                if (error) {
                                    logger.error(error);
                                    return res.status(500).json({
                                        status: 500,
                                        message: "Failed to fetch participants.",
                                        data: {
                                        error: error,
                                        },
                                    });
                                }
        
                                const participants = participantsResults.map((participant) => {
                                    const convertedParticipant = {
                                    ...participant,
                                    isActive: participant.isActive === 1 ? true : false,
                                    };
                                    delete convertedParticipant.password;
                                    return convertedParticipant;
                                });
            
                                res.status(200).json({
                                    status: 200,
                                    message: "Meal details retrieved successfully",
                                    data: {
                                        meal: meal,
                                        cook: cook,
                                        participants: participants,
                                    },
                                });
                            });
                        });
                    }
                }
            }
        );
    },


    updateMealById: (req, res) => {
        const mealId = req.params.mealId;
        const cookId = req.userId;
        logger.info(cookId);
    
        const { error, value: input } = updateMeal.validate(req.body);
    
        if (error) {
            return res.status(400).json({
                status: 400,
                message: "Invalid input",
                data: { error: error.details[0].message },
            });
        }
    
        fetchMealById(mealId, cookId, (error, meal) => {
            if (error) {
                if (error.status === 401) {
                return res.status(401).json({
                    status: 401,
                    message: `Not authorized to update meal with ID ${mealId}`,
                    data: {},
                });
                } else {
                return res.status(error.status).json(error);
                }
            }
        
            // Update the meal in db
            const updateSqlStatement = "UPDATE `meal` SET ? WHERE id = ?";
    
            executeQuery(updateSqlStatement,[input, mealId],
                (error, results, fields) => {
                if (error) {
                    logger.error(error);
                    return res.status(500).json({
                    status: 500,
                    message: "Failed to update meal",
                    data: {
                        error,
                    },
                    });
                }
        
                if (results.affectedRows === 0) {
                    return res.status(404).json({
                    status: 404,
                    message: `No meal found with Id ${mealId}`,
                    data: {},
                    });
                }
    
                logger.info(`Updated meal by id: ${mealId}`);
    
                const sqlStatement = "SELECT * FROM `meal` WHERE id = ?";
                executeQuery(selectMealStatement, mealId,
                    (error, results, fields) => {
                    if (error) {
                        logger.error(error);
                        return res.status(500).json({
                        status: 500,
                        message: "Error retrieving updated meal information",
                        data: {
                            error,
                        },
                        });
                    }
    
                    const updatedMeal = results[0];
        
                    const convertedMeal = {
                        ...updatedMeal,
                        isActive: updatedMeal.isActive === 1 ? true : false,
                        isVega: updatedMeal.isVega === 1 ? true : false,
                        isVegan: updatedMeal.isVegan === 1 ? true : false,
                        isToTakeHome: updatedMeal.isToTakeHome === 1 ? true : false,
                    };
    
                    res.status(201).json({
                        status: 201,
                        message: "Updated meal successfully",
                        data: convertedMeal,
                    });
                });
            });
        });
    },
    
    
    
    deleteMealById: (req, res) => {
        const mealId = parseInt(req.params.mealId);
        const cookId = req.userId;
        logger.info(`Request for deleting meal with id ${mealId} from user with id ${cookId}`);
    
        const deleteMealSqlStatement = "DELETE FROM `meal` WHERE id = ?";
    
        fetchMealById(mealId, cookId, (error, meal) => {
            if (error) {
                if (error.status === 401) {
                return res.status(401).json({
                    status: 401,
                    message: `Not authorized to delete meal with Id ${mealId}`,
                    data: {},
                });
                } else {
                    return res.status(error.status).json(error);
                }
            } else {
                pool.query(deleteMealSqlStatement, [mealId],
                function (error, deleteResults, fields) {
                    if (error) {
                        logger.error(error);
                        res.status(500).json({
                            status: 500,
                            message: "Failed to delete meal by id",
                            data: {
                            error,
                            },
                        });
                    } else if (deleteResults.affectedRows === 0) {
                        res.status(404).json({
                            status: 404,
                            message: `No meal found with Id ${mealId}`,
                            data: {},
                        });
                    } else {
                        res.status(200).json({
                            status: 200,
                            message: `Meal with Id ${mealId} is deleted`,
                            data: {},
                        });
                    }
                });
            }
        });
    },
};

module.exports = controller;