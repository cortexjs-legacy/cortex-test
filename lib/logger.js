var winston = require('winston');
var argv = require('optimist').argv;
var logger = new(winston.Logger)({
    transports: [
        new(winston.transports.Console)({
            level: argv.verbose ? "verbose" : "info",
            timestamp: false,
            colorize: true,
        })
    ]
});

module.exports = logger;