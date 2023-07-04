const express = require("express");
const router = express.Router();

const userController = require('../controller/user.controller');
const loginController = require('../controller/login.controller');

router.post("", userController.createUser);

router.get("", userController.getAllUser);

router.get("/:userId", loginController.validateToken, userController.getUserById);

router.get("/profile", loginController.validateToken, userController.getUserProfile);

router.put("/:userId", loginController.validateToken, userController.updateUser);

router.delete("/:userId", loginController.validateToken, userController.deleteUser);


module.exports = router;