var logger = require("../logger");
require("colors");



module.exports = Base;

/**
 * Default symbol map.
 */

var symbols = module.exports.symbols = {
  ok: '✓',
  err: '✖',
  dot: '․'
};

var paddingLeft = "  ";

// With node.js on Windows: use symbols available in terminal default fonts
if ('win32' == process.platform) {
  module.exports.symbols.ok = '\u221A';
  module.exports.symbols.err = '\u00D7';
  module.exports.symbols.dot = '.';
}

Base.prototype.hr = function(ch, len){
    ch = ch || "-";
    len = len || 40;
    var str = "";
    for(var i = 0; i < len; i++){
        str += ch;
    }
    console.log(paddingLeft + "%s",str.grey);
}

Base.prototype.br = function(){
    console.log("");
}


Base.prototype.browser = function(browser){
    var fmt = paddingLeft + "  %s %s %s";
    this.hr();
    console.log(fmt,browser.name,browser.version,browser.os);
    this.hr();
    this.br();
}

Base.prototype.passes = function(passes){
    var fmt = paddingLeft + "%s %s"
    passes.forEach(function(pass){
        console.log(fmt,symbols.ok.green,pass.title.grey);
    });
}

Base.prototype.failures = function(failures){
    if(failures.length){
        this.hasFailure = true;
    }
    failures.forEach(function(fail){
        var fmt = paddingLeft + "%s %s \n    %s";
        console.log(fmt, symbols.err.red, fail.title, fail.err.message.red);
    });
}

Base.prototype.conclusion = function(data){
    var fmt = paddingLeft + "  %d %s";
    this.br();
    console.log(fmt.green,data.passes.length,"passing");
    data.failures.length && console.log(fmt.red,data.failures.length,"failing");
    this.br();
}

function Base(runner){
    var self = this;
    self.hasFailure = false;
    runner.on('done', function(result) {
        var browser = result.browser;
        var data = result.data;

        self.browser(result.browser);
        self.passes(data.passes);
        self.failures(data.failures);
        self.conclusion(data);
    }).on('complete', function() {
        process.exit(self.hasFailure?1:0);
    }).on('error',function(error){
        logger.error(error.message);
    });
}