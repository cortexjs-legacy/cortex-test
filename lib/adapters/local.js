var logger = require('../logger');
var open = require('open');

function Runner(config){
    this.url = config.url;
}

Runner.prototype.run = function(){
    var url = this.url;
    logger.info("open browser to visit %s", url);
    open(url);
    var emitter = new events.EventEmitter();
    process.nextTick(function(){
        emitter.emit("complete");
    });
    return emitter;
}

exports.runner = Runner;