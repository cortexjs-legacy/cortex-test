var logger = require('../logger');
var open = require('open');
var events = require('events');
var util = require('util');

util.inherits(Runner, events);

function Runner(config){
    this.url = config.url;
    return this;
}

Runner.prototype.run = function(){
    var url = this.url;
    logger.info("open browser to visit %s", url);
    open(url);
    this.emit("complete");
    return this;
}

exports.runner = Runner;