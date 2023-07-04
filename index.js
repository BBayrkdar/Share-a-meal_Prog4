const express = require("express");
const bodyParser = require("body-parser");
const logger = require("./src/util/utils").logger;
const app = express();
const port = process.env.PORT || 3000;
require('dotenv').config();

const mealRouter = require('./src/routes/meal.routes');
const userRouter = require('./src/routes/user.routes');
const infoRouter = require('./src/routes/info.routes');
const loginRouter = require('./src/routes/login.routes');
const partiRouter = require('./src/routes/participate.routes');

app.use(bodyParser.urlencoded({
    extended: false}));
app.use(express.static("public"));
app.use(express.json());
// For access to application/json request body
app.use(bodyParser.json());

app.use("*", (req, res, next) => {
    const method = req.method;
    logger.trace(`Methode ${method} is aangeroepen`);
    next();
});

var cors = require('cors');
app.use(cors({
    credentials: true,
    origin: true,
    allowedHeaders: ['Content-Type', 'Authorization']}));

app.use("/meal", mealRouter);
app.use("/user", userRouter);
app.use("/info", infoRouter);
app.use("/login", loginRouter);
app.use("/meal", partiRouter);

app.use("*", (req, res) => {
    logger.warn("Invalid endpoint called: ", req.path);
    res.status(404).json({
      status: 404,
      message: "Endpoint not found",
      data: {},
    });
  });

// app.use((err, req, res, next) => {
//     logger.error(err.code, err.message);
//     res.status(err.code).json({
//       statusCode: err.code,
//       message: err.message,
//       data: {},
//     });
// });

app.use((err, req, res, next) => {
    const statusCode = err.status || 500; // Use 500 as the default status if err.status is not defined
    logger.error(statusCode, err.message);
    res.status(statusCode).json({
        statusCode: statusCode,
        message: err.message,
        data: {},
    });
});

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});

module.exports = app;