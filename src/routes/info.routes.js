const express = require('express');
const router = express.Router();

const infoController = require('../controller/info.controller');

router.get("", infoController.info);

module.exports = router;