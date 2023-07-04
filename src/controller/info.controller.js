const { logger } = require("../util/utils");

module.exports = {
    info: (req, res) => {
        logger.info("Get server information");
        res.status(201).json({
            status: 201,
            message: 'Server info-endpoint',
            data: {
                studentName: "Baraa Bayrkdar",
                studentNumber: 2210363,
                description: "Welkom bij de server API van de share a meal."
            },
        });
    },
};
