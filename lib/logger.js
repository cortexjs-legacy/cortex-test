var winston = require('winston');
var argv = require('optimist').alias('v', 'verbose').argv;

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