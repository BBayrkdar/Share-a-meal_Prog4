const express = require("express");
const router = express.Router();

const partiController = require("../controller/participate.controller");
const loginController = require("../controller/login.controller");

router.post("/:mealId/participate", loginController.validateToken, partiController.signUpforMeal);

router.get("/:mealId/participants", partiController.getAllParticipants);

router.get("/:mealId/participants/:participantId", partiController.getParticipantById);

router.delete("/:mealId/participate", loginController.validateToken, partiController.unregisterforMeal);

module.exports = router;