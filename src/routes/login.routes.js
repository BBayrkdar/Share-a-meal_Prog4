const express = require("express");
const router = express.Router();
const app = express();

const loginController = require("../controller/login.controller");

router.post("", loginController.validateLogin, loginController.login);

router.use(loginController.validateToken);

module.exports = router;