var Browserman = require('browserman-client');
var url = require('url');
var logger = require('../logger');
var Reporter = require('../reporters/base');

exports.test = function(config){

    var browserman_urls = (config.browserman || "").split(":");

    var browserman = new Browserman({
        host: browserman_urls[0],
        port: browserman_urls[1]
    });

    var browser = config.browser;
    if(browser){
        try{
            browser = JSON.parse(browser);
        }catch(e){
            logger.error("Error parsing argument `browser`",e);
            process.exit(1);
        }
    }

    logger.verbose("connect to %s", browserman.serverAddress);
    var test = browserman.test({
        requirement: browser || null,
        path: config.path
    });
    new Reporter(test);
}

exports.args = ["cortexserver","browserman"];