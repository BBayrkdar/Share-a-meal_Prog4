const express = require("express");
const router = express.Router();

const mealController = require("../controller/meal.controller");
const loginController = require("../controller/login.controller");

router.post("", loginController.validateToken, mealController.createMeal);

router.get("", mealController.getAllMeals);

router.get("/:mealId", mealController.getMealById);

router.put("/:mealId", loginController.validateToken, mealController.getMealById);

router.delete("/:mealId", loginController.validateToken, mealController.deleteMealById);

module.exports = router;